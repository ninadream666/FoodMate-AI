"""
MCP 集成版推荐 API

提供通过 Model Context Protocol (MCP) 协议调用智能推荐能力的 API 端点。

端点:
    POST /api/v2/mcp/recommend - 通过 MCP 获取智能推荐
    GET  /api/v2/mcp/status - 获取 MCP 系统状态
    GET  /api/v2/mcp/tools - 列出可用的 MCP 工具
    POST /api/v2/mcp/tool/{tool_name} - 直接调用指定 MCP 工具
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any, Optional
import logging
import asyncio

from ..models.schemas import (
    RecommendationRequest,
    RecommendationResponse,
    LocationRequest
)

from ..services.mcp_integrated_service import (
    MCPIntegratedRecommendationService,
    mcp_recommendation_service,
    create_mcp_recommendation_service
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2/mcp", tags=["MCP 智能推荐"])

# 全局 MCP 服务实例
_mcp_service: Optional[MCPIntegratedRecommendationService] = None
_mcp_connected: bool = False


async def get_mcp_service() -> MCPIntegratedRecommendationService:
    """获取或初始化 MCP 服务"""
    global _mcp_service, _mcp_connected
    
    if _mcp_service is None:
        _mcp_service = MCPIntegratedRecommendationService(use_mcp=True)
    
    # 确保已连接
    if not _mcp_connected:
        try:
            _mcp_connected = await _mcp_service.connect_mcp_server()
            if _mcp_connected:
                logger.info("✅ MCP 服务已连接")
            else:
                logger.warning("⚠️ MCP 连接失败，使用降级模式")
        except Exception as e:
            logger.error(f"❌ MCP 连接出错: {e}")
            _mcp_connected = False
    
    return _mcp_service


@router.post("/recommend", response_model=RecommendationResponse)
async def mcp_recommend(
    request: RecommendationRequest,
    service: MCPIntegratedRecommendationService = Depends(get_mcp_service)
):
    """
    🔌 通过 MCP 协议获取智能推荐
    
    完整的 MCP 调用流程:
    1. 通过 MCP 协议连接到 enhanced_mcp_server.py
    2. 调用 get_smart_recommendations 工具
    3. 工具内部执行: ContextAgent → ProfilerAgent → DecisionAgent
    4. 返回 MAB 算法排序后的推荐结果
    
    请求示例:
    ```json
    {
        "location": {
            "address": "深圳市南山区科技园",
            "latitude": 22.5431,
            "longitude": 114.0579
        },
        "query": "想吃辣的",
        "max_results": 5
    }
    ```
    """
    try:
        logger.info(f"📡 MCP 推荐请求: {request.location.address}")
        
        result = await service.get_recommendations(request)
        
        logger.info(f"✅ MCP 推荐完成: 返回 {result.total_count} 家餐厅")
        return result
        
    except Exception as e:
        logger.error(f"❌ MCP 推荐失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def mcp_status(
    service: MCPIntegratedRecommendationService = Depends(get_mcp_service)
):
    """
    📊 获取 MCP 系统状态
    
    返回:
    - MCP 连接状态
    - 可用工具列表
    - 智能体状态
    - MAB 策略
    """
    try:
        status = await service.get_system_status()
        return {
            "success": True,
            **status
        }
    except Exception as e:
        logger.error(f"获取状态失败: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@router.get("/tools")
async def list_mcp_tools(
    service: MCPIntegratedRecommendationService = Depends(get_mcp_service)
):
    """
    🛠️ 列出所有可用的 MCP 工具
    
    返回 MCP 服务器提供的所有工具及其描述。
    """
    try:
        if not service._mcp_session:
            await service.connect_mcp_server()
        
        if service._mcp_session:
            tools_result = await service._mcp_session.list_tools()
            tools = []
            for tool in tools_result.tools:
                tools.append({
                    "name": tool.name,
                    "description": tool.description if hasattr(tool, 'description') else ""
                })
            return {
                "success": True,
                "count": len(tools),
                "tools": tools
            }
        else:
            return {
                "success": False,
                "error": "MCP 服务器未连接",
                "available_tools_offline": [
                    "analyze_environment",
                    "get_weather_analysis",
                    "get_traffic_analysis",
                    "analyze_user_profile",
                    "get_user_preferences",
                    "get_smart_recommendations",
                    "make_mab_decision",
                    "search_restaurants",
                    "update_recommendation_feedback",
                    "get_agent_system_status",
                    "switch_mab_strategy"
                ]
            }
    except Exception as e:
        logger.error(f"列出工具失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tool/{tool_name}")
async def call_mcp_tool(
    tool_name: str,
    params: Dict[str, Any],
    service: MCPIntegratedRecommendationService = Depends(get_mcp_service)
):
    """
    🔧 直接调用指定的 MCP 工具
    
    可用工具:
    - analyze_environment: 环境分析（天气/交通/时间）
    - get_weather_analysis: 天气分析
    - get_traffic_analysis: 交通分析
    - analyze_user_profile: 用户画像分析
    - get_smart_recommendations: 完整智能推荐
    - make_mab_decision: MAB 决策
    - search_restaurants: 搜索餐厅
    
    请求示例:
    ```json
    {
        "city": "深圳",
        "latitude": 22.5431,
        "longitude": 114.0579
    }
    ```
    """
    try:
        if not service._mcp_session:
            connected = await service.connect_mcp_server()
            if not connected:
                raise HTTPException(
                    status_code=503,
                    detail="MCP 服务器未连接"
                )
        
        logger.info(f"🔧 直接调用 MCP 工具: {tool_name}")
        result = await service.call_mcp_tool(tool_name, **params)
        
        return {
            "success": True,
            "tool": tool_name,
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"工具调用失败 [{tool_name}]: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/environment")
async def analyze_environment(
    city: str = "深圳",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    service: MCPIntegratedRecommendationService = Depends(get_mcp_service)
):
    """
    🌍 环境分析
    
    通过 MCP 调用环境分析工具，获取:
    - 天气状况
    - 交通状态
    - 时间上下文（节假日/用餐时段）
    """
    try:
        result = await service.analyze_environment(
            city=city,
            latitude=latitude,
            longitude=longitude
        )
        return {
            "success": True,
            **result
        }
    except Exception as e:
        logger.error(f"环境分析失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/profile/{user_id}")
async def analyze_profile(
    user_id: str,
    query: str = "",
    service: MCPIntegratedRecommendationService = Depends(get_mcp_service)
):
    """
    👤 用户画像分析
    
    通过 MCP 调用用户画像分析工具
    """
    try:
        result = await service.analyze_user_profile(
            user_id=user_id,
            query=query
        )
        return {
            "success": True,
            **result
        }
    except Exception as e:
        logger.error(f"用户画像分析失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restaurants/search")
async def search_restaurants(
    location: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    keywords: str = "餐厅",
    radius: int = 5000,
    service: MCPIntegratedRecommendationService = Depends(get_mcp_service)
):
    """
    🔍 搜索附近餐厅
    
    通过 MCP 调用餐厅搜索工具
    """
    try:
        restaurants = await service.search_nearby_restaurants(
            location=location,
            latitude=latitude,
            longitude=longitude,
            keywords=keywords,
            radius=radius
        )
        return {
            "success": True,
            "count": len(restaurants),
            "restaurants": restaurants
        }
    except Exception as e:
        logger.error(f"餐厅搜索失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/strategy/{strategy}")
async def switch_strategy(
    strategy: str,
    service: MCPIntegratedRecommendationService = Depends(get_mcp_service)
):
    """
    🔄 切换 MAB 策略
    
    可用策略:
    - ucb1: UCB1 算法
    - thompson: Thompson 采样
    - epsilon: ε-Greedy
    - contextual: 上下文感知 MAB（默认）
    """
    valid_strategies = ["ucb1", "thompson", "epsilon", "contextual"]
    if strategy not in valid_strategies:
        raise HTTPException(
            status_code=400,
            detail=f"无效策略，可用: {valid_strategies}"
        )
    
    try:
        result = await service.switch_mab_strategy(strategy)
        return result
    except Exception as e:
        logger.error(f"切换策略失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback")
async def update_feedback(
    restaurant_id: str,
    reward: float,
    feedback_type: str = "order",
    service: MCPIntegratedRecommendationService = Depends(get_mcp_service)
):
    """
    📊 更新推荐反馈
    
    用于 MAB 算法的在线学习
    
    Args:
        restaurant_id: 餐厅 ID
        reward: 奖励值 (0-1)
        feedback_type: 反馈类型 (order/click/rating)
    """
    if not 0 <= reward <= 1:
        raise HTTPException(
            status_code=400,
            detail="reward 必须在 0-1 之间"
        )
    
    try:
        result = await service.update_feedback(
            restaurant_id=restaurant_id,
            reward=reward,
            feedback_type=feedback_type
        )
        return result
    except Exception as e:
        logger.error(f"更新反馈失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 启动/关闭事件
async def startup_mcp():
    """启动时连接 MCP 服务器"""
    global _mcp_service, _mcp_connected
    try:
        _mcp_service = MCPIntegratedRecommendationService(use_mcp=True)
        _mcp_connected = await _mcp_service.connect_mcp_server()
        if _mcp_connected:
            logger.info("🚀 MCP API 已启动，服务器已连接")
        else:
            logger.warning("⚠️ MCP API 已启动，但服务器未连接（使用降级模式）")
    except Exception as e:
        logger.error(f"MCP 启动失败: {e}")


async def shutdown_mcp():
    """关闭时断开 MCP 服务器"""
    global _mcp_service
    if _mcp_service:
        await _mcp_service.disconnect_mcp_server()
        logger.info("🛑 MCP 服务器已断开")
