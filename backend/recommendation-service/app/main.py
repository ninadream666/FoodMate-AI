"""
智能推荐服务主应用
基于天气、节气、时间、交通、地点等多维度因素推荐餐厅

支持两种推荐模式：
1. MCP智能体编排（原有）
2. LangGraph多智能体协作（新）- ContextAgent → ProfilerAgent → DecisionAgent
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from datetime import datetime
import uvicorn
from dotenv import load_dotenv
import os
import logging

# 加载环境变量
load_dotenv()

logger = logging.getLogger(__name__)

from .api.health import router as health_router
from .api.multi_agent_api import router as multi_agent_router
from .api.mcp_api import router as mcp_router, startup_mcp, shutdown_mcp
from .api.auth_api import router as auth_router
from .api.ml_api import router as ml_router
from .models.schemas import HealthCheckResponse

# 创建FastAPI应用实例
app = FastAPI(
    title="智能餐厅推荐服务",
    description="""
    基于天气、节气、时间、交通、地点等多维度因素的智能餐厅推荐系统。
    
    ## 🤖 多智能体架构
    
    本服务采用先进的多智能体协作架构，基于 LangGraph 实现图状态机编排：
    
    - **ContextAgent**: 环境感知智能体（天气、交通、时间）
    - **ProfilerAgent**: 用户画像智能体（偏好、意图分析）
    - **DecisionAgent**: 决策智能体（MAB算法推荐）
    
    ## 📡 协议支持
    
    - Model Context Protocol (MCP) - 标准化智能体通信
    - 多种MAB策略：UCB1、Thompson Sampling、ε-Greedy、上下文感知
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 添加验证错误处理器 - 详细记录422错误
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """处理请求验证错误，记录详细信息"""
    body = None
    try:
        body = await request.body()
        body = body.decode('utf-8') if body else "empty"
    except:
        body = "unable to read body"
    
    logger.error(f"请求验证失败 [{request.method} {request.url.path}]")
    logger.error(f"请求体: {body}")
    logger.error(f"验证错误详情: {exc.errors()}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body_received": body[:500] if isinstance(body, str) else str(body)[:500],  # 限制长度
            "hint": "请求体需要包含 location 字段，location 需要包含 address 字段"
        }
    )


# 注册路由
app.include_router(
    health_router,
    prefix="/api/v1",
    tags=["API健康监控"]
)

# 注册多智能体推荐路由
app.include_router(
    multi_agent_router,
    prefix="/api/v2",
    tags=["多智能体推荐"]
)

# 注册 MCP 集成推荐路由
app.include_router(
    mcp_router,
    tags=["MCP智能推荐"]
)

# 注册认证路由（用于前端开发测试）
app.include_router(
    auth_router,
    tags=["认证"]
)

# 注册 ML 模型管理路由
app.include_router(
    ml_router,
    prefix="/api/v2",
    tags=["ML模型管理"]
)


# 生命周期事件
@app.on_event("startup")
async def on_startup():
    """启动时初始化 MCP 服务"""
    await startup_mcp()


@app.on_event("shutdown")
async def on_shutdown():
    """关闭时清理 MCP 服务"""
    await shutdown_mcp()


@app.get("/")
def read_root():
    """根路径"""
    return {
        "service": "智能餐厅推荐服务",
        "version": "2.0.0",
        "description": "基于多智能体协作的智能餐厅推荐系统",
        "features": [
            "天气感知推荐",
            "节气时令推荐",
            "时间场景推荐",
            "交通状况感知",
            "地理位置优化",
            "LangGraph多智能体编排",
            "MAB在线学习推荐"
        ],
        "agents": {
            "ContextAgent": "环境感知（天气/交通/时间）",
            "ProfilerAgent": "用户画像（偏好/意图）",
            "DecisionAgent": "MAB决策（UCB1/Thompson/ε-Greedy）"
        },
        "docs": "/docs",
        "health": "/health",
        "api_versions": {
            "v1": "/api/v1/recommendations - 基础智能体编排",
            "v2": "/api/v2/agents - LangGraph多智能体",
            "mcp": "/api/v2/mcp - MCP协议智能推荐"
        },
        "timestamp": datetime.now()
    }

@app.get("/health", response_model=HealthCheckResponse)
def health_check():
    """健康检查端点"""
    return HealthCheckResponse(
        service="recommendation-service",
        message="服务运行正常"
    )

@app.get("/api/v1/status")
def get_service_status():
    """获取服务状态"""
    return {
        "status": "running",
        "service": "recommendation-service",
        "version": "2.0.0",
        "uptime": "正常运行",
        "features_enabled": {
            "weather_integration": True,
            "traffic_analysis": True,
            "seasonal_recommendation": True,
            "time_based_recommendation": True,
            "location_based_filtering": True,
            "multi_agent_orchestration": True,
            "mab_recommendation": True,
            "online_learning": True
        },
        "api_endpoints": {
            "v1": {
                "recommend": "/api/v1/recommendations/recommend",
                "context": "/api/v1/recommendations/context",
                "explain": "/api/v1/recommendations/restaurants/{id}/explain",
                "mixed_search": "/api/v1/recommendations/restaurant_foods/"
            },
            "v2": {
                "recommend": "/api/v2/agents/recommend",
                "feedback": "/api/v2/agents/feedback",
                "strategy": "/api/v2/agents/strategy",
                "status": "/api/v2/agents/status",
                "explain": "/api/v2/agents/explain"
            },
            "mcp": {
                "recommend": "/api/v2/mcp/recommend",
                "status": "/api/v2/mcp/status",
                "tools": "/api/v2/mcp/tools",
                "environment": "/api/v2/mcp/environment",
                "profile": "/api/v2/mcp/profile/{user_id}",
                "restaurants": "/api/v2/mcp/restaurants/search"
            }
        },
        "agents": {
            "ContextAgent": {"status": "active", "role": "环境感知"},
            "ProfilerAgent": {"status": "active", "role": "用户画像"},
            "DecisionAgent": {"status": "active", "role": "MAB决策"}
        },
        "timestamp": datetime.now()
    }

if __name__ == "__main__":
    # 运行应用
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8087,
        reload=True,
        log_level="info"
    )