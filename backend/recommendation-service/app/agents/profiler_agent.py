"""
ProfilerAgent - 用户画像智能体

职责:
- 分析用户偏好和历史行为
- 构建用户画像特征
- 提供个性化推荐依据

能力:
- 用户偏好分析：菜系、口味、价格区间
- 历史行为分析：点餐记录、评价倾向
- 用户分群：识别用户类型
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import logging
import random

from .base_agent import BaseAgent, Tool, global_tool_registry

logger = logging.getLogger(__name__)


class UserProfile:
    """用户画像数据结构"""

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.preferred_cuisines: List[str] = []
        self.price_range: Dict[str, int] = {"min": 0, "max": 100}
        self.taste_preferences: List[str] = []
        self.dietary_restrictions: List[str] = []
        self.order_frequency: str = "regular"  # rare, regular, frequent
        self.average_rating: float = 4.0
        self.preferred_distance: int = 3000  # meters
        self.user_segment: str = "standard"  # budget, standard, premium
        self.time_sensitivity: str = "normal"  # relaxed, normal, urgent
        # 🆕 订单历史分析结果
        self.cuisine_order_frequency: Dict[str, int] = {}  # 菜系订单频率
        self.time_pattern: Dict[str, int] = {}  # 时段订单分布
        self.weekday_pattern: Dict[str, int] = {}  # 工作日/周末分布
        self.reorder_merchants: Dict[str, int] = {}  # 复购商家
        # 🆕 浏览历史分析结果
        self.browse_interest: Dict[str, int] = {}  # 浏览菜系兴趣
        self.browse_merchants: Dict[str, int] = {}  # 浏览商家频次

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "preferred_cuisines": self.preferred_cuisines,
            "price_range": self.price_range,
            "taste_preferences": self.taste_preferences,
            "dietary_restrictions": self.dietary_restrictions,
            "order_frequency": self.order_frequency,
            "average_rating": self.average_rating,
            "preferred_distance": self.preferred_distance,
            "user_segment": self.user_segment,
            "time_sensitivity": self.time_sensitivity,
            # 🆕 行为分析数据
            "cuisine_order_frequency": self.cuisine_order_frequency,
            "time_pattern": self.time_pattern,
            "weekday_pattern": self.weekday_pattern,
            "reorder_merchants": self.reorder_merchants,
            "browse_interest": self.browse_interest,
            "browse_merchants": self.browse_merchants
        }
class ProfilerAgent(BaseAgent):
    """
    用户画像智能体
    
    负责分析和理解用户：
    1. 用户偏好 - 菜系、口味、价格
    2. 历史行为 - 点餐记录、评价
    3. 用户分群 - 识别用户类型
    """
    
    def __init__(self, user_service=None, order_history_service=None):
        super().__init__(
            name="ProfilerAgent",
            description="用户画像智能体 - 负责分析用户偏好、历史行为和个性化特征"
        )
        
        # 外部服务（支持依赖注入）
        self.user_service = user_service
        self.order_history_service = order_history_service
        
        # 用户画像缓存
        self._profile_cache: Dict[str, UserProfile] = {}
        
        # 注册工具
        self._register_tools()
        
    def _register_tools(self):
        """注册智能体工具"""
        
        # 获取用户画像工具
        profile_tool = Tool(
            name="get_user_profile",
            description="获取用户画像信息",
            input_schema={
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "用户ID"}
                },
                "required": ["user_id"]
            },
            handler=self._get_user_profile_handler
        )
        global_tool_registry.register(profile_tool)
        
        # 分析用户偏好工具
        preference_tool = Tool(
            name="analyze_user_preferences",
            description="分析用户的餐饮偏好",
            input_schema={
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "用户ID"},
                    "context": {"type": "object", "description": "当前上下文"}
                },
                "required": ["user_id"]
            },
            handler=self._analyze_preferences_handler
        )
        global_tool_registry.register(preference_tool)
        
        # 用户分群工具
        segmentation_tool = Tool(
            name="segment_user",
            description="对用户进行分群分类",
            input_schema={
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "用户ID"}
                },
                "required": ["user_id"]
            },
            handler=self._segment_user_handler
        )
        global_tool_registry.register(segmentation_tool)
        
    def get_capabilities(self) -> List[str]:
        """返回智能体能力"""
        return [
            "user_profiling",        # 用户画像
            "preference_analysis",   # 偏好分析
            "behavior_analysis",     # 行为分析
            "user_segmentation",     # 用户分群
            "personalization",       # 个性化推荐
        ]
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        处理用户画像请求
        
        Args:
            input_data: 包含以下字段
                - user_id: 用户ID
                - context: 环境上下文（可选）
                - query: 用户查询（可选）
                
        Returns:
            用户画像分析结果
        """
        start_time = datetime.now()
        self.update_state("processing", "user_profiling")
        
        try:
            user_id = input_data.get("user_id", "guest")
            context = input_data.get("context", {})
            query = input_data.get("query", "") or ""
            
            # 获取或创建用户画像
            profile = await self._get_or_create_profile(user_id)
            
            # 分析当前请求意图
            intent_analysis = self._analyze_query_intent(query)
            
            # 根据上下文调整偏好
            adjusted_preferences = self._adjust_preferences_for_context(
                profile, context
            )
            
            # 获取个性化推荐权重
            recommendation_weights = self._calculate_recommendation_weights(
                profile, context, intent_analysis
            )
            
            result = {
                "success": True,
                "agent": self.name,
                "user_id": user_id,
                "profile": profile.to_dict(),
                "intent_analysis": intent_analysis,
                "adjusted_preferences": adjusted_preferences,
                "recommendation_weights": recommendation_weights,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            self.state.processing_time_ms = processing_time
            self.update_state("completed", "user_profiling", result)
            
            logger.info(f"ProfilerAgent completed analysis for user {user_id} in {processing_time:.1f}ms")
            return result
            
        except Exception as e:
            logger.error(f"ProfilerAgent processing failed: {e}")
            self.update_state("error", error=str(e))
            return {
                "success": False,
                "agent": self.name,
                "error": str(e)
            }
    
    async def _get_or_create_profile(self, user_id: str) -> UserProfile:
        """获取或创建用户画像"""
        
        # 检查缓存
        if user_id in self._profile_cache:
            return self._profile_cache[user_id]
        
        # 尝试从用户服务获取
        if self.user_service:
            try:
                profile_data = await self.user_service.get_user_profile(user_id)
                profile = self._build_profile_from_data(user_id, profile_data)
            except Exception as e:
                logger.warning(f"Failed to get profile from service: {e}")
                profile = self._create_default_profile(user_id)
        else:
            # 创建默认画像
            profile = self._create_default_profile(user_id)
        
        # 缓存画像
        self._profile_cache[user_id] = profile
        return profile
    
    def _build_profile_from_data(self, user_id: str,
                                 data: Dict[str, Any]) -> UserProfile:
        """从服务数据构建用户画像"""
        try:
            # 安全检查data参数
            if data is None:
                logger.warning(f"Profile data is None for user {user_id}, using default profile")
                return self._create_default_profile(user_id)
                
            profile = UserProfile(user_id)

            # 安全获取数据，保证不出现NoneType错误和类型错误
            preferred_cuisines = data.get("preferred_cuisines") or []
            # 确保preferred_cuisines是列表类型
            if isinstance(preferred_cuisines, dict):
                # 如果是字典，尝试转换为列表（取键或值）
                profile.preferred_cuisines = list(preferred_cuisines.keys()) if preferred_cuisines else []
            elif isinstance(preferred_cuisines, list):
                profile.preferred_cuisines = preferred_cuisines
            else:
                profile.preferred_cuisines = []
                
            profile.price_range = data.get("price_range") or {"min": 0, "max": 100}
            
            taste_preferences = data.get("taste_preferences") or []
            profile.taste_preferences = taste_preferences if isinstance(taste_preferences, list) else []
            
            dietary_restrictions = data.get("dietary_restrictions") or []
            profile.dietary_restrictions = dietary_restrictions if isinstance(dietary_restrictions, list) else []
            
            profile.order_frequency = data.get("order_frequency", "regular")
            profile.average_rating = data.get("average_rating", 4.0)
            profile.preferred_distance = data.get("preferred_distance", 3000)

            # 安全检查price_range的类型
            if not isinstance(profile.price_range, dict) or "min" not in profile.price_range or "max" not in profile.price_range:
                profile.price_range = {"min": 0, "max": 100}
                
            # 基于消费水平确定用户分群
            try:
                avg_price = (profile.price_range["min"] + profile.price_range["max"]) / 2
                if avg_price < 30:
                    profile.user_segment = "budget"
                elif avg_price < 80:
                    profile.user_segment = "standard"
                else:
                    profile.user_segment = "premium"
            except Exception as e:
                logger.warning(f"Error calculating user segment: {e}")
                profile.user_segment = "standard"

            # 🆕 集成订单历史分析结果
            order_analysis = data.get("order_history_analysis") or {}
            profile.cuisine_order_frequency = order_analysis.get("cuisine_frequency") or {}
            profile.time_pattern = order_analysis.get("time_pattern") or {}
            profile.weekday_pattern = order_analysis.get("weekday_pattern") or {}
            profile.reorder_merchants = order_analysis.get("reorder_merchants") or {}
            
            # 🆕 根据订单历史增强菜系偏好
            if profile.cuisine_order_frequency:
                try:
                    # 按频率排序，获取top5菜系
                    sorted_cuisines = sorted(
                        profile.cuisine_order_frequency.items(), 
                        key=lambda x: x[1], 
                        reverse=True
                    )[:5]
                    history_cuisines = [c[0] for c in sorted_cuisines]
                    # 合并原有偏好和历史偏好
                    for c in history_cuisines:
                        if c not in profile.preferred_cuisines:
                            profile.preferred_cuisines.append(c)
                except Exception as e:
                    logger.warning(f"Error processing cuisine order frequency: {e}")
            
            # 🆕 集成浏览历史分析结果
            browse_analysis = data.get("browse_history_analysis") or {}
            profile.browse_interest = browse_analysis.get("cuisine_interest") or {}
            profile.browse_merchants = browse_analysis.get("browse_merchants") or {}
            
            # 🆕 根据浏览历史发现潜在兴趣（浏览但未下单的菜系）
            if hasattr(profile, 'browse_interest') and profile.browse_interest:
                try:
                    for cuisine, count in profile.browse_interest.items():
                        if cuisine not in profile.preferred_cuisines and count >= 3:
                            # 浏览3次以上但未下单，可能是探索兴趣
                            profile.preferred_cuisines.append(cuisine)
                except Exception as e:
                    logger.warning(f"Error processing browse interest: {e}")

            return profile
            
        except Exception as e:
            logger.error(f"Error building profile from data: {e}")
            return self._create_default_profile(user_id)

    def _create_default_profile(self, user_id: str) -> UserProfile:
        """创建默认用户画像"""
        profile = UserProfile(user_id)
        
        # 设置默认偏好（模拟常见用户）
        profile.preferred_cuisines = ["中餐", "快餐"]
        profile.price_range = {"min": 20, "max": 50}
        profile.taste_preferences = []
        profile.dietary_restrictions = []
        profile.order_frequency = "regular"
        profile.average_rating = 4.0
        profile.preferred_distance = 3000
        profile.user_segment = "standard"
        profile.time_sensitivity = "normal"
        
        # 初始化新增的属性
        profile.cuisine_order_frequency = {}
        profile.time_pattern = {}
        profile.weekday_pattern = {}
        profile.reorder_merchants = {}
        profile.browse_interest = {}
        profile.browse_merchants = {}
        
        return profile
        profile = UserProfile(user_id)
        
        # 设置默认偏好（模拟常见用户）
        profile.preferred_cuisines = ["中餐", "快餐"]
        profile.price_range = {"min": 20, "max": 50}
        profile.taste_preferences = []
        profile.dietary_restrictions = []
        profile.order_frequency = "regular"
        profile.average_rating = 4.0
        profile.preferred_distance = 3000
        profile.user_segment = "standard"
        profile.time_sensitivity = "normal"
        
        return profile
    
    def _analyze_query_intent(self, query: str) -> Dict[str, Any]:
        """分析查询意图"""
        # 确保query不为None
        query = query or ""
        if not query:
            return {
                "intent_type": "general",
                "detected_keywords": [],
                "urgency": "normal",
                "specificity": "low"
            }
        
        # 关键词检测
        detected_keywords = []
        
        # 菜系关键词
        cuisine_keywords = {
            "火锅": "火锅", "烧烤": "烧烤", "日料": "日本料理",
            "韩餐": "韩国料理", "西餐": "西餐", "川菜": "川菜",
            "粤菜": "粤菜", "湘菜": "湘菜", "东北菜": "东北菜",
            "快餐": "快餐", "奶茶": "饮品", "咖啡": "咖啡"
        }
        for kw, cuisine in cuisine_keywords.items():
            if kw in query:
                detected_keywords.append({"type": "cuisine", "value": cuisine})
        
        # 情感/场景关键词
        mood_keywords = {
            "暖": "comfort", "热": "hot",
            "凉": "cool", "清淡": "light",
            "辣": "spicy", "甜": "sweet"
        }
        for kw, mood in mood_keywords.items():
            if kw in query:
                detected_keywords.append({"type": "mood", "value": mood})
        
        # 紧急程度
        urgency = "normal"
        if any(kw in query for kw in ["急", "快", "马上", "立刻"]):
            urgency = "urgent"
        elif any(kw in query for kw in ["慢慢", "随便", "都行"]):
            urgency = "relaxed"
        
        # 特殊需求
        if any(kw in query for kw in ["素", "清真", "不吃", "过敏"]):
            detected_keywords.append({"type": "restriction", "value": "dietary"})
        
        return {
            "intent_type": "specific" if detected_keywords else "general",
            "detected_keywords": detected_keywords,
            "urgency": urgency,
            "specificity": "high" if len(detected_keywords) >= 2 else "medium" if detected_keywords else "low"
        }
    
    def _adjust_preferences_for_context(self, profile: UserProfile, 
                                        context: Dict[str, Any]) -> Dict[str, Any]:
        """根据上下文调整用户偏好"""
        adjusted = {
            "cuisines": profile.preferred_cuisines.copy(),
            "price_range": profile.price_range.copy(),
            "max_distance": profile.preferred_distance
        }
        
        # 根据天气调整
        weather = context.get("weather", {})
        if weather.get("is_bad_weather"):
            # 恶劣天气，缩短距离偏好
            adjusted["max_distance"] = min(adjusted["max_distance"], 2000)
            # 添加热食偏好
            if "火锅" not in adjusted["cuisines"]:
                adjusted["cuisines"].append("热汤类")
        
        temp = weather.get("temperature", 25)
        if temp < 15:
            # 寒冷天气，偏向热食
            for cuisine in ["火锅", "热汤面"]:
                if cuisine not in adjusted["cuisines"]:
                    adjusted["cuisines"].append(cuisine)
        elif temp > 32:
            # 炎热天气，偏向清淡
            for cuisine in ["沙拉", "冷饮"]:
                if cuisine not in adjusted["cuisines"]:
                    adjusted["cuisines"].append(cuisine)
        
        # 根据交通调整
        traffic = context.get("traffic", {})
        congestion_index = traffic.get("congestion_index", 1.0)
        if congestion_index > 1.5:
            # 拥堵时缩短距离
            adjusted["max_distance"] = min(
                adjusted["max_distance"],
                traffic.get("recommended_delivery_radius", 3000)
            )
        
        # 根据时间调整
        temporal = context.get("temporal", {})
        meal_period = temporal.get("meal_period", "lunch")
        if meal_period == "breakfast":
            adjusted["cuisines"] = ["早餐", "粥", "包子"] + adjusted["cuisines"]
        elif meal_period == "night_snack":
            adjusted["cuisines"] = ["宵夜", "烧烤", "麻辣烫"] + adjusted["cuisines"]
        
        # 去重
        adjusted["cuisines"] = list(dict.fromkeys(adjusted["cuisines"]))[:10]
        
        return adjusted
    
    def _calculate_recommendation_weights(self, profile: UserProfile,
                                          context: Dict[str, Any],
                                          intent: Dict[str, Any]) -> Dict[str, float]:
        """计算推荐权重"""
        weights = {
            "distance": 0.25,
            "rating": 0.25,
            "price": 0.20,
            "cuisine_match": 0.20,
            "delivery_time": 0.10
        }
        
        # 根据用户分群调整
        if profile.user_segment == "budget":
            weights["price"] = 0.35
            weights["rating"] = 0.15
        elif profile.user_segment == "premium":
            weights["rating"] = 0.35
            weights["price"] = 0.10
        
        # 根据时间敏感度调整
        if intent.get("urgency") == "urgent":
            weights["delivery_time"] = 0.25
            weights["distance"] = 0.30
            weights["cuisine_match"] = 0.15
        elif intent.get("urgency") == "relaxed":
            weights["delivery_time"] = 0.05
            weights["cuisine_match"] = 0.25
        
        # 根据环境影响调整
        env_impact = context.get("environment_impact", {})
        if env_impact.get("impact_level") == "high":
            weights["distance"] = 0.35
            weights["delivery_time"] = 0.20
        
        # 归一化权重
        total = sum(weights.values())
        weights = {k: v / total for k, v in weights.items()}
        
        return weights
    
    async def _get_user_profile_handler(self, user_id: str) -> Dict[str, Any]:
        """获取用户画像处理器"""
        profile = await self._get_or_create_profile(user_id)
        return profile.to_dict()
    
    async def _analyze_preferences_handler(self, user_id: str, 
                                           context: Dict[str, Any] = None) -> Dict[str, Any]:
        """分析用户偏好处理器"""
        profile = await self._get_or_create_profile(user_id)
        return self._adjust_preferences_for_context(profile, context or {})
    
    async def _segment_user_handler(self, user_id: str) -> Dict[str, Any]:
        """用户分群处理器"""
        profile = await self._get_or_create_profile(user_id)
        
        return {
            "user_id": user_id,
            "segment": profile.user_segment,
            "characteristics": {
                "order_frequency": profile.order_frequency,
                "average_rating": profile.average_rating,
                "price_sensitivity": "high" if profile.user_segment == "budget" else "low" if profile.user_segment == "premium" else "medium",
                "time_sensitivity": profile.time_sensitivity
            }
        }
    
    def clear_cache(self, user_id: str = None):
        """清除用户画像缓存"""
        if user_id:
            self._profile_cache.pop(user_id, None)
        else:
            self._profile_cache.clear()


# 工厂函数
def create_profiler_agent(user_service=None, 
                         order_history_service=None) -> ProfilerAgent:
    """创建用户画像智能体实例"""
    return ProfilerAgent(user_service, order_history_service)
