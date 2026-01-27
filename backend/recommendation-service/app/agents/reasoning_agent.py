"""
ReasoningAgent - 推理智能体（核心大脑）

职责:
- 整合所有并行智能体的结果
- 深度思考和逻辑推理
- 生成推荐排序和暖心文案
- 调用 LLM 进行智能决策

能力:
- 多因素综合分析
- 个性化推荐理由生成
- 上下文感知的文案创作
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import asyncio
import logging
import json
import os

from .base_agent import BaseAgent, Tool, global_tool_registry

logger = logging.getLogger(__name__)


@dataclass
class ReasoningContext:
    """推理上下文"""
    weather: Dict[str, Any]
    traffic: Dict[str, Any]
    calendar: Dict[str, Any]
    user_profile: Dict[str, Any]
    candidates: List[Dict[str, Any]]
    user_query: str


class ReasoningAgent(BaseAgent):
    """
    推理智能体（核心大脑）
    
    负责:
    1. 整合环境、用户画像、候选商家信息
    2. 深度思考和多因素决策
    3. 生成个性化推荐理由
    4. 创作暖心推荐文案
    """
    
    def __init__(self, llm_client=None):
        super().__init__(
            name="ReasoningAgent",
            description="推理智能体 - 深度思考和智能决策"
        )
        self.llm_client = llm_client
        self._register_tools()
    
    def _register_tools(self):
        """注册智能体工具"""
        reasoning_tool = Tool(
            name="deep_reasoning",
            description="深度推理和决策",
            input_schema={
                "type": "object",
                "properties": {
                    "context": {"type": "object", "description": "环境上下文"},
                    "profile": {"type": "object", "description": "用户画像"},
                    "candidates": {"type": "array", "description": "候选列表"}
                },
                "required": ["candidates"]
            },
            handler=self._reasoning_handler
        )
        global_tool_registry.register(reasoning_tool)
    
    async def _reasoning_handler(self, **kwargs) -> Dict[str, Any]:
        """推理处理器"""
        return await self.process(kwargs)
    
    def get_capabilities(self) -> List[str]:
        """返回智能体能力"""
        return [
            "多因素综合分析",
            "个性化推荐理由",
            "暖心文案生成",
            "深度逻辑推理"
        ]
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行推理过程
        
        Args:
            input_data: 包含环境、画像、候选商家等信息
            
        Returns:
            推荐结果，包含排序、理由和文案
        """
        start_time = datetime.now()
        
        # 提取输入
        context = input_data.get("context_analysis", {})
        profile = input_data.get("profile_analysis", {})
        candidates = input_data.get("restaurants", [])
        user_query = input_data.get("user_query", "")
        top_k = input_data.get("top_k", 5)
        
        # 构建推理上下文
        reasoning_context = self._build_reasoning_context(context, profile, candidates, user_query)
        
        # 1. 深度思考 - 分析各种因素
        thinking_result = await self._deep_thinking(reasoning_context)
        
        # 2. 智能排序 - 基于多因素评分
        ranked_restaurants = self._smart_ranking(candidates, thinking_result, top_k)
        
        # 3. 生成推荐理由
        recommendations = await self._generate_recommendations(
            ranked_restaurants, 
            reasoning_context,
            thinking_result
        )
        
        # 4. 生成暖心文案
        warm_message = await self._generate_warm_message(
            reasoning_context,
            recommendations
        )
        
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"ReasoningAgent completed in {elapsed_ms:.1f}ms, selected {len(recommendations)} restaurants")
        
        return {
            "success": True,
            "recommendations": recommendations,
            "warm_message": warm_message,
            "thinking": thinking_result,
            "processing_time_ms": elapsed_ms
        }
    
    def _build_reasoning_context(
        self, 
        context: Dict[str, Any], 
        profile: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        user_query: str
    ) -> ReasoningContext:
        """构建推理上下文"""
        return ReasoningContext(
            weather=context.get("weather", {}),
            traffic=context.get("traffic", {}),
            calendar=context.get("temporal", {}),
            user_profile=profile,
            candidates=candidates,
            user_query=user_query
        )
    
    async def _deep_thinking(self, ctx: ReasoningContext) -> Dict[str, Any]:
        """
        深度思考 - 分析各种因素
        
        考虑:
        - 天气对配送和食物选择的影响
        - 交通状况对配送时间的影响
        - 用户历史偏好和最近订单
        - 时间段对餐饮类型的影响
        """
        thinking = {
            "weather_impact": self._analyze_weather_impact(ctx.weather),
            "traffic_impact": self._analyze_traffic_impact(ctx.traffic),
            "time_impact": self._analyze_time_impact(ctx.calendar),
            "user_preferences": self._analyze_user_preferences(ctx.user_profile),
            "exclusions": self._get_exclusions(ctx.user_profile),
            "boost_factors": self._get_boost_factors(ctx)
        }
        
        # 生成思考摘要
        thinking["summary"] = self._generate_thinking_summary(thinking, ctx)
        
        return thinking
    
    def _analyze_weather_impact(self, weather: Dict[str, Any]) -> Dict[str, Any]:
        """分析天气影响"""
        condition = weather.get("condition", "晴")
        temperature = weather.get("temperature", 25)
        is_bad = weather.get("is_bad_weather", False)
        
        impact = {
            "condition": condition,
            "temperature": temperature,
            "is_bad_weather": is_bad,
            "recommendations": []
        }
        
        # 天气影响分析
        if is_bad or condition in ["暴雨", "大雨", "暴雪", "大雪"]:
            impact["delivery_concern"] = "high"
            impact["recommendations"].append("优先选择配送快、包装好的商家")
            impact["recommendations"].append("避免汤类食物，防止洒漏")
            impact["boost_categories"] = ["快餐", "便当", "包装严实"]
        elif condition in ["小雨", "阴"]:
            impact["delivery_concern"] = "medium"
            impact["recommendations"].append("建议选择附近商家")
        else:
            impact["delivery_concern"] = "low"
        
        # 温度影响
        if temperature > 30:
            impact["recommendations"].append("推荐清淡、冷饮类")
            impact["boost_categories"] = impact.get("boost_categories", []) + ["饮品", "沙拉", "凉菜"]
        elif temperature < 10:
            impact["recommendations"].append("推荐热食、汤类")
            impact["boost_categories"] = impact.get("boost_categories", []) + ["火锅", "热汤", "炖菜"]
        
        return impact
    
    def _analyze_traffic_impact(self, traffic: Dict[str, Any]) -> Dict[str, Any]:
        """分析交通影响"""
        congestion = traffic.get("congestion_level", "畅通")
        congestion_index = traffic.get("congestion_index", 1.0)
        
        impact = {
            "congestion_level": congestion,
            "congestion_index": congestion_index,
            "recommendations": []
        }
        
        if congestion_index > 1.5 or congestion in ["拥堵", "严重拥堵"]:
            impact["delivery_delay"] = "high"
            impact["recommendations"].append("优先选择距离近的商家")
            impact["max_distance_km"] = 2
        elif congestion_index > 1.2:
            impact["delivery_delay"] = "medium"
            impact["max_distance_km"] = 3
        else:
            impact["delivery_delay"] = "low"
            impact["max_distance_km"] = 5
        
        return impact
    
    def _analyze_time_impact(self, calendar: Dict[str, Any]) -> Dict[str, Any]:
        """分析时间影响"""
        hour = calendar.get("current_hour", datetime.now().hour)
        meal_period = calendar.get("meal_period", "off_peak")
        is_weekend = calendar.get("is_weekend", False)
        is_holiday = calendar.get("is_holiday", False)
        
        impact = {
            "hour": hour,
            "meal_period": meal_period,
            "is_weekend": is_weekend,
            "is_holiday": is_holiday,
            "recommendations": []
        }
        
        # 用餐时段分析
        if 6 <= hour < 9:
            impact["meal_type"] = "breakfast"
            impact["boost_categories"] = ["早餐", "粥", "包子", "咖啡"]
        elif 11 <= hour < 14:
            impact["meal_type"] = "lunch"
            impact["boost_categories"] = ["快餐", "便当", "盖饭", "面食"]
            if meal_period == "peak":
                impact["recommendations"].append("高峰期建议提前下单")
        elif 17 <= hour < 21:
            impact["meal_type"] = "dinner"
            impact["boost_categories"] = ["正餐", "火锅", "烧烤"]
        elif 21 <= hour < 24:
            impact["meal_type"] = "late_night"
            impact["boost_categories"] = ["夜宵", "烧烤", "小龙虾"]
        else:
            impact["meal_type"] = "snack"
            impact["boost_categories"] = ["饮品", "甜点", "小吃"]
        
        # 周末/节假日
        if is_weekend or is_holiday:
            impact["recommendations"].append("周末可以尝试新店铺")
        
        return impact
    
    def _analyze_user_preferences(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """分析用户偏好"""
        preferences = profile.get("preferences", {})
        
        return {
            "favorite_cuisines": preferences.get("favorite_cuisines", []),
            "price_range": preferences.get("price_range", {"min": 0, "max": 100}),
            "spice_preference": preferences.get("spice_level", "medium"),
            "dietary_restrictions": preferences.get("dietary_restrictions", [])
        }
    
    def _get_exclusions(self, profile: Dict[str, Any]) -> List[str]:
        """获取排除项（如昨天吃过的）"""
        recent_orders = profile.get("recent_orders", [])
        exclusions = []
        
        # 排除最近吃过的（避免重复）
        for order in recent_orders[:3]:  # 最近3单
            restaurant_id = order.get("restaurant_id")
            if restaurant_id:
                exclusions.append(restaurant_id)
        
        return exclusions
    
    def _get_boost_factors(self, ctx: ReasoningContext) -> Dict[str, float]:
        """获取加权因素"""
        boost = {
            "rating": 1.0,
            "distance": 1.0,
            "delivery_time": 1.0,
            "price_match": 1.0,
            "cuisine_match": 1.0
        }
        
        # 恶劣天气加重配送时间权重
        if ctx.weather.get("is_bad_weather"):
            boost["delivery_time"] = 1.5
            boost["distance"] = 1.3
        
        # 用餐高峰加重评分权重
        if ctx.calendar.get("meal_period") == "peak":
            boost["rating"] = 1.2
        
        return boost
    
    def _generate_thinking_summary(self, thinking: Dict[str, Any], ctx: ReasoningContext) -> str:
        """生成思考摘要"""
        parts = []
        
        # 天气因素
        weather_impact = thinking["weather_impact"]
        if weather_impact.get("is_bad_weather"):
            parts.append(f"天气{weather_impact['condition']}，配送可能延迟")
        
        # 交通因素
        traffic_impact = thinking["traffic_impact"]
        if traffic_impact.get("delivery_delay") == "high":
            parts.append("交通拥堵，优先推荐近距离商家")
        
        # 时间因素
        time_impact = thinking["time_impact"]
        parts.append(f"当前是{time_impact.get('meal_type', '用餐')}时段")
        
        # 用户因素
        exclusions = thinking["exclusions"]
        if exclusions:
            parts.append(f"剔除最近吃过的{len(exclusions)}家店")
        
        return "；".join(parts) if parts else "综合多因素进行推荐"
    
    def _smart_ranking(
        self, 
        candidates: List[Dict[str, Any]], 
        thinking: Dict[str, Any],
        top_k: int
    ) -> List[Dict[str, Any]]:
        """智能排序"""
        boost = thinking.get("boost_factors", {})
        exclusions = thinking.get("exclusions", [])
        
        scored_candidates = []
        
        for restaurant in candidates:
            # 检查是否在排除列表中
            restaurant_id = restaurant.get("id") or restaurant.get("restaurant_id", "")
            if restaurant_id in exclusions:
                continue
            
            # 计算综合分数
            score = self._calculate_smart_score(restaurant, thinking, boost)
            scored_candidates.append({
                **restaurant,
                "smart_score": score
            })
        
        # 排序
        scored_candidates.sort(key=lambda x: x["smart_score"], reverse=True)
        
        return scored_candidates[:top_k]
    
    def _calculate_smart_score(
        self, 
        restaurant: Dict[str, Any], 
        thinking: Dict[str, Any],
        boost: Dict[str, float]
    ) -> float:
        """计算智能分数"""
        score = 0.0
        
        # 基础评分（权重25%）
        rating = restaurant.get("rating", 4.0)
        score += (rating / 5.0) * 25 * boost.get("rating", 1.0)
        
        # 距离分数（权重25%）
        distance = restaurant.get("distance", 2000)
        if isinstance(distance, (int, float)):
            max_distance = thinking.get("traffic_impact", {}).get("max_distance_km", 5) * 1000
            distance_score = max(0, 1 - distance / max_distance)
            score += distance_score * 25 * boost.get("distance", 1.0)
        
        # 配送时间分数（权重20%）
        delivery_time = restaurant.get("delivery_time", 30)
        if isinstance(delivery_time, (int, float)):
            time_score = max(0, 1 - delivery_time / 60)
            score += time_score * 20 * boost.get("delivery_time", 1.0)
        
        # 价格匹配分数（权重15%）
        price = restaurant.get("price", restaurant.get("avg_price", 40))
        user_prefs = thinking.get("user_preferences", {})
        price_range = user_prefs.get("price_range", {"min": 0, "max": 100})
        if price_range["min"] <= price <= price_range["max"]:
            score += 15 * boost.get("price_match", 1.0)
        else:
            score += 7.5
        
        # 菜系匹配分数（权重15%）
        cuisine = restaurant.get("cuisine", restaurant.get("cuisine_type", ""))
        favorite_cuisines = user_prefs.get("favorite_cuisines", [])
        if any(fav in cuisine for fav in favorite_cuisines):
            score += 15 * boost.get("cuisine_match", 1.0)
        else:
            score += 10
        
        return round(score, 1)
    
    async def _generate_recommendations(
        self, 
        ranked_restaurants: List[Dict[str, Any]],
        ctx: ReasoningContext,
        thinking: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """生成推荐结果（包含理由）"""
        recommendations = []
        
        for i, restaurant in enumerate(ranked_restaurants):
            reason = self._generate_reason(restaurant, ctx, thinking, i)
            
            recommendations.append({
                "rank": i + 1,
                "restaurant_id": restaurant.get("id") or restaurant.get("restaurant_id", ""),
                "name": restaurant.get("name", "未知餐厅"),
                "score": restaurant.get("smart_score", 0),
                "features": {
                    "cuisine": restaurant.get("cuisine", restaurant.get("cuisine_type", "")),
                    "rating": restaurant.get("rating", 0),
                    "distance": restaurant.get("distance", 0),
                    "delivery_time": restaurant.get("delivery_time", 30),
                    "price": restaurant.get("price", restaurant.get("avg_price", 0)),
                    "image_url": restaurant.get("image_url")
                },
                "reason": reason
            })
        
        return recommendations
    
    def _generate_reason(
        self, 
        restaurant: Dict[str, Any], 
        ctx: ReasoningContext,
        thinking: Dict[str, Any],
        rank: int
    ) -> str:
        """生成推荐理由"""
        reasons = []
        
        # 评分理由
        rating = restaurant.get("rating", 0)
        if rating >= 4.5:
            reasons.append(f"评分高达{rating}分")
        elif rating >= 4.0:
            reasons.append(f"好评如潮({rating}分)")
        
        # 距离理由
        distance = restaurant.get("distance", 0)
        if distance < 1000:
            reasons.append("距您很近")
        elif distance < 2000:
            reasons.append("配送便捷")
        
        # 天气相关理由
        if ctx.weather.get("is_bad_weather"):
            delivery_time = restaurant.get("delivery_time", 30)
            if delivery_time <= 25:
                reasons.append("配送快速")
        
        # 时间段理由
        time_impact = thinking.get("time_impact", {})
        meal_type = time_impact.get("meal_type", "")
        boost_categories = time_impact.get("boost_categories", [])
        cuisine = restaurant.get("cuisine", "")
        if any(cat in cuisine for cat in boost_categories):
            if meal_type == "lunch":
                reasons.append("午餐好选择")
            elif meal_type == "dinner":
                reasons.append("晚餐推荐")
        
        if not reasons:
            reasons.append("综合评分优秀")
        
        return "，".join(reasons[:2])  # 最多2个理由
    
    async def _generate_warm_message(
        self, 
        ctx: ReasoningContext,
        recommendations: List[Dict[str, Any]]
    ) -> str:
        """生成暖心文案"""
        weather = ctx.weather
        condition = weather.get("condition", "晴")
        temperature = weather.get("temperature", 25)
        
        # 天气相关文案
        if condition in ["暴雨", "大雨"]:
            return f"外面雨大，为您精选了{len(recommendations)}家包装严实、配送快的餐厅，请注意接餐安全~"
        elif condition in ["小雨", "阴"]:
            return f"今天有点阴，推荐这{len(recommendations)}家暖心美食，吃点好的心情也会变好哦~"
        elif temperature > 30:
            return f"天气炎热，为您推荐{len(recommendations)}家清爽美食，记得多喝水~"
        elif temperature < 10:
            return f"天冷了，为您准备了{len(recommendations)}家热乎乎的美食，暖胃又暖心~"
        else:
            top_restaurant = recommendations[0]["name"] if recommendations else "美食"
            return f"精心挑选了{len(recommendations)}家好店，{top_restaurant}等你来品尝~"


def create_reasoning_agent(llm_client=None) -> ReasoningAgent:
    """创建推理智能体实例"""
    return ReasoningAgent(llm_client=llm_client)
