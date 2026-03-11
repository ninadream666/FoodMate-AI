"""
CollaborativeAgent — 协同过滤智能体

职责:
- 利用 FoodCF-Encoder (自训练领域专用嵌入模型) 编码用户和餐厅
- 通过 Neural Collaborative Filtering (NCF) 网络计算交互分数
- 挖掘"与你消费习惯相似的用户还喜欢什么"的跨用户知识

架构集成:
  CollaborativeAgent 与 ContextAgent、ProfilerAgent 并行执行
  (通过 ParallelOrchestrator 编排)，输出 collaborative_scores
  注入 DecisionAgent 的 Contextual Bandit 评分公式作为第五层信号。

降级策略:
  FoodCF-Encoder 微调模型 → GTE-Qwen2 预训练 → TF-IDF 哈希嵌入
  NCF 模型 → 余弦相似度
  系统冷启动 (无数据) → 返回空 scores，不影响现有推荐

技术基础:
  [1] He et al., "Neural Collaborative Filtering", WWW 2017
  [2] Wang et al., "Improving Text Embeddings with LLMs" (E5-Mistral), NAACL 2024
  [3] Lee et al., "NV-Embed", NeurIPS 2024
  [4] Ren et al., "RLMRec", WWW 2024
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import logging
import os

import numpy as np

from .base_agent import BaseAgent, Tool, global_tool_registry

logger = logging.getLogger(__name__)

# 协同过滤分数在最终推荐公式中的默认权重
CF_SCORE_WEIGHT = float(os.getenv("CF_SCORE_WEIGHT", "0.15"))

# 新用户 (无订单历史) 时 CF 权重自动衰减系数
CF_COLD_START_DECAY = float(os.getenv("CF_COLD_START_DECAY", "0.33"))

# 嵌入缓存: restaurant_id → embedding
_restaurant_embed_cache: Dict[str, "np.ndarray"] = {}


class CollaborativeAgent(BaseAgent):
    """
    协同过滤智能体 — 基于 FoodCF-Encoder + NCF 的跨用户推荐信号
    """

    def __init__(self):
        super().__init__(
            name="CollaborativeAgent",
            description="协同过滤智能体 - 基于 FoodCF-Encoder + NCF 挖掘用户间行为关联"
        )

        # ML 组件 (懒加载)
        self._encoder = None
        self._ncf_engine = None
        self._available = None  # None = 未检测

        self._register_tools()

    def _ensure_components(self):
        """确保 ML 组件已加载"""
        if self._encoder is not None:
            return

        try:
            from ..ml.foodcf_encoder import get_foodcf_encoder
            from ..ml.ncf_model import get_ncf_engine

            self._encoder = get_foodcf_encoder()
            self._ncf_engine = get_ncf_engine()
            self._available = True
            logger.info(
                f"✅ CollaborativeAgent 组件就绪 "
                f"(Encoder: {self._encoder.mode}, NCF: {self._ncf_engine.mode})"
            )
        except Exception as e:
            logger.warning(f"⚠️ CollaborativeAgent 组件初始化失败: {e}")
            self._available = False

    def _register_tools(self):
        """注册 MCP 工具"""
        cf_tool = Tool(
            name="collaborative_filtering_score",
            description="基于协同过滤模型计算用户-餐厅匹配分数",
            input_schema={
                "type": "object",
                "properties": {
                    "user_profile_text": {"type": "string", "description": "用户画像文本"},
                    "restaurant_descriptions": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "餐厅描述文本列表",
                    },
                },
                "required": ["user_profile_text", "restaurant_descriptions"],
            },
            handler=self._cf_score_handler,
        )
        global_tool_registry.register(cf_tool)

    async def _cf_score_handler(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """MCP 工具处理函数"""
        user_text = params.get("user_profile_text", "")
        rest_descs = params.get("restaurant_descriptions", [])

        self._ensure_components()
        if not self._available:
            return {"error": "Collaborative filtering components not available"}

        user_embed = self._encoder.encode_user(user_text)
        rest_embeds = self._encoder.encode_restaurants_batch(rest_descs)
        scores = self._ncf_engine.predict(user_embed, rest_embeds)

        return {"scores": scores.tolist()}

    def get_capabilities(self) -> List[str]:
        return [
            "collaborative_filtering",
            "user_embedding",
            "restaurant_embedding",
            "cross_user_recommendation",
        ]

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        核心处理逻辑

        Args:
            input_data:
                - restaurants: List[Dict] 候选餐厅列表
                - profile_analysis: Dict 用户画像分析结果 (来自 ProfilerAgent)
                - user_id: str

        Returns:
            collaborative_scores: Dict[restaurant_id, float]
            cf_weight: float  建议的 CF 权重 (冷启动时自动衰减)
            encoder_mode: str
            ncf_mode: str
        """
        start_time = datetime.now()
        self.update_state("processing", "collaborative_filtering")

        try:
            self._ensure_components()

            if not self._available:
                logger.info("ℹ️ CollaborativeAgent 降级: 组件不可用，返回空分数")
                return self._empty_result("components_unavailable")

            restaurants = input_data.get("restaurants", [])
            profile_analysis = input_data.get("profile_analysis", {})
            user_id = input_data.get("user_id", "anonymous")

            if not restaurants:
                return self._empty_result("no_restaurants")

            # ==========================================
            # 1. 构建用户画像文本 (用于 User Tower)
            # ==========================================
            user_profile_text = self._build_user_profile_text(profile_analysis, user_id)
            is_cold_start = self._is_cold_start(profile_analysis)

            # ==========================================
            # 2. 构建餐厅描述文本 (用于 Restaurant Tower)
            # ==========================================
            restaurant_texts = []
            restaurant_ids = []
            for r in restaurants:
                rid = str(r.get("id", r.get("restaurant_id", "")))
                restaurant_ids.append(rid)
                restaurant_texts.append(self._build_restaurant_text(r))

            # ==========================================
            # 3. 编码
            # ==========================================
            user_embed = await asyncio.get_event_loop().run_in_executor(
                None, self._encoder.encode_user, user_profile_text
            )

            # 餐厅嵌入: 优先使用缓存
            rest_embeds = await self._get_restaurant_embeddings(restaurant_ids, restaurant_texts)

            # ==========================================
            # 4. NCF 交互预测
            # ==========================================
            scores = await asyncio.get_event_loop().run_in_executor(
                None, self._ncf_engine.predict, user_embed, rest_embeds
            )

            # 构建 restaurant_id → score 映射
            collaborative_scores = {}
            for rid, score in zip(restaurant_ids, scores):
                collaborative_scores[rid] = float(score)

            # 冷启动时衰减权重
            cf_weight = CF_SCORE_WEIGHT
            if is_cold_start:
                cf_weight *= CF_COLD_START_DECAY
                logger.info(f"🧊 冷启动用户，CF 权重衰减: {CF_SCORE_WEIGHT} → {cf_weight:.3f}")

            processing_time = (datetime.now() - start_time).total_seconds() * 1000

            result = {
                "success": True,
                "agent": self.name,
                "collaborative_scores": collaborative_scores,
                "cf_weight": cf_weight,
                "encoder_mode": self._encoder.mode,
                "ncf_mode": self._ncf_engine.mode,
                "is_cold_start": is_cold_start,
                "num_scored": len(collaborative_scores),
                "processing_time_ms": processing_time,
            }

            self.update_state("completed", "collaborative_filtering", result)
            logger.info(
                f"✅ CollaborativeAgent 完成 ({processing_time:.0f}ms) "
                f"- 评分 {len(collaborative_scores)} 家餐厅 "
                f"(Encoder: {self._encoder.mode}, NCF: {self._ncf_engine.mode})"
            )
            return result

        except Exception as e:
            logger.error(f"❌ CollaborativeAgent 处理失败: {e}", exc_info=True)
            self.update_state("error", error=str(e))
            return self._empty_result(f"error: {e}")

    def _empty_result(self, reason: str) -> Dict[str, Any]:
        """返回空结果 (降级/冷启动)"""
        return {
            "success": True,
            "agent": self.name,
            "collaborative_scores": {},
            "cf_weight": 0.0,
            "encoder_mode": "none",
            "ncf_mode": "none",
            "is_cold_start": True,
            "num_scored": 0,
            "degraded_reason": reason,
            "processing_time_ms": 0.0,
        }

    def _build_user_profile_text(self, profile_analysis: Dict[str, Any], user_id: str) -> str:
        """
        从 ProfilerAgent 结果构建用户画像文本

        RLMRec 风格: 将结构化画像转为自然语言描述,
        使 FoodCF-Encoder 能充分理解用户偏好语义。
        """
        profile = profile_analysis.get("profile", {})
        if not profile:
            return f"用户{user_id}，暂无历史偏好数据"

        parts = []

        # 菜系偏好
        cuisines = profile.get("preferred_cuisines") or profile.get("cuisine_preferences", [])
        if cuisines:
            parts.append(f"偏好菜系: {'、'.join(cuisines[:5])}")

        # 口味偏好
        tastes = profile.get("taste_preferences", [])
        if tastes:
            parts.append(f"口味: {'、'.join(tastes[:5])}")

        # 价格区间
        price_range = profile.get("price_range", {})
        if price_range:
            min_p = price_range.get("min", 0)
            max_p = price_range.get("max", 100)
            parts.append(f"消费水平: {min_p}-{max_p}元")

        # 饮食限制
        restrictions = profile.get("dietary_restrictions", [])
        if restrictions:
            parts.append(f"饮食限制: {'、'.join(restrictions)}")

        # 用户分群
        segment = profile.get("user_segment", "standard")
        if segment != "standard":
            parts.append(f"用户类型: {segment}")

        # 订单频率
        order_freq = profile.get("order_frequency", "")
        if order_freq:
            parts.append(f"点餐频率: {order_freq}")

        # 菜系订单频率 (历史行为)
        cuisine_freq = profile.get("cuisine_order_frequency", {})
        if cuisine_freq:
            top_cuisines = sorted(cuisine_freq.items(), key=lambda x: x[1], reverse=True)[:5]
            freq_text = "、".join([f"{c}({n}次)" for c, n in top_cuisines])
            parts.append(f"近期常点: {freq_text}")

        if not parts:
            return f"用户{user_id}，偏好暂未明确"

        return "; ".join(parts)

    def _build_restaurant_text(self, restaurant: Dict[str, Any]) -> str:
        """构建餐厅描述文本"""
        parts = []

        name = restaurant.get("name", "未知餐厅")
        parts.append(name)

        cuisine = restaurant.get("cuisine", restaurant.get("cuisine_type", ""))
        if cuisine:
            parts.append(f"·{cuisine}")

        # 招牌菜 (如果有)
        signature = restaurant.get("signature_dishes", restaurant.get("description", ""))
        if signature:
            parts.append(f"·{signature}")

        price = restaurant.get("price", restaurant.get("avg_price", 0))
        if price and price > 0:
            parts.append(f"人均{price}元")

        rating = restaurant.get("rating", 0)
        if rating and rating > 0:
            parts.append(f"评分{rating}")

        distance = restaurant.get("distance", 0)
        if distance and distance > 0:
            if distance >= 1000:
                parts.append(f"{distance / 1000:.1f}km")
            else:
                parts.append(f"{distance}m")

        return "; ".join(parts)

    def _is_cold_start(self, profile_analysis: Dict[str, Any]) -> bool:
        """判断是否为冷启动用户 (无或极少历史数据)"""
        profile = profile_analysis.get("profile", {})
        if not profile:
            return True

        # 检查是否有实际的订单历史
        cuisine_freq = profile.get("cuisine_order_frequency", {})
        order_count = sum(cuisine_freq.values()) if cuisine_freq else 0

        return order_count < 3  # 少于 3 次订单视为冷启动

    async def _get_restaurant_embeddings(
        self, restaurant_ids: List[str], restaurant_texts: List[str]
    ) -> np.ndarray:
        """
        获取餐厅嵌入，带内存缓存

        餐厅信息相对稳定，嵌入可以缓存复用。
        """
        embeddings = []
        uncached_indices = []
        uncached_texts = []

        for i, (rid, text) in enumerate(zip(restaurant_ids, restaurant_texts)):
            if rid in _restaurant_embed_cache:
                embeddings.append((i, _restaurant_embed_cache[rid]))
            else:
                uncached_indices.append(i)
                uncached_texts.append(text)
                embeddings.append((i, None))  # 占位

        # 批量编码未缓存的餐厅
        if uncached_texts:
            new_embeds = await asyncio.get_event_loop().run_in_executor(
                None, self._encoder.encode_restaurants_batch, uncached_texts
            )
            for idx, embed in zip(uncached_indices, new_embeds):
                rid = restaurant_ids[idx]
                _restaurant_embed_cache[rid] = embed
                embeddings[idx] = (idx, embed)

        # 按顺序组装
        embeddings.sort(key=lambda x: x[0])
        return np.stack([e for _, e in embeddings])


def create_collaborative_agent() -> CollaborativeAgent:
    """工厂函数: 创建 CollaborativeAgent"""
    return CollaborativeAgent()
