#!/usr/bin/env python3
"""
MCP over HTTP/SSE服务器

支持远程MCP客户端通过HTTP/SSE协议连接。
这样可以把服务部署到服务器上，远程客户端也能调用MCP工具。

启动方式:
    python mcp_http_server.py

或者:
    uvicorn mcp_http_server:app --host 0.0.0.0 --port 8003
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 添加路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入智能体
from app.agents import (
    ContextAgent,
    ProfilerAgent,
    DecisionAgent,
    LangGraphOrchestrator,
    create_langgraph_orchestrator      
)
from app.agents.parallel_orchestrator import ParallelOrchestrator
from app.agents.reasoning_agent import ReasoningAgent# 导入外部服务
from app.services.external_api import WeatherAPIService, MapAPIService, CalendarAPIService
from app.services.amap_poi_service import AmapPOIService

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 默认配置
DEFAULT_CITY = os.getenv("DEFAULT_CITY", "深圳")
DEFAULT_LATITUDE = float(os.getenv("DEFAULT_LATITUDE", "22.5431"))
DEFAULT_LONGITUDE = float(os.getenv("DEFAULT_LONGITUDE", "114.0579"))

# ============================================================================
# 服务初始化
# ============================================================================

weather_service: Optional[WeatherAPIService] = None
map_service: Optional[MapAPIService] = None
calendar_service: Optional[CalendarAPIService] = None
poi_service: Optional[AmapPOIService] = None
orchestrator: Optional[LangGraphOrchestrator] = None
parallel_orchestrator: Optional[ParallelOrchestrator] = None


def init_services():
    """初始化所有服务"""
    global weather_service, map_service, calendar_service, poi_service, orchestrator, parallel_orchestrator, parallel_orchestrator, parallel_orchestrator
    
    try:
        weather_service = WeatherAPIService()
        map_service = MapAPIService()
        calendar_service = CalendarAPIService()
        poi_service = AmapPOIService()
        orchestrator = create_langgraph_orchestrator(
            weather_service=weather_service,
            map_service=map_service,
            calendar_service=calendar_service
        )
        # 初始化并行编排器（新架构）
        parallel_orchestrator = ParallelOrchestrator(
            weather_service=weather_service,
            map_service=map_service,
            calendar_service=calendar_service,
            poi_service=poi_service
        )
        logger.info("✅ 所有服务初始化成功（含并行编排器）")
    except Exception as e:
        logger.error(f"❌ 服务初始化失败: {e}")


# ============================================================================
# MCP工具定义
# ============================================================================

MCP_TOOLS = [
    {
        "name": "analyze_environment",
        "description": "分析当前环境信息，包括天气、交通、时间、节假日等综合上下文",
        "inputSchema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名称", "default": "深圳"},
                "latitude": {"type": "number", "description": "纬度"},
                "longitude": {"type": "number", "description": "经度"}
            }
        }
    },
    {
        "name": "get_weather_analysis",
        "description": "获取指定位置的天气分析，包括温度、天气状况、体感等",
        "inputSchema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名称", "default": "深圳"},
                "latitude": {"type": "number", "description": "纬度"},
                "longitude": {"type": "number", "description": "经度"}
            }
        }
    },
    {
        "name": "get_traffic_analysis",
        "description": "获取指定位置的交通状况分析",
        "inputSchema": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "位置描述"},
                "latitude": {"type": "number", "description": "纬度"},
                "longitude": {"type": "number", "description": "经度"}
            }
        }
    },
    {
        "name": "search_restaurants",
        "description": "搜索附近的餐厅",
        "inputSchema": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "位置描述"},
                "latitude": {"type": "number", "description": "纬度"},
                "longitude": {"type": "number", "description": "经度"},
                "keywords": {"type": "string", "description": "搜索关键词，如'川菜'、'火锅'"},
                "radius": {"type": "integer", "description": "搜索半径(米)", "default": 3000}
            },
            "required": ["location"]
        }
    },
    {
        "name": "get_smart_recommendations",
        "description": "获取智能餐厅推荐，综合考虑天气、时间、用户偏好等因素",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "description": "用户ID"},
                "location": {"type": "string", "description": "位置描述"},
                "latitude": {"type": "number", "description": "纬度"},
                "longitude": {"type": "number", "description": "经度"},
                "query": {"type": "string", "description": "用户查询，如'想吃辣的'"},
                "limit": {"type": "integer", "description": "返回数量", "default": 5}
            },
            "required": ["location"]
        }
    },
    {
        "name": "analyze_user_profile",
        "description": "分析用户画像和偏好",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "description": "用户ID"},
                "query": {"type": "string", "description": "用户当前查询"}
            },
            "required": ["user_id"]
        }
    },
    {
        "name": "get_agent_system_status",
        "description": "获取智能体系统状态",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "get_parallel_recommendations",
        "description": "使用并行智能体架构获取智能餐厅推荐，含AI生成的暖心文案",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "description": "用户ID"},
                "location": {"type": "string", "description": "位置描述"},
                "latitude": {"type": "number", "description": "纬度"},
                "longitude": {"type": "number", "description": "经度"},
                "query": {"type": "string", "description": "用户查询，如'想吃辣的'"},
                "limit": {"type": "integer", "description": "返回数量", "default": 5},
                "radius": {"type": "integer", "description": "搜索半径(米)", "default": 3000}
            },
            "required": ["location"]
        }
    }
]


# ============================================================================
# 工具执行函数
# ============================================================================

async def execute_analyze_environment(args: Dict[str, Any]) -> Dict[str, Any]:
    """执行环境分析"""
    city = args.get("city", DEFAULT_CITY)
    latitude = args.get("latitude", DEFAULT_LATITUDE)
    longitude = args.get("longitude", DEFAULT_LONGITUDE)
    
    result = {
        "city": city,
        "timestamp": datetime.now().isoformat(),
        "weather": None,
        "traffic": None,
        "time_info": None,
        "calendar": None
    }
    
    # 获取天气
    if weather_service:
        try:
            weather = await weather_service.get_weather(latitude, longitude)
            if weather:
                result["weather"] = {
                    "temperature": weather.temperature,
                    "condition": weather.condition,
                    "humidity": weather.humidity,
                    "feels_like": weather.feels_like,
                    "wind_speed": weather.wind_speed
                }
        except Exception as e:
            logger.error(f"天气获取失败: {e}")
    
    # 获取交通
    if map_service:
        try:
            traffic = await map_service.get_traffic_info(latitude, longitude)
            if traffic:
                # TrafficInfo 只有 congestion_level, travel_time_multiplier, recommended_transport
                result["traffic"] = {
                    "congestion_level": traffic.congestion_level,
                    "travel_time_multiplier": traffic.travel_time_multiplier,
                    "recommended_transport": traffic.recommended_transport
                }
        except Exception as e:
            logger.error(f"交通获取失败: {e}")
    
    # 获取时间信息
    now = datetime.now()
    hour = now.hour
    if 6 <= hour < 10:
        meal_period = "早餐"
    elif 10 <= hour < 14:
        meal_period = "午餐"
    elif 14 <= hour < 17:
        meal_period = "下午茶"
    elif 17 <= hour < 21:
        meal_period = "晚餐"
    else:
        meal_period = "夜宵"
    
    result["time_info"] = {
        "current_time": now.strftime("%H:%M"),
        "meal_period": meal_period,
        "is_weekend": now.weekday() >= 5
    }
    
    # 获取日历
    if calendar_service:
        try:
            calendar = await calendar_service.get_calendar_info()
            if calendar:
                result["calendar"] = {
                    "date": calendar.date,
                    "weekday": calendar.weekday,
                    "is_holiday": calendar.is_holiday,
                    "holiday_name": calendar.holiday_name,
                    "solar_term": calendar.solar_term
                }
        except Exception as e:
            logger.error(f"日历获取失败: {e}")
    
    return result


async def execute_get_weather(args: Dict[str, Any]) -> Dict[str, Any]:
    """获取天气"""
    city = args.get("city", DEFAULT_CITY)
    latitude = args.get("latitude", DEFAULT_LATITUDE)
    longitude = args.get("longitude", DEFAULT_LONGITUDE)
    
    if not weather_service:
        return {"error": "天气服务未初始化"}
    
    try:
        weather = await weather_service.get_weather(latitude, longitude)
        if weather:
            return {
                "city": city,
                "temperature": weather.temperature,
                "condition": weather.condition,
                "humidity": weather.humidity,
                "feels_like": weather.feels_like,
                "wind_speed": weather.wind_speed,
                "recommendation": _get_weather_recommendation(weather)
            }
        return {"error": "无法获取天气数据"}
    except Exception as e:
        return {"error": str(e)}


def _get_weather_recommendation(weather) -> str:
    """根据天气给出推荐"""
    temp = weather.temperature
    condition = weather.condition
    
    if "雨" in condition:
        return "下雨天建议点外卖，推荐热汤面、火锅等暖身食物"
    elif temp > 30:
        return "天气炎热，推荐清淡凉爽的食物，如沙拉、凉面、冷饮"
    elif temp < 10:
        return "天气寒冷，推荐热食如火锅、砂锅、热汤"
    else:
        return "天气适宜，各类美食都很合适"


async def execute_get_traffic(args: Dict[str, Any]) -> Dict[str, Any]:
    """获取交通"""
    location = args.get("location", DEFAULT_CITY)
    latitude = args.get("latitude", DEFAULT_LATITUDE)
    longitude = args.get("longitude", DEFAULT_LONGITUDE)
    
    if not map_service:
        return {"error": "地图服务未初始化"}
    
    try:
        traffic = await map_service.get_traffic_info(latitude, longitude)
        if traffic:
            return {
                "location": location,
                "congestion_level": traffic.congestion_level,
                "congestion_index": traffic.congestion_index,
                "recommendation": _get_traffic_recommendation(traffic)
            }
        return {"congestion_level": "未知", "recommendation": "无法获取交通数据"}
    except Exception as e:
        return {"error": str(e)}


def _get_traffic_recommendation(traffic) -> str:
    """根据交通状况给出推荐"""
    level = traffic.congestion_level
    if level in ["拥堵", "严重拥堵"]:
        return "交通拥堵，建议选择较近的餐厅或点外卖"
    elif level == "缓行":
        return "交通略有拥堵，建议避开高峰期出行"
    else:
        return "交通畅通，可以考虑稍远的餐厅"


async def execute_search_restaurants(args: Dict[str, Any]) -> Dict[str, Any]:
    """搜索餐厅"""
    location = args.get("location", DEFAULT_CITY)
    latitude = args.get("latitude", DEFAULT_LATITUDE)
    longitude = args.get("longitude", DEFAULT_LONGITUDE)
    keywords = args.get("keywords", "餐厅")
    radius = args.get("radius", 3000)
    
    if not poi_service:
        return {"error": "POI服务未初始化"}
    
    try:
        restaurants = await poi_service.search_restaurants(
            location=f"{longitude},{latitude}",
            keywords=keywords,
            radius=radius,
            limit=10
        )
        
        return {
            "location": location,
            "keywords": keywords,
            "count": len(restaurants),
            "restaurants": [
                {
                    "name": r.name,
                    "address": r.address,
                    "distance": r.distance,
                    "rating": r.rating,
                    "cuisine": r.cuisine_type,
                    "avg_price": r.avg_price,
                    "phone": r.phone
                }
                for r in restaurants[:10]
            ]
        }
    except Exception as e:
        return {"error": str(e)}


async def execute_smart_recommendations(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    智能推荐 - 完整流程
    
    流程：
    1. 调用amap_poi_service获取附近餐厅
    2. 调用external_api获取环境信息（天气/交通/日历）
    3. LangGraph编排Agent进行智能评分排序
    4. 返回排序后的推荐结果
    """
    user_id = args.get("user_id", "anonymous")
    location = args.get("location", DEFAULT_CITY)
    latitude = args.get("latitude", DEFAULT_LATITUDE)
    longitude = args.get("longitude", DEFAULT_LONGITUDE)
    query = args.get("query", "")
    limit = args.get("limit", 5)
    radius = args.get("radius", 3000)

    if not orchestrator:
        return {"error": "编排器未初始化"}
    
    if not poi_service:
        return {"error": "POI服务未初始化"}
    
    try:
        # ========== Step1：通过高德API获取附近餐厅 ==========
        logger.info(f"[智能推荐] Step 1: 获取附近餐厅 - 位置: {location}, 坐标: ({latitude}, {longitude})")
        
        # 根据用户查询确定搜索关键词
        search_keywords = query if query else "餐厅美食"
        
        restaurants_raw = await poi_service.search_restaurants(
            location=location,
            latitude=latitude,
            longitude=longitude,
            keywords=search_keywords,
            radius=radius,
            limit=30  # 获取更多候选餐厅用于后续排序
        )
        
        logger.info(f"[智能推荐] 获取到 {len(restaurants_raw)} 个候选餐厅")
        
        if not restaurants_raw:
            logger.warning("[智能推荐] 未找到餐厅，返回空结果")
            return {
                "user_id": user_id,
                "location": location,
                "query": query,
                "context": {},
                "recommendations": [],
                "recommendation_reason": "未找到附近餐厅"
            }
        
        # 转换餐厅数据为字典格式，供orchestrator使用
        # search_restaurants已返回字典格式
        restaurants = [
            {
                "id": str(r.get('id', f"poi_{i}")),
                "name": r.get('name', '未知餐厅'),
                "address": r.get('address', ''),
                "distance": r.get('distance', 0),
                "rating": r.get('rating', 4.0),
                "cuisine_type": r.get('cuisine_type', '综合'),
                "avg_price": r.get('avg_price', 30),
                "phone": r.get('tel', ''),
                "estimated_delivery_time": r.get('estimated_delivery_time', 30),
                "is_hot_food": r.get('is_hot_food', True),
                "location": r.get('location', f"{longitude},{latitude}"),
                # 🆕 添加图片字段，用于前端展示
                "image": (r.get('photos', [{}])[0].get('url') if r.get('photos') else None) or r.get('image'),
            }
            for i, r in enumerate(restaurants_raw)
        ]
        
        # ========== Step2：获取环境信息（天气/交通/日历） ==========
        logger.info("[智能推荐] Step 2: 获取环境信息")
        
        env_info = await execute_analyze_environment({
            "city": location,
            "latitude": latitude,
            "longitude": longitude
        })
        
        logger.info(f"[智能推荐] 环境信息: 天气={env_info.get('weather', {}).get('condition', 'N/A')}, "
                   f"时段={env_info.get('temporal', {}).get('meal_time', 'N/A')}")
        
        # ========== Step3：LangGraph 编排 - 智能评分排序 ==========
        logger.info("[智能推荐] Step 3: LangGraph 编排智能评分")
        
        result = await orchestrator.orchestrate(
            user_query=query,
            location=location,
            restaurants=restaurants,
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            top_k=limit
        )
        
        recommendations = result.get("recommendations", [])[:limit]
        
        logger.info(f"[智能推荐] 完成! 推荐 {len(recommendations)} 个餐厅")
        
        # ========== Step4：构建返回结果 ==========
        return {
            "user_id": user_id,
            "location": location,
            "query": query,
            "context": {
                "environment": env_info,
                "context_analysis": result.get("context_analysis", {}),
                "profile_analysis": result.get("profile_analysis", {})
            },
            "candidate_count": len(restaurants),
            "recommendations": recommendations,
            "recommendation_reason": result.get("reasoning", "基于环境、用户偏好和餐厅评分综合推荐"),
            "confidence_score": result.get("confidence_score", 0.0),
            "workflow": {
                "orchestrator": result.get("orchestrator", "langgraph"),
                "node_history": result.get("node_history", []),
                "processing_time_ms": result.get("processing_time_ms", 0)
            }
        }
        
    except Exception as e:
        logger.error(f"[智能推荐] 失败: {e}", exc_info=True)
        logger.info("[智能推荐] 降级到简单餐厅搜索")
        return await execute_search_restaurants({
            "location": location,
            "latitude": latitude,
            "longitude": longitude,
            "keywords": query or "餐厅"
        })
