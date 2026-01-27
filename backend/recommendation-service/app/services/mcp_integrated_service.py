"""
MCP 集成版多智能体推荐服务

通过 Model Context Protocol (MCP) 协议调用工具，
实现标准化、可扩展的智能推荐能力。

架构:
    API → MCPIntegratedRecommendationService → MCP Server (stdio)
                                              ↓
                    [analyze_environment] [analyze_user_profile] [get_smart_recommendations]
                                              ↓
                    LangGraphOrchestrator → ContextAgent → ProfilerAgent → DecisionAgent
"""

import os
import sys
import asyncio
import logging
import json
import subprocess
from typing import Dict, List, Any, Optional
from datetime import datetime
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

# MCP SDK
try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    MCP_SDK_AVAILABLE = True
except ImportError:
    MCP_SDK_AVAILABLE = False
    logging.warning("MCP SDK 未安装，将使用降级模式")

# 导入模型
from ..models.schemas import (
    RecommendationRequest,
    RecommendationResponse,
    RestaurantInfo,
    ContextInfo
)

# 导入备选服务
from .amap_poi_service import AmapPOIService
from .external_api import WeatherAPIService, MapAPIService, CalendarAPIService

logger = logging.getLogger(__name__)


class MCPIntegratedRecommendationService:
    """
    MCP 集成版多智能体推荐服务
    
    通过 MCP 协议标准化调用各个智能体工具：
    - analyze_environment: 环境感知（天气/交通/时间）
    - analyze_user_profile: 用户画像分析
    - get_smart_recommendations: 完整智能推荐编排
    - search_restaurants: 餐厅搜索
    """
    
    def __init__(self, use_mcp: bool = True, mab_strategy: str = "contextual"):
        """
        初始化 MCP 集成推荐服务
        
        Args:
            use_mcp: 是否使用 MCP 协议（默认 True）
            mab_strategy: MAB 策略
        """
        self.use_mcp = use_mcp and MCP_SDK_AVAILABLE
        self.mab_strategy = mab_strategy
        
        # MCP 服务器路径
        self.mcp_server_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "enhanced_mcp_server.py"
        )
        
        # MCP 会话
        self._mcp_session: Optional[ClientSession] = None
        self._mcp_context = None
        self._available_tools: List[str] = []
        
        # 备选服务（MCP 不可用时使用）
        self.poi_service = AmapPOIService()
        self.weather_service = WeatherAPIService()
        self.map_service = MapAPIService()
        self.calendar_service = CalendarAPIService()
        
        logger.info(f"✅ MCP 集成推荐服务初始化 (use_mcp={self.use_mcp})")
    
    async def connect_mcp_server(self) -> bool:
        """
        连接 MCP 服务器
        
        Returns:
            是否连接成功
        """
        if not self.use_mcp:
            logger.info("MCP 已禁用，使用直接调用模式")
            return False
        
        try:
            logger.info(f"📡 连接 MCP 服务器: {self.mcp_server_path}")
            
            # 创建 MCP 服务器参数，确保传递当前进程的环境变量
            server_params = StdioServerParameters(
                command=sys.executable,
                args=[self.mcp_server_path],
                env=dict(os.environ)  # 传递所有环境变量给子进程
            )
            
            # 建立连接
            self._mcp_context = stdio_client(server_params)
            read_stream, write_stream = await self._mcp_context.__aenter__()
            
            # 创建会话
            self._mcp_session = ClientSession(read_stream, write_stream)
            await self._mcp_session.__aenter__()
            await self._mcp_session.initialize()
            
            # 列出可用工具
            tools_result = await self._mcp_session.list_tools()
            self._available_tools = [t.name for t in tools_result.tools]
            
            logger.info(f"✅ MCP 服务器连接成功")
            logger.info(f"📋 可用工具: {self._available_tools}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ MCP 服务器连接失败: {e}")
            self.use_mcp = False
            return False
    
    async def disconnect_mcp_server(self):
        """断开 MCP 服务器连接"""
        try:
            if self._mcp_session:
                await self._mcp_session.__aexit__(None, None, None)
                self._mcp_session = None
            if self._mcp_context:
                await self._mcp_context.__aexit__(None, None, None)
                self._mcp_context = None
            logger.info("MCP 服务器已断开")
        except Exception as e:
            logger.warning(f"断开 MCP 服务器时出错: {e}")
    
    async def call_mcp_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """
        调用 MCP 工具
        
        Args:
            tool_name: 工具名称
            **kwargs: 工具参数
            
        Returns:
            工具调用结果
        """
        if not self._mcp_session:
            raise RuntimeError("MCP 服务器未连接")
        
        try:
            logger.info(f"🔧 调用 MCP 工具: {tool_name}")
            logger.debug(f"   参数: {kwargs}")
            
            # 过滤 None 值
            arguments = {k: v for k, v in kwargs.items() if v is not None}
            
            # 调用工具
            result = await self._mcp_session.call_tool(tool_name, arguments)
            
            # 解析结果
            if result.content:
                content = result.content[0]
                if hasattr(content, 'text'):
                    parsed = json.loads(content.text)
                    logger.debug(f"   结果: {parsed.get('success', 'N/A')}")
                    return parsed
                return {"raw_content": str(content)}
            
            return {"error": "工具调用无返回"}
            
        except Exception as e:
            logger.error(f"MCP 工具调用失败 [{tool_name}]: {e}")
            return {"error": str(e), "success": False}
    
    async def get_recommendations(
        self,
        request: RecommendationRequest
    ) -> RecommendationResponse:
        """
        获取智能推荐（MCP 版本）
        
        通过 MCP 协议调用 get_smart_recommendations 工具，
        该工具内部执行完整的多智能体编排流程。
        
        Args:
            request: 推荐请求
            
        Returns:
            推荐响应
        """
        try:
            location = request.location.address
            latitude = request.location.latitude
            longitude = request.location.longitude
            user_id = getattr(request, 'user_id', 'guest')
            query = self._build_query(request)
            
            logger.info(f"🚀 开始 MCP 智能推荐流程")
            logger.info(f"   位置: {location}")
            logger.info(f"   坐标: ({latitude}, {longitude})")
            
            # 检查 MCP 连接
            if self.use_mcp and not self._mcp_session:
                await self.connect_mcp_server()
            
            # 使用 MCP 协议调用
            if self._mcp_session:
                return await self._get_recommendations_via_mcp(
                    query=query,
                    location=location,
                    latitude=latitude,
                    longitude=longitude,
                    user_id=user_id,
                    max_results=request.max_results
                )
            else:
                # 降级到直接调用
                return await self._get_recommendations_direct(request)
            
        except Exception as e:
            logger.error(f"推荐流程失败: {e}")
            return await self._fallback_recommendation(request)
    
    async def _get_recommendations_via_mcp(
        self,
        query: str,
        location: str,
        latitude: float = None,
        longitude: float = None,
        user_id: str = "guest",
        max_results: int = 10
    ) -> RecommendationResponse:
        """
        通过 MCP 协议获取推荐
        
        调用 MCP 服务器的 get_smart_recommendations 工具，
        该工具内部会执行：
        1. 搜索附近餐厅
        2. ContextAgent 分析环境
        3. ProfilerAgent 分析用户画像
        4. DecisionAgent 使用 MAB 决策排序
        """
        try:
            # 调用完整的智能推荐工具
            result = await self.call_mcp_tool(
                "get_smart_recommendations",
                query=query,
                location=location,
                user_id=user_id,
                latitude=latitude,
                longitude=longitude,
                max_results=max_results
            )
            
            if not result.get("success"):
                logger.warning(f"MCP 推荐失败: {result.get('error')}")
                # 尝试分步调用
                return await self._get_recommendations_step_by_step(
                    query, location, latitude, longitude, user_id, max_results
                )
            
            # 构建响应
            return self._build_mcp_response(result)
            
        except Exception as e:
            logger.error(f"MCP 推荐调用失败: {e}")
            raise
    
    async def _get_recommendations_step_by_step(
        self,
        query: str,
        location: str,
        latitude: float = None,
        longitude: float = None,
        user_id: str = "guest",
        max_results: int = 10
    ) -> RecommendationResponse:
        """
        分步调用 MCP 工具获取推荐
        
        当 get_smart_recommendations 失败时，手动编排各个工具：
        1. search_restaurants → 获取餐厅列表
        2. analyze_environment → 分析环境
        3. analyze_user_profile → 分析用户
        4. make_mab_decision → MAB 排序
        """
        logger.info("⚡ 使用分步 MCP 调用模式")
        
        # 步骤 1: 搜索餐厅
        restaurants_result = await self.call_mcp_tool(
            "search_restaurants",
            location=location,
            latitude=latitude,
            longitude=longitude,
            keywords="餐厅",
            max_distance=5000,
            limit=30
        )
        
        restaurants = restaurants_result.get("restaurants", [])
        if not restaurants:
            logger.warning("未搜索到餐厅")
            return RecommendationResponse(
                context=None,
                restaurants=[],
                total_count=0,
                message="未找到附近餐厅"
            )
        
        # 步骤 2: 并行分析环境和用户
        env_task = self.call_mcp_tool(
            "analyze_environment",
            city=self._extract_city(location),
            latitude=latitude,
            longitude=longitude,
            location=location
        )
        
        profile_task = self.call_mcp_tool(
            "analyze_user_profile",
            user_id=user_id,
            query=query,
            context="{}"
        )
        
        env_result, profile_result = await asyncio.gather(env_task, profile_task)
        
        # 步骤 3: MAB 决策
        context_for_mab = {
            "context_analysis": env_result,
            "profile_analysis": profile_result,
            "query": query
        }
        
        decision_result = await self.call_mcp_tool(
            "make_mab_decision",
            restaurants=json.dumps(restaurants),
            context=json.dumps(context_for_mab),
            strategy=self.mab_strategy,
            top_k=max_results
        )
        
        # 构建响应
        return self._build_step_response(
            env_result=env_result,
            profile_result=profile_result,
            decision_result=decision_result,
            restaurants=restaurants
        )
    
    def _build_mcp_response(self, result: Dict[str, Any]) -> RecommendationResponse:
        """从 MCP 结果构建响应"""
        # 构建上下文
        context_analysis = result.get("context_analysis", {})
        weather = context_analysis.get("weather", {})
        traffic = context_analysis.get("traffic", {})
        temporal = context_analysis.get("temporal", {})
        
        context_info = ContextInfo(
            weather=weather.get("condition", "晴"),
            temperature=weather.get("temperature", 25),
            time_period=temporal.get("meal_period", "lunch"),
            is_holiday=temporal.get("is_holiday", False),
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
                final_score=score,  # 🆕 设置final_score
                is_hot_food=features.get("is_hot_food", True),
                address=restaurant_info.get("address", ""),
                match_reasons=[reason] if reason else [result.get("reasoning", "")],
                recommendation_reason=reason if reason else "AI智能推荐"  # 🆕 设置推荐理由
            ))
        
        return RecommendationResponse(
            context=context_info,
            restaurants=restaurants,
            total_count=len(restaurants),
            message=f"🔌 MCP 智能推荐: {result.get('reasoning', 'AI为您精选')}"
        )
    
    def _build_step_response(
        self,
        env_result: Dict,
        profile_result: Dict,
        decision_result: Dict,
        restaurants: List[Dict]
    ) -> RecommendationResponse:
        """从分步调用结果构建响应"""
        # 解析环境
        weather = env_result.get("weather", {})
        traffic = env_result.get("traffic", {})
        temporal = env_result.get("temporal", {})
        
        context_info = ContextInfo(
            weather=weather.get("condition", "晴"),
            temperature=weather.get("temperature", 25),
            time_period=temporal.get("meal_period", "lunch"),
            is_holiday=temporal.get("is_holiday", False),
            traffic_level=traffic.get("congestion_level", "畅通")
        )
        
        # 解析推荐结果
        recommendations = decision_result.get("recommendations", [])
        restaurant_infos = []
        
        for rec in recommendations:
            # 从原始餐厅数据中匹配
            restaurant_id = rec.get("restaurant_id", "")
            original = next((r for r in restaurants if r.get("id") == restaurant_id), {})
            
            # 获取评分和推荐理由
            score = rec.get("score", 80.0)
            reason = rec.get("reason", "")
            
            restaurant_infos.append(RestaurantInfo(
                id=restaurant_id,
                name=rec.get("name", original.get("name", "")),
                cuisine_type=original.get("category", "中餐"),
                avg_price=original.get("avg_price", 40),
                rating=original.get("rating", 4.0),
                distance=int(original.get("distance_km", 2) * 1000) if original.get("distance_km") else 2000,
                estimated_delivery_time=30,
                match_score=score,
                final_score=score,  # 🆕 设置final_score
                is_hot_food=True,
                address=original.get("address", ""),
                match_reasons=[reason] if reason else [],
                recommendation_reason=reason if reason else "AI智能推荐"  # 🆕 设置推荐理由
            ))
        
        return RecommendationResponse(
            context=context_info,
            restaurants=restaurant_infos,
            total_count=len(restaurant_infos),
            message=f"🔌 MCP 分步推荐: {decision_result.get('reasoning', 'AI为您精选')}"
        )
    
    async def _get_recommendations_direct(
        self,
        request: RecommendationRequest
    ) -> RecommendationResponse:
        """直接调用模式（不通过 MCP）"""
        # 导入并使用原有的服务
        from .multi_agent_recommendation_service import multi_agent_recommendation_service
        return await multi_agent_recommendation_service.get_recommendations(request)
    
    async def _fallback_recommendation(
        self,
        request: RecommendationRequest
    ) -> RecommendationResponse:
        """降级推荐"""
        try:
            poi_results = await self.poi_service.search_restaurants(
                location=request.location.address,
                latitude=request.location.latitude,
                longitude=request.location.longitude,
                keywords="餐厅",
                radius=5000,
                limit=request.max_results
            )
            
            restaurants = []
            for poi in poi_results:
                restaurants.append(RestaurantInfo(
                    id=poi.get("id", ""),
                    name=poi.get("name", ""),
                    cuisine_type="中餐",
                    avg_price=40,
                    rating=float(poi.get("rating", 4.0)),
                    distance=int(poi.get("distance", 2000)),
                    estimated_delivery_time=30,
                    match_score=70.0,
                    is_hot_food=True,
                    address=poi.get("address", "")
                ))
            
            return RecommendationResponse(
                context=None,
                restaurants=restaurants,
                total_count=len(restaurants),
                message="基础推荐服务"
            )
            
        except Exception as e:
            logger.error(f"降级推荐失败: {e}")
            return RecommendationResponse(
                context=None,
                restaurants=[],
                total_count=0,
                message=f"服务暂不可用: {e}"
            )
    
    def _build_query(self, request: RecommendationRequest) -> str:
        """构建查询字符串"""
        parts = []
        if hasattr(request, 'query') and request.query:
            parts.append(request.query)
        if hasattr(request, 'preferences'):
            prefs = request.preferences
            if hasattr(prefs, 'cuisine_types') and prefs.cuisine_types:
                parts.append(f"想吃{','.join(prefs.cuisine_types)}")
        return " ".join(parts) if parts else "推荐附近好吃的餐厅"
    
    def _extract_city(self, location: str) -> str:
        """从位置提取城市"""
        cities = ["北京", "上海", "广州", "深圳", "杭州", "成都", "西安", "南京"]
        for city in cities:
            if city in location:
                return city
        return os.getenv("DEFAULT_CITY", "深圳")
    
    # ============= MCP 工具直接暴露 =============
    
    async def analyze_environment(
        self,
        city: str = None,
        latitude: float = None,
        longitude: float = None
    ) -> Dict[str, Any]:
        """
        分析环境（天气/交通/时间）
        
        通过 MCP 协议调用 analyze_environment 工具
        """
        if self._mcp_session:
            return await self.call_mcp_tool(
                "analyze_environment",
                city=city,
                latitude=latitude,
                longitude=longitude
            )
        else:
            # 直接调用
            weather = await self.weather_service.get_weather(city=city, latitude=latitude, longitude=longitude)
            traffic = await self.map_service.get_traffic_status(city=city)
            calendar = await self.calendar_service.get_calendar_info()
            return {
                "weather": weather.__dict__ if weather else {},
                "traffic": traffic.__dict__ if traffic else {},
                "temporal": calendar.__dict__ if calendar else {}
            }
    
    async def analyze_user_profile(
        self,
        user_id: str = "guest",
        query: str = ""
    ) -> Dict[str, Any]:
        """
        分析用户画像
        
        通过 MCP 协议调用 analyze_user_profile 工具
        """
        if self._mcp_session:
            return await self.call_mcp_tool(
                "analyze_user_profile",
                user_id=user_id,
                query=query,
                context="{}"
            )
        else:
            return {
                "user_id": user_id,
                "profile": {"preferences": []},
                "intent": {"query": query}
            }
    
    async def search_nearby_restaurants(
        self,
        location: str,
        latitude: float = None,
        longitude: float = None,
        keywords: str = "餐厅",
        radius: int = 5000
    ) -> List[Dict[str, Any]]:
        """
        搜索附近餐厅
        
        通过 MCP 协议调用 search_restaurants 工具
        """
        if self._mcp_session:
            result = await self.call_mcp_tool(
                "search_restaurants",
                location=location,
                latitude=latitude,
                longitude=longitude,
                keywords=keywords,
                max_distance=radius
            )
            return result.get("restaurants", [])
        else:
            return await self.poi_service.search_restaurants(
                location=location,
                latitude=latitude,
                longitude=longitude,
                keywords=keywords,
                radius=radius
            )
    
    async def get_system_status(self) -> Dict[str, Any]:
        """获取系统状态"""
        status = {
            "service": "mcp_integrated_recommendation",
            "use_mcp": self.use_mcp,
            "mcp_connected": self._mcp_session is not None,
            "mcp_server_path": self.mcp_server_path,
            "available_tools": self._available_tools,
            "mab_strategy": self.mab_strategy,
            "timestamp": datetime.now().isoformat()
        }
        
        # 如果已连接，获取智能体状态
        if self._mcp_session:
            try:
                agent_status = await self.call_mcp_tool("get_agent_system_status")
                status["agent_system"] = agent_status
            except:
                pass
        
        return status
    
    async def switch_mab_strategy(self, strategy: str) -> Dict[str, Any]:
        """切换 MAB 策略"""
        if self._mcp_session:
            result = await self.call_mcp_tool("switch_mab_strategy", strategy=strategy)
            if result.get("success"):
                self.mab_strategy = strategy
            return result
        else:
            self.mab_strategy = strategy
            return {"success": True, "new_strategy": strategy}
    
    async def update_feedback(
        self,
        restaurant_id: str,
        reward: float,
        feedback_type: str = "order"
    ) -> Dict[str, Any]:
        """更新推荐反馈"""
        if self._mcp_session:
            return await self.call_mcp_tool(
                "update_recommendation_feedback",
                restaurant_id=restaurant_id,
                reward=reward,
                feedback_type=feedback_type
            )
        else:
            return {"success": True, "message": "feedback recorded (local)"}


# 上下文管理器 - 自动管理 MCP 连接
@asynccontextmanager
async def create_mcp_recommendation_service(use_mcp: bool = True):
    """
    创建 MCP 推荐服务（上下文管理器）
    
    使用方式:
        async with create_mcp_recommendation_service() as service:
            result = await service.get_recommendations(request)
    """
    service = MCPIntegratedRecommendationService(use_mcp=use_mcp)
    
    try:
        if use_mcp:
            await service.connect_mcp_server()
        yield service
    finally:
        await service.disconnect_mcp_server()


# 全局服务实例（可选使用）
mcp_recommendation_service = MCPIntegratedRecommendationService(use_mcp=True)
