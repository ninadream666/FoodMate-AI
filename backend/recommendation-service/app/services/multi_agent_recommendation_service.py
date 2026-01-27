"""
多智能体推荐服务集成

将 LangGraph 多智能体系统与现有的推荐API集成，
提供统一的推荐服务接口。
"""

import os
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import sys

# 添加路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

# 导入模型
from ..models.schemas import (
    RecommendationRequest,
    RecommendationResponse,
    RestaurantInfo,
    ContextInfo,
    LocationRequest
)

# 导入智能体模块
try:
    from ..agents import (
        LangGraphOrchestrator,
        create_langgraph_orchestrator
    )
    AGENTS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"智能体模块导入失败: {e}")
    AGENTS_AVAILABLE = False

# 导入外部服务
from .external_api import WeatherAPIService, MapAPIService, CalendarAPIService
from .amap_poi_service import AmapPOIService
from .profile_service_client import profile_service_adapter, ProfileServiceAdapter

logger = logging.getLogger(__name__)


class MultiAgentRecommendationService:
    """
    多智能体推荐服务
    
    整合 LangGraph 编排器提供完整的智能推荐能力：
    - 环境感知（天气、交通、时间）
    - 用户画像（偏好、意图）
    - MAB决策（UCB1、Thompson、ε-Greedy、上下文感知）
    """
    
    def __init__(self, mab_strategy: str = "contextual"):
        """
        初始化多智能体推荐服务
        
        Args:
            mab_strategy: MAB策略 (ucb1, thompson, epsilon, contextual)
        """
        self.mab_strategy = mab_strategy
        
        # 外部服务
        self.weather_service = WeatherAPIService()
        self.map_service = MapAPIService()
        self.calendar_service = CalendarAPIService()
        self.poi_service = AmapPOIService()
        
        # 用户画像服务（真实调用 profile-service）
        self.user_service = profile_service_adapter
        
        # 智能体编排器
        self.orchestrator: Optional[LangGraphOrchestrator] = None
        
        if AGENTS_AVAILABLE:
            try:
                self.orchestrator = create_langgraph_orchestrator(
                    weather_service=self.weather_service,
                    map_service=self.map_service,
                    calendar_service=self.calendar_service,
                    user_service=self.user_service,  # 注入真实用户服务
                    mab_strategy=mab_strategy
                )
                logger.info("✅ 多智能体推荐服务初始化成功（已集成真实用户画像服务）")
            except Exception as e:
                logger.error(f"编排器初始化失败: {e}")
        else:
            logger.warning("智能体模块不可用，将使用降级模式")
    
    async def get_recommendations(
        self,
        request: RecommendationRequest
    ) -> RecommendationResponse:
        """
        获取智能推荐
        
        Args:
            request: 推荐请求
            
        Returns:
            推荐响应
        """
        try:
            if not self.orchestrator:
                return await self._fallback_recommendation(request)
            
            # 构建用户查询
            user_query = self._build_query(request)
            location = request.location.address
            latitude = request.location.latitude
            longitude = request.location.longitude
            user_id = getattr(request, 'user_id', 'guest')
            
            logger.info(f"开始多智能体推荐，位置: {location}")
            
            # 搜索附近餐厅
            restaurants = await self._search_restaurants(
                location=location,
                latitude=latitude,
                longitude=longitude,
                radius=getattr(request, 'search_radius', 5000),
                limit=30
            )
            
            if not restaurants:
                logger.warning("未找到附近餐厅")
                return await self._fallback_recommendation(request)
            
            # 执行智能体编排
            result = await self.orchestrator.orchestrate(
                user_query=user_query,
                location=location,
                restaurants=restaurants,
                user_id=user_id,
                latitude=latitude,
                longitude=longitude,
                top_k=request.max_results
            )
            
            if not result.get("success"):
                logger.warning(f"编排失败: {result.get('error')}")
                return await self._fallback_recommendation(request)
            
            # 构建响应
            response = self._build_response(result, request)
            
            logger.info(f"多智能体推荐完成，返回{len(response.restaurants)}家餐厅")
            return response
            
        except Exception as e:
            logger.error(f"多智能体推荐失败: {e}")
            return await self._fallback_recommendation(request)
    
    def _build_query(self, request: RecommendationRequest) -> str:
        """构建用户查询"""
        parts = []
        
        if hasattr(request, 'query') and request.query:
            parts.append(request.query)
        
        if hasattr(request, 'preferences'):
            prefs = request.preferences
            if hasattr(prefs, 'cuisine_types') and prefs.cuisine_types:
                parts.append(f"想吃{','.join(prefs.cuisine_types)}")
            if hasattr(prefs, 'max_price') and prefs.max_price:
                parts.append(f"预算{prefs.max_price}以内")
        
        return " ".join(parts) if parts else "推荐附近好吃的餐厅"
    
    async def _search_restaurants(
        self,
        location: str,
        latitude: float = None,
        longitude: float = None,
        radius: int = 5000,
        limit: int = 30
    ) -> List[Dict[str, Any]]:
        """搜索附近餐厅"""
        try:
            poi_results = await self.poi_service.search_restaurants(
                location=location,
                latitude=latitude,
                longitude=longitude,
                keywords="餐厅",
                radius=radius,
                limit=limit
            )
            
            # 转换为标准格式
            restaurants = []
            for poi in poi_results:
                restaurants.append({
                    "id": poi.get("id", ""),
                    "name": poi.get("name", ""),
                    "cuisine_type": self._extract_cuisine(poi),
                    "rating": float(poi.get("rating", 4.0)),
                    "avg_price": int(poi.get("avg_price", 40)),
                    "distance": int(poi.get("distance", 2000)),
                    "estimated_delivery_time": int(poi.get("distance", 2000)) // 100 + 15,
                    "address": poi.get("address", ""),
                    "tel": poi.get("tel", ""),
                    "location": poi.get("location", ""),
                    "is_hot_food": True
                })
            
            return restaurants
            
        except Exception as e:
            logger.error(f"餐厅搜索失败: {e}")
            return []
    
    def _extract_cuisine(self, poi: Dict[str, Any]) -> str:
        """提取菜系类型"""
        type_name = poi.get("type", "")
        if "火锅" in type_name:
            return "火锅"
        elif "快餐" in type_name:
            return "快餐"
        elif "川" in type_name:
            return "川菜"
        elif "粤" in type_name:
            return "粤菜"
        elif "湘" in type_name:
            return "湘菜"
        elif "日" in type_name:
            return "日料"
        elif "韩" in type_name:
            return "韩餐"
        elif "西" in type_name:
            return "西餐"
        else:
            return "中餐"
    
    def _build_response(
        self,
        result: Dict[str, Any],
        request: RecommendationRequest
    ) -> RecommendationResponse:
        """构建推荐响应"""
        # 构建上下文信息
        context_analysis = result.get("context_analysis", {})
        weather = context_analysis.get("weather", {})
        traffic = context_analysis.get("traffic", {})
        temporal = context_analysis.get("temporal", {})
        
        context_info = ContextInfo(
            weather=weather.get("condition", "晴"),
            temperature=weather.get("temperature", 25),
            time_period=temporal.get("meal_period", "lunch"),
            is_weekend=temporal.get("is_weekend", False),
            is_holiday=temporal.get("is_holiday", False),
            is_peak_hour=temporal.get("is_peak_hour", False),
            current_hour=temporal.get("current_hour", temporal.get("hour")),
            traffic_level=traffic.get("congestion_level", "畅通")
        )
        
        # 构建餐厅列表
        restaurants = []
        for rec in result.get("recommendations", []):
            features = rec.get("features", {})
            restaurant_info = rec.get("restaurant_info", {})
            
            # 获取评分和推荐理由
            score = rec.get("score", 80.0)
            reason = rec.get("reason", "")
            
            # 🆕 提取各维度评分（从智能体结果中获取或计算）
            mab_stats = rec.get("mab_stats", {})
            context_score = self._calculate_context_scores(features, context_analysis)
            
            restaurants.append(RestaurantInfo(
                id=rec.get("restaurant_id", ""),
                name=rec.get("name", ""),
                cuisine_type=features.get("cuisine", restaurant_info.get("cuisine_type", "中餐")),
                avg_price=features.get("price", restaurant_info.get("avg_price", 40)),
                rating=features.get("rating", restaurant_info.get("rating", 4.0)),
                distance=features.get("distance", restaurant_info.get("distance", 2000)),
                estimated_delivery_time=features.get("delivery_time", 
                    restaurant_info.get("estimated_delivery_time", 30)),
                match_score=score,
                final_score=score,
                # 🆕 各维度评分
                weather_score=context_score["weather_score"],
                seasonal_score=context_score["seasonal_score"], 
                time_score=context_score["time_score"],
                traffic_score=context_score["traffic_score"],
                is_hot_food=features.get("is_hot_food", True),
                address=restaurant_info.get("address", ""),
                match_reasons=[reason] if reason else [result.get("reasoning", "")],
                recommendation_reason=reason if reason else "AI智能推荐"
            ))
        
        return RecommendationResponse(
            context=context_info,
            restaurants=restaurants,
            total_count=len(restaurants),
            message=result.get("reasoning", "🤖 AI智能体为您精选推荐")
        )
    
    def _calculate_context_scores(
        self,
        features: Dict[str, Any],
        context_analysis: Dict[str, Any]
    ) -> Dict[str, float]:
        """计算各维度的上下文评分"""
        weather = context_analysis.get("weather", {})
        traffic = context_analysis.get("traffic", {})
        temporal = context_analysis.get("temporal", {})
        
        # 天气评分
        weather_score = 0.0
        if weather:
            temperature = weather.get("temperature", 20)
            condition = weather.get("condition", "晴")
            is_hot_food = features.get("is_hot_food", True)
            
            if temperature < 10:  # 寒冷天气
                weather_score = 85.0 if is_hot_food else 30.0
            elif temperature > 35:  # 炎热天气
                weather_score = 40.0 if is_hot_food else 80.0
            elif condition in ["雨", "雪", "阴"]:  # 恶劣天气
                weather_score = 70.0 if is_hot_food else 45.0
            else:  # 正常天气
                weather_score = 60.0
        
        # 时间评分
        time_score = 0.0
        if temporal:
            meal_period = temporal.get("meal_period", "lunch")
            hour = temporal.get("hour", 12)
            is_weekend = temporal.get("is_weekend", False)
            
            if meal_period == "breakfast":
                time_score = 70.0
            elif meal_period == "lunch":
                time_score = 80.0
            elif meal_period == "dinner":
                time_score = 90.0
            elif meal_period == "night_snack":
                time_score = 60.0 if is_weekend else 40.0
            else:
                time_score = 50.0
        
        # 交通评分
        traffic_score = 0.0
        if traffic:
            congestion_level = traffic.get("congestion_level", "畅通")
            distance = features.get("distance", 2000)
            
            if congestion_level == "畅通":
                traffic_score = 80.0
            elif congestion_level == "缓行":
                traffic_score = 65.0
            elif congestion_level == "拥堵":
                traffic_score = 40.0
            else:
                traffic_score = 60.0
            
            # 距离修正
            if distance > 5000:
                traffic_score *= 0.7
        
        # 季节评分（基于当前月份）
        seasonal_score = 60.0  # 默认分数
        current_month = datetime.now().month
        cuisine = features.get("cuisine", "中餐")
        
        # 根据季节和菜系调整分数
        if current_month in [12, 1, 2]:  # 冬季
            if cuisine in ["火锅", "川菜", "湘菜"]:
                seasonal_score = 85.0
            elif cuisine in ["冰淇淋", "冷饮"]:
                seasonal_score = 30.0
        elif current_month in [6, 7, 8]:  # 夏季
            if cuisine in ["冷饮", "日料", "西餐"]:
                seasonal_score = 80.0
            elif cuisine in ["火锅"]:
                seasonal_score = 45.0
        
        return {
            "weather_score": weather_score,
            "time_score": time_score,
            "traffic_score": traffic_score,
            "seasonal_score": seasonal_score
        }
    
    async def _fallback_recommendation(
        self,
        request: RecommendationRequest
    ) -> RecommendationResponse:
        """降级推荐策略"""
        try:
            # 基础餐厅搜索
            poi_results = await self.poi_service.search_restaurants(
                location=request.location.address,
                latitude=request.location.latitude,
                longitude=request.location.longitude,
                keywords="餐厅",
                radius=getattr(request, 'search_radius', 5000),
                limit=request.max_results
            )
            
            restaurants = []
            for i, poi in enumerate(poi_results):
                restaurants.append(RestaurantInfo(
                    id=poi.get("id", f"fallback_{i}"),
                    name=poi.get("name", "推荐餐厅"),
                    cuisine_type=self._extract_cuisine(poi),
                    avg_price=40,
                    rating=float(poi.get("rating", 4.0)),
                    distance=int(poi.get("distance", 2000)),
                    estimated_delivery_time=int(poi.get("distance", 2000)) // 100 + 15,
                    match_score=70.0,
                    is_hot_food=True,
                    address=poi.get("address", "")
                ))
            
            return RecommendationResponse(
                context=None,
                restaurants=restaurants,
                total_count=len(restaurants),
                message="基础推荐服务为您找到附近餐厅"
            )
            
        except Exception as e:
            logger.error(f"降级推荐也失败: {e}")
            return RecommendationResponse(
                context=None,
                restaurants=[],
                total_count=0,
                message=f"推荐服务暂时不可用: {str(e)}"
            )
    
    def update_feedback(self, restaurant_id: str, reward: float):
        """
        更新用户反馈（用于MAB在线学习）
        
        Args:
            restaurant_id: 餐厅ID
            reward: 奖励值 (0-1)
        """
        if self.orchestrator:
            self.orchestrator.update_reward(restaurant_id, reward)
            logger.info(f"已记录用户反馈: {restaurant_id} = {reward}")
    
    def set_mab_strategy(self, strategy: str):
        """
        切换MAB策略
        
        Args:
            strategy: ucb1, thompson, epsilon, contextual
        """
        if self.orchestrator:
            self.orchestrator.set_mab_strategy(strategy)
            self.mab_strategy = strategy
            logger.info(f"已切换MAB策略: {strategy}")
    
    def get_system_status(self) -> Dict[str, Any]:
        """获取系统状态"""
        status = {
            "service": "multi_agent_recommendation",
            "agents_available": AGENTS_AVAILABLE,
            "orchestrator_ready": self.orchestrator is not None,
            "mab_strategy": self.mab_strategy,
            "services": {
                "weather": self.weather_service is not None,
                "map": self.map_service is not None,
                "calendar": self.calendar_service is not None,
                "poi": self.poi_service is not None
            }
        }
        
        if self.orchestrator:
            status["agent_states"] = self.orchestrator.get_agent_states()
        
        return status


# 全局服务实例
multi_agent_recommendation_service = MultiAgentRecommendationService()