async def execute_analyze_user_profile(args: Dict[str, Any]) -> Dict[str, Any]:
    """分析用户画像"""
    user_id = args.get("user_id", "anonymous")
    query = args.get("query", "")
    
    return {
        "user_id": user_id,
        "profile": {
            "cuisine_preferences": ["川菜", "粤菜", "湘菜"],
            "price_sensitivity": "medium",
            "taste_profile": {
                "spicy": 0.7,
                "sweet": 0.3,
                "sour": 0.4
            }
        },
        "intent": {
            "detected_from_query": query,
            "inferred_cuisine": _infer_cuisine_from_query(query),
            "inferred_mood": _infer_mood_from_query(query)
        }
    }


def _infer_cuisine_from_query(query: str) -> Optional[str]:
    """从查询推断菜系"""
    cuisine_keywords = {
        "川菜": ["川菜", "麻辣", "辣", "四川"],
        "粤菜": ["粤菜", "广东", "清淡", "煲汤"],
        "湘菜": ["湘菜", "湖南"],
        "火锅": ["火锅", "涮"],
        "烧烤": ["烧烤", "撸串"],
        "日料": ["日料", "寿司", "刺身"],
        "西餐": ["西餐", "牛排", "披萨"]
    }
    
    for cuisine, keywords in cuisine_keywords.items():
        if any(kw in query for kw in keywords):
            return cuisine
    return None


def _infer_mood_from_query(query: str) -> str:
    """从查询推断心情"""
    if any(w in query for w in ["庆祝", "约会", "聚餐"]):
        return "celebration"
    elif any(w in query for w in ["随便", "快", "简单"]):
        return "casual"
    elif any(w in query for w in ["好吃", "推荐", "特色"]):
        return "exploring"
    return "normal"


async def execute_get_system_status(args: Dict[str, Any]) -> Dict[str, Any]:
    """获取系统状态"""
    return {
        "status": "running",
        "services": {
            "weather_service": weather_service is not None,
            "map_service": map_service is not None,
            "calendar_service": calendar_service is not None,
            "poi_service": poi_service is not None,
            "orchestrator": orchestrator is not None,
            "parallel_orchestrator": parallel_orchestrator is not None
        },
        "mcp_version": "1.0.0",
        "transport": "HTTP/SSE",
        "tools_count": len(MCP_TOOLS),
        "timestamp": datetime.now().isoformat()
    }


async def execute_parallel_recommendations(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    使用并行智能体架构获取智能推荐
    
    架构流程:
    📡 主页 API → 🔗 MCP Client → 📦 MCP Server 
           ↓
    ┌──────┴──────┐
    │  并行执行    │
    ├─────────────┤
    │ContextAgent │ (天气/交通/日历)
    │RetrievalAgent│ (POI检索)  
    │ProfilerAgent │ (用户画像)
    └──────┬──────┘
           ↓
    ┌─────────────┐
    │ReasoningAgent│ (核心大脑 - LLM深度推理)
    └──────┬──────┘
           ↓
         ✅ 返回推荐 + 暖心文案
    """
    user_id = args.get("user_id", "anonymous")
    location = args.get("location", DEFAULT_CITY)
    latitude = args.get("latitude", DEFAULT_LATITUDE)
    longitude = args.get("longitude", DEFAULT_LONGITUDE)
    query = args.get("query", "")
    limit = args.get("limit", 5)
    radius = args.get("radius", 3000)
    
    logger.info(f"🚀 [并行推荐] 开始 - 用户: {user_id}, 位置: {location}")
    
    if not parallel_orchestrator:
        logger.error("[并行推荐] 并行编排器未初始化")
        return {"error": "并行编排器未初始化，请检查服务配置"}
    
    try:
        import time
        start_time = time.time()
        
        # 调用并行编排器
        result = await parallel_orchestrator.orchestrate(
            user_id=user_id,
            location=location,
            latitude=latitude,
            longitude=longitude,
            query=query,
            limit=limit,
            radius=radius
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"✅ [并行推荐] 完成! 推荐 {len(result.get('recommendations', []))} 个餐厅, 耗时 {processing_time}ms")
        
        return {
            "user_id": user_id,
            "location": location,
            "query": query,
            "recommendations": result.get("recommendations", []),
            "warm_message": result.get("warm_message", ""),
            "reasoning": result.get("reasoning", ""),
            "context": {
                "environment": result.get("environment_context", {}),
                "profile": result.get("user_profile", {}),
                "candidates_count": result.get("candidates_count", 0)
            },
            "workflow": {
                "orchestrator": "parallel",
                "agents": ["ContextAgent", "RetrievalAgent", "ProfilerAgent", "ReasoningAgent"],
                "processing_time_ms": processing_time
            },
            "mcp_used": True
        }
        
    except Exception as e:
        logger.error(f"❌ [并行推荐] 失败: {e}", exc_info=True)
        # 降级到普通智能推荐
        logger.info("[并行推荐] 降级到普通智能推荐")
        return await execute_smart_recommendations(args)


# 工具执行器映射
TOOL_EXECUTORS = {
    "analyze_environment": execute_analyze_environment,
    "get_weather_analysis": execute_get_weather,
    "get_traffic_analysis": execute_get_traffic,
    "search_restaurants": execute_search_restaurants,
    "get_smart_recommendations": execute_smart_recommendations,
    "analyze_user_profile": execute_analyze_user_profile,
    "get_agent_system_status": execute_get_system_status,
    "get_parallel_recommendations": execute_parallel_recommendations
}


# ============================================================================
# FastAPI应用
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    init_services()
    logger.info("🚀 MCP HTTP/SSE 服务器启动")
    yield
    logger.info("👋 MCP HTTP/SSE 服务器关闭")


app = FastAPI(
    title="MCP HTTP/SSE Server",
    description="Model Context Protocol over HTTP/SSE - 远程 MCP 服务",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# MCP协议端点
# ============================================================================

class MCPRequest(BaseModel):
    """MCP请求模型"""
    jsonrpc: str = "2.0"
    id: Optional[int] = None
    method: str
    params: Optional[Dict[str, Any]] = None


class MCPResponse(BaseModel):
    """MCP响应模型"""
    jsonrpc: str = "2.0"
    id: Optional[int] = None
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "MCP HTTP/SSE Server",
        "description": "Model Context Protocol over HTTP/SSE",
        "version": "1.0.0",
        "endpoints": {
            "mcp_rpc": "POST /mcp/rpc - JSON-RPC 调用",
            "mcp_sse": "GET /mcp/sse - SSE 流式连接",
            "tools_list": "GET /mcp/tools - 列出所有工具",
            "tool_call": "POST /mcp/tools/{name} - 调用指定工具"
        }
    }


@app.get("/mcp/tools")
async def list_tools():
    """列出所有MCP工具"""
    return {
        "tools": MCP_TOOLS
    }


@app.post("/mcp/tools/{tool_name}")
async def call_tool(tool_name: str, request: Request):
    """调用指定MCP工具"""
    if tool_name not in TOOL_EXECUTORS:
        raise HTTPException(status_code=404, detail=f"工具 '{tool_name}' 不存在")
    
    try:
        body = await request.json()
    except:
        body = {}
    
    # 从 body 中提取 arguments（如果存在）
    args = body.get("arguments", body)
    
    executor = TOOL_EXECUTORS[tool_name]
    result = await executor(args)

    return {
        "tool": tool_name,
        "result": result
    }
@app.post("/mcp/rpc")
async def mcp_rpc(request: MCPRequest):
    """MCP JSON-RPC 端点"""
    method = request.method
    params = request.params or {}
    
    # 处理不同的MCP方法
    if method == "initialize":
        return MCPResponse(
            id=request.id,
            result={
                "protocolVersion": "2024-11-05",
                "serverInfo": {
                    "name": "food-delivery-mcp",
                    "version": "1.0.0"
                },
                "capabilities": {
                    "tools": {"listChanged": False},
                    "resources": {"listChanged": False}
                }
            }
        )
    
    elif method == "tools/list":
        return MCPResponse(
            id=request.id,
            result={"tools": MCP_TOOLS}
        )
    
    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if tool_name not in TOOL_EXECUTORS:
            return MCPResponse(
                id=request.id,
                error={"code": -32601, "message": f"工具 '{tool_name}' 不存在"}
            )
        
        try:
            executor = TOOL_EXECUTORS[tool_name]
            result = await executor(arguments)
            return MCPResponse(
                id=request.id,
                result={
                    "content": [
                        {"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}
                    ]
                }
            )
        except Exception as e:
            return MCPResponse(
                id=request.id,
                error={"code": -32603, "message": str(e)}
            )
    
    elif method == "resources/list":
        return MCPResponse(
            id=request.id,
            result={"resources": []}
        )
    
    else:
        return MCPResponse(
            id=request.id,
            error={"code": -32601, "message": f"方法 '{method}' 不支持"}
        )


@app.get("/mcp/sse")
async def mcp_sse(request: Request):
    """MCP SSE端点 - 支持流式通信"""
    
    async def event_generator():
        # 发送初始连接确认
        yield f"data: {json.dumps({'type': 'connected', 'message': 'MCP SSE 连接已建立'})}\n\n"
        
        # 保持连接
        while True:
            if await request.is_disconnected():
                break
            
            # 发送心跳
            yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
            await asyncio.sleep(30)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.get("/health")
async def health():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# 主函数
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("MCP_HTTP_PORT", "8003"))
    
    print(f"""
╔══════════════════════════════════════════════════════════════════╗
║           MCP over HTTP/SSE 服务器                               ║
╠══════════════════════════════════════════════════════════════════╣
║  端口: {port}                                                     ║
║  文档: http://localhost:{port}/docs                               ║
║                                                                  ║
║  MCP 端点:                                                       ║
║    - GET  /mcp/tools          列出工具                           ║
║    - POST /mcp/tools/{{name}}  调用工具                           ║
║    - POST /mcp/rpc            JSON-RPC                           ║
║    - GET  /mcp/sse            SSE 流式                           ║
╚══════════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "mcp_http_server:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
