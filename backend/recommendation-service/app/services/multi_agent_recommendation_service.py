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
            mab_strategy: MAB策略 (ucb1, thompson, epsilon, contextual, ml_ensemble)
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
            
            # 搜索附近餐厅 (传入真正的用户原始 query 供双重召回使用)
            restaurants = await self._search_restaurants(
                location=location,
                latitude=latitude,
                longitude=longitude,
                radius=getattr(request, 'search_radius', 20000),
                limit=50,
                user_query=getattr(request, 'query', "")  # 🆕 传入真实查询词
            )
            
            if not restaurants:
                logger.warning("未找到附近餐厅")
                return await self._fallback_recommendation(request)
            
            # 执行智能体编排
            # 🆕 传入前端的健康/天气上下文，供决策引擎排序使用
            health_ctx = {}
            weather_ctx = None
            if hasattr(request, 'health_context') and request.health_context:
                health_ctx = {
                    "daily_steps": request.health_context.daily_steps,
                    "recent_steps_30min": request.health_context.recent_steps_30min,
                    "heart_rate": request.health_context.heart_rate,
                    "activity_status": request.health_context.activity_status,
                    "is_post_workout": request.health_context.is_post_workout,
                }
            if hasattr(request, 'weather_context') and request.weather_context:
                weather_ctx = {
                    "condition": request.weather_context.condition,
                    "temperature": request.weather_context.temperature,
                    "humidity": request.weather_context.humidity,
                    "is_raining": request.weather_context.is_raining,
                    "is_heavy_rain": request.weather_context.is_heavy_rain,
                    "delivery_impact": request.weather_context.delivery_impact,
                }
            
            # 💡 巧妙利用 health_ctx 将纯净的原始意图传递给下游的 DecisionAgent
            health_ctx["pure_query"] = getattr(request, 'query', "")

            # 传递忌口/过敏原到决策引擎，用于硬过滤
            if hasattr(request, 'allergies') and request.allergies:
                health_ctx["allergies"] = request.allergies
                logger.info(f"用户忌口: {request.allergies}")
            
            result = await self.orchestrator.orchestrate(
                user_query=user_query,
                location=location,
                restaurants=restaurants,
                user_id=user_id,
                latitude=latitude,
                longitude=longitude,
                top_k=request.max_results,
                health_context=health_ctx,
                weather_context=weather_ctx
            )
            
            if not result.get("success"):
                logger.warning(f"编排失败: {result.get('error')}")
                return await self._fallback_recommendation(request)
            
            # 🆕 将前端传入的健康/天气上下文注入 context_analysis，供决策引擎使用
            if "context_analysis" not in result:
                result["context_analysis"] = {}
            if health_ctx:
                result["context_analysis"]["health_context"] = health_ctx
            
            if hasattr(request, 'weather_context') and request.weather_context:
                wc = request.weather_context
                # 合并前端天气数据到 context_analysis.weather，确保决策引擎可以用
                ca_weather = result["context_analysis"].get("weather", {})
                # 始终用前端温度覆盖后端天气API的默认值
                if wc.temperature is not None:
                    ca_weather["temperature"] = wc.temperature
                if wc.is_heavy_rain or wc.is_raining:
                    ca_weather["is_bad_weather"] = True
                if wc.condition:
                    ca_weather["condition"] = wc.condition  # 始终用前端天气
                result["context_analysis"]["weather"] = ca_weather
            
            # 构建响应
            response = self._build_response(result, request)
            
            logger.info(f"多智能体推荐完成，返回{len(response.restaurants)}家餐厅")
            return response
            
        except Exception as e:
            logger.error(f"多智能体推荐失败: {e}")
            return await self._fallback_recommendation(request)
    
    def _build_query(self, request: RecommendationRequest) -> str:
        """构建用户查询，整合健康上下文和天气上下文"""
        parts = []
        
        # 1. 整合天气上下文（最高优先级 - 影响配送）
        if hasattr(request, 'weather_context') and request.weather_context:
            weather = request.weather_context
            if weather.is_heavy_rain:
                parts.append("外面下大雨，优先选择配送运力充足、包装防水的商家，配送时间可能延长")
                logger.info(f"检测到恶劣天气: {weather.condition}, 配送影响={weather.delivery_impact}")
            elif weather.is_raining:
                parts.append("外面在下雨，优先选择距离近、配送快的商家")
                logger.info(f"检测到下雨天气: {weather.condition}")
            elif weather.temperature and weather.temperature > 35:
                parts.append("天气炎热，推荐清凉解暑的美食，如冰饮、沙拉、冷面")
                logger.info(f"检测到高温天气: {weather.temperature}°C")
            elif weather.temperature and weather.temperature < 5:
                parts.append("天气寒冷，推荐热乎乎的暖身美食，如火锅、热汤、麻辣烫")
                logger.info(f"检测到低温天气: {weather.temperature}°C")
        
        # 2. 整合健康上下文
        if hasattr(request, 'health_context') and request.health_context:
            health = request.health_context
            if health.is_post_workout:
                # 用户刚运动完，推荐高蛋白恢复餐
                parts.append("刚运动完，需要补充蛋白质和电解质，推荐高蛋白低脂的恢复餐")
                logger.info(f"检测到运动后状态: 步数={health.recent_steps_30min}, 心率={health.heart_rate}bpm")
            elif health.activity_status == "running" or health.activity_status == "walking":
                parts.append("正在运动中，推荐清淡易消化的食物")
            elif health.heart_rate and health.heart_rate > 100:
                parts.append("心率较高，推荐清淡舒缓的食物")
        
        # 3. 用户原始查询
        if hasattr(request, 'query') and request.query:
            parts.append(request.query)
        
        # 4. 用户偏好设置
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
        radius: int = 20000,
        limit: int = 50,
        user_query: str = ""  # 🆕 接收原始查询
    ) -> List[Dict[str, Any]]:
        """搜索附近餐厅"""
        try:
            # 提取核心意图词，如果没有则默认"餐厅"
            search_keyword = user_query if user_query and user_query.strip() else "餐厅"

            poi_results = await self.poi_service.search_restaurants(
                location=location,
                latitude=latitude,
                longitude=longitude,
                keywords=search_keyword,
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
    
    def _generate_personalized_reason(
        self,
        restaurant: Dict[str, Any],
        request: RecommendationRequest,
        context_analysis: Dict[str, Any]
    ) -> str:
        """
        根据上下文生成个性化推荐理由 — 每家餐厅理由不同
        
        综合天气、温度、运动状态、节日、交通等上下文，
        结合餐厅的菜系、距离、评分等自身特点，
        为每家餐厅生成独一无二的推荐理由。
        """
        import random
        
        reasons = []
        name = restaurant.get("name", "这家餐厅")
        cuisine = restaurant.get("features", {}).get("cuisine", restaurant.get("cuisine_type", ""))
        distance = restaurant.get("features", {}).get("distance", restaurant.get("distance", 2000))
        rating = restaurant.get("features", {}).get("rating", restaurant.get("rating", 4.0))
        delivery_time = restaurant.get("features", {}).get("delivery_time", 
                          restaurant.get("estimated_delivery_time", 30))
        cuisine_str = str(cuisine).lower()
        
        # ========== 1. 天气相关（最高优先级）==========
        if hasattr(request, 'weather_context') and request.weather_context:
            weather = request.weather_context
            temp = weather.temperature
            
            if weather.is_heavy_rain:
                if distance < 1000:
                    reasons.append(f"⛈️ 暴雨天气！{name}距您仅{distance}米，{delivery_time}分钟极速送达")
                elif distance < 2000:
                    reasons.append(f"🌧️ 大雨天配送稳定，{name}包装防水确保热乎到手")
                else:
                    reasons.append(f"🌧️ 雨天推荐！{name}支持雨天优先配送")
                    
            elif weather.is_raining:
                rain_templates = [
                    f"☔ 雨天宅家享美食！{name}约{delivery_time}分钟送到",
                    f"🌧️ 下雨天最适合来份{cuisine}！{name}暖心配送中",
                    f"☔ 雨声配美食，{name}的{cuisine}治愈下雨天",
                ]
                reasons.append(random.choice(rain_templates))
                
            elif temp and temp > 35:
                cold_keywords = ["冰", "凉", "沙拉", "冷", "饮", "果汁", "甜品", "日料", "寿司"]
                if any(k in cuisine_str for k in cold_keywords):
                    reasons.append(f"🧊 {temp}°C高温天！{name}的{cuisine}冰爽解暑，正合时宜")
                else:
                    hot_templates = [
                        f"🥵 {temp}°C酷暑！{name}开胃爽口，炎夏也能好胃口",
                        f"🌡️ 高温{temp}°C，{name}为您准备消暑美食，{delivery_time}分钟送达",
                        f"☀️ 烈日当头，{name}的{cuisine}让您清凉一夏",
                    ]
                    reasons.append(random.choice(hot_templates))
                    
            elif temp and temp < 5:
                hot_keywords = ["火锅", "汤", "粥", "麻辣", "烤", "炖", "砂锅", "川菜", "湘菜"]
                if any(k in cuisine_str for k in hot_keywords):
                    reasons.append(f"❄️ 仅{temp}°C！{name}的{cuisine}热气腾腾，暖到心窝")
                else:
                    cold_templates = [
                        f"🥶 {temp}°C严寒！{name}热乎乎的美食暖身又暖心",
                        f"❄️ 天冷就要吃热的！{name}约{delivery_time}分钟热乎送达",
                        f"🧣 {temp}°C冻手冻脚，{name}的{cuisine}给您加温",
                    ]
                    reasons.append(random.choice(cold_templates))
        
        # ========== 2. 运动健康相关 ==========
        if hasattr(request, 'health_context') and request.health_context:
            health = request.health_context
            if health.is_post_workout:
                healthy_keywords = ["轻食", "沙拉", "健康", "低脂", "蛋白", "鸡胸", "粗粮"]
                heavy_keywords = ["火锅", "烤", "油炸", "炸鸡", "烧烤", "麻辣"]
                
                if any(k in cuisine_str for k in healthy_keywords):
                    steps = health.recent_steps_30min or 0
                    reasons.append(f"💪 运动后恢复首选！{name}的{cuisine}高蛋白低脂，助您快速恢复")
                elif any(k in cuisine_str for k in heavy_keywords):
                    reasons.append(f"🏃 刚运动完？{name}的{cuisine}帮您大快朵颐补充能量")
                else:
                    workout_templates = [
                        f"💪 运动后来份{name}的{cuisine}，营养补给一步到位",
                        f"🏋️ 刚跑完步！{name}提供均衡营养，运动后最佳搭档",
                        f"⚡ 运动消耗大，{name}的{cuisine}帮您恢复体力",
                    ]
                    reasons.append(random.choice(workout_templates))
                    
            elif health.heart_rate and health.heart_rate > 120:
                reasons.append(f"❤️ 心率{health.heart_rate}bpm偏高，{name}的清淡{cuisine}助您舒缓")
            elif health.activity_status in ["running", "walking"] and health.recent_steps_30min and health.recent_steps_30min > 500:
                reasons.append(f"🚶 今日已走{health.daily_steps}步，{name}的{cuisine}犒劳一下自己")
        
        # ========== 3. 节日/周末 ==========
        temporal = context_analysis.get("temporal", {})
        if temporal:
            festival = temporal.get("festival", "")
            is_holiday = temporal.get("is_holiday", False)
            is_weekend = temporal.get("is_weekend", False)
            
            if festival:
                reasons.append(f"🎊 {festival}快乐！{name}精心准备节日特色美食")
            elif is_holiday:
                if not reasons:  # 避免太多理由
                    reasons.append(f"🎉 假日悠闲时光，{name}的{cuisine}犒劳自己")
            elif is_weekend:
                if not reasons:
                    weekend_templates = [
                        f"🎊 周末不将就！{name}的{cuisine}给您好心情",
                        f"🌈 周末放松，享受{name}的{rating}分好味道",
                    ]
                    reasons.append(random.choice(weekend_templates))
        
        # ========== 4. 交通拥堵 ==========
        traffic = context_analysis.get("traffic", {})
        if traffic:
            congestion = traffic.get("congestion_level", "畅通")
            if congestion in ["拥堵", "严重拥堵"]:
                if distance < 1000:
                    if not reasons:
                        reasons.append(f"🚗 路况{congestion}！{name}仅{distance}米，配送不受影响")
                    else:
                        reasons[0] += f"，且仅{distance}米不堵车"
                elif not reasons:
                    reasons.append(f"🚗 虽然路况{congestion}，{name}约{delivery_time}分钟仍可送达")
        
        # ========== 5. 默认理由（结合餐厅自身亮点）==========
        if not reasons:
            if rating and rating >= 4.5:
                default_templates = [
                    f"⭐ {rating}分高口碑！{name}的{cuisine}深受食客好评",
                    f"👍 {name}评分高达{rating}，{cuisine}味道正宗值得一试",
                ]
                reasons.append(random.choice(default_templates))
            elif distance and distance < 800:
                reasons.append(f"📍 就在附近！{name}仅{distance}米，热乎乎{delivery_time}分钟送达")
            elif delivery_time and delivery_time <= 20:
                reasons.append(f"⚡ 极速送达！{name}约{delivery_time}分钟就到，{cuisine}新鲜出锅")
            else:
                reasons.append(f"🍽️ AI精选！{name}的{cuisine}口味地道，值得品尝")
        
        return reasons[0] if reasons else f"🤖 AI为您精选 - {name}"
    
    def _generate_main_message(self, request: RecommendationRequest) -> str:
        """
        生成推荐页面的主消息（基于当前上下文）
        """
        parts = []
        
        # 天气相关主消息
        if hasattr(request, 'weather_context') and request.weather_context:
            weather = request.weather_context
            if weather.is_heavy_rain:
                parts.append("⛈️ 雨天特惠！已为您筛选配送稳定的商家")
            elif weather.is_raining:
                parts.append("🌧️ 雨天宅家，美食上门")
            elif weather.temperature and weather.temperature > 35:
                parts.append(f"🥵 高温{weather.temperature}°C！清凉美食推荐")
            elif weather.temperature and weather.temperature < 5:
                parts.append(f"❄️ 寒冷天气，暖心美食送上门")
        
        # 运动相关主消息
        if hasattr(request, 'health_context') and request.health_context:
            health = request.health_context
            if health.is_post_workout:
                parts.append("💪 运动后恢复餐推荐")
        
        if parts:
            return " | ".join(parts)
        
        # 默认消息
        return "🤖 AI智能体为您精选推荐"
    
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
            original_reason = rec.get("reason", "")
            
            # 🆕 生成个性化推荐理由（基于健康/天气/时间/交通等上下文）
            personalized_reason = self._generate_personalized_reason(rec, request, context_analysis)
            # 🆕 个性化理由始终优先：只要有上下文（天气/运动/节日/交通）就用个性化理由
            has_special_context = (
                (hasattr(request, 'weather_context') and request.weather_context and
                 (request.weather_context.is_raining or request.weather_context.is_heavy_rain or
                  (request.weather_context.temperature and (request.weather_context.temperature > 35 or request.weather_context.temperature < 5)))) or
                (hasattr(request, 'health_context') and request.health_context and
                 (request.health_context.is_post_workout or (request.health_context.heart_rate and request.health_context.heart_rate > 120))) or
                context_analysis.get("temporal", {}).get("is_holiday", False) or
                context_analysis.get("traffic", {}).get("congestion_level") in ["拥堵", "严重拥堵"]
            )
            reason = personalized_reason if has_special_context else (original_reason or personalized_reason)
            
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
            if distance > 20000:
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
        """降级推荐策略 - 带个性化推荐理由"""
        try:
            # 基础餐厅搜索
            search_keyword = request.query if hasattr(request, 'query') and request.query else "餐厅"
            poi_results = await self.poi_service.search_restaurants(
                location=request.location.address,
                latitude=request.location.latitude,
                longitude=request.location.longitude,
                keywords=search_keyword,
                radius=getattr(request, 'search_radius', 20000),
                limit=request.max_results
            )
            
            # 构建简单的上下文分析（用于生成推荐理由）
            context_analysis = {
                "weather": {},
                "traffic": {},
                "temporal": {
                    "current_hour": datetime.now().hour,
                    "is_weekend": datetime.now().weekday() >= 5,
                    "is_holiday": False
                }
            }
            
            # 生成主消息（基于上下文）
            main_message = self._generate_main_message(request)
            
            restaurants = []
            for i, poi in enumerate(poi_results):
                # 将 POI 转换为类似智能体输出的格式
                rec = {
                    "name": poi.get("name", ""),
                    "features": {
                        "cuisine": self._extract_cuisine(poi),
                        "distance": int(poi.get("distance", 2000)),
                        "rating": float(poi.get("rating", 4.0))
                    },
                    "cuisine_type": self._extract_cuisine(poi),
                    "distance": int(poi.get("distance", 2000)),
                    "rating": float(poi.get("rating", 4.0))
                }
                
                # 生成个性化推荐理由
                personalized_reason = self._generate_personalized_reason(rec, request, context_analysis)
                
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
                    address=poi.get("address", ""),
                    recommendation_reason=personalized_reason,
                    match_reasons=[personalized_reason]
                ))
            
            return RecommendationResponse(
                context=None,
                restaurants=restaurants,
                total_count=len(restaurants),
                message=main_message
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
            strategy: ucb1, thompson, epsilon, contextual, ml_ensemble
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