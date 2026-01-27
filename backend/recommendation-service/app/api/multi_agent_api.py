"""
多智能体推荐API路由

基于 LangGraph 多智能体编排的推荐API:
- ContextAgent: 环境感知
- ProfilerAgent: 用户画像
- DecisionAgent: MAB决策
"""

from fastapi import APIRouter, HTTPException, Query, Header
from typing import List, Optional
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

from ..models.schemas import (
    RecommendationRequest,
    RecommendationResponse,
    LocationRequest
)
from ..services.multi_agent_recommendation_service import multi_agent_recommendation_service
from ..services.profile_service_client import profile_service_adapter

router = APIRouter(prefix="/agents", tags=["Multi-Agent System"])


@router.post("/recommend", response_model=RecommendationResponse)
async def multi_agent_recommendation(
    request: RecommendationRequest,
    authorization: Optional[str] = Header(None, description="JWT Token (Bearer xxx)")
):
    """
    🤖 多智能体协作推荐

    使用 LangGraph 编排三个协作智能体:
    1. ContextAgent - 感知环境（天气、交通、时间）
    2. ProfilerAgent - 分析用户画像（偏好、意图）
    3. DecisionAgent - MAB算法决策（UCB1/Thompson/ε-Greedy/上下文感知）

    完整的工作流: ContextAgent → ProfilerAgent → DecisionAgent
    
    **传入 Authorization 头可获取真实用户画像**：
    - 如果提供有效的 JWT Token，将从 profile-service 获取真实用户数据
    - 如果未提供 Token，将使用默认画像进行推荐

    **请求示例**:
    ```json
    {
        "location": {
            "address": "深圳市南山区科技园",
            "latitude": 22.5431,
            "longitude": 114.0579
        },
        "max_results": 10
    }
    ```
    """
    try:
        logger.info(f"多智能体推荐请求，位置: {request.location.address}")
        
        # 如果有 Token，设置到用户服务适配器
        user_id = getattr(request, 'user_id', 'guest')
        if authorization and authorization.startswith("Bearer "):
            token = authorization[7:]  # 去掉 "Bearer " 前缀
            profile_service_adapter.set_token(user_id, token)
            logger.info(f"已设置用户 {user_id} 的认证Token，将使用真实画像")
        else:
            logger.info(f"未提供Token，用户 {user_id} 将使用默认画像")

        result = await multi_agent_recommendation_service.get_recommendations(request)
        
        if result.total_count == 0:
            raise HTTPException(
                status_code=404,
                detail="未找到符合条件的餐厅"
            )
        
        logger.info(f"多智能体推荐完成，返回{result.total_count}家餐厅")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"多智能体推荐失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"多智能体推荐服务错误: {str(e)}"
        )


@router.post("/feedback")
async def update_recommendation_feedback(
    restaurant_id: str,
    reward: float = Query(ge=0, le=1, description="奖励值 (0-1)"),
    feedback_type: str = Query(default="order", description="反馈类型: order/click/rating")
):
    """
    📊 更新推荐反馈
    
    记录用户对推荐的反馈，用于MAB算法的在线学习。
    
    - **restaurant_id**: 餐厅ID
    - **reward**: 奖励值 (0表示负面，1表示正面)
    - **feedback_type**: 反馈类型
        - order: 用户下单（权重1.0）
        - click: 用户点击（权重0.3）
        - rating: 用户评分（权重0.5）
    """
    try:
        # 根据反馈类型调整奖励
        adjusted_reward = reward
        if feedback_type == "click":
            adjusted_reward = reward * 0.3
        elif feedback_type == "rating":
            adjusted_reward = reward * 0.5
        
        multi_agent_recommendation_service.update_feedback(restaurant_id, adjusted_reward)
        
        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "reward_applied": adjusted_reward,
            "feedback_type": feedback_type,
            "message": "反馈已记录，将用于改进推荐"
        }
        
    except Exception as e:
        logger.error(f"更新反馈失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"更新反馈失败: {str(e)}"
        )


@router.put("/strategy")
async def switch_mab_strategy(
    strategy: str = Query(
        description="MAB策略: ucb1, thompson, epsilon, contextual"
    )
):
    """
    🔄 切换MAB策略
    
    动态切换推荐决策使用的多臂老虎机算法:
    
    - **ucb1**: Upper Confidence Bound - 探索与利用平衡
    - **thompson**: Thompson Sampling - 贝叶斯方法
    - **epsilon**: ε-Greedy - 简单探索策略
    - **contextual**: 上下文感知MAB（默认，综合多因素）
    """
    valid_strategies = ["ucb1", "thompson", "epsilon", "contextual"]
    if strategy not in valid_strategies:
        raise HTTPException(
            status_code=400,
            detail=f"无效策略，可用: {valid_strategies}"
        )
    
    try:
        multi_agent_recommendation_service.set_mab_strategy(strategy)
        
        return {
            "success": True,
            "new_strategy": strategy,
            "message": f"已切换到 {strategy} 策略"
        }
        
    except Exception as e:
        logger.error(f"切换策略失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"切换策略失败: {str(e)}"
        )


@router.get("/status")
async def get_agent_system_status():
    """
    ⚙️ 获取多智能体系统状态
    
    返回系统当前状态，包括:
    - 智能体可用性
    - MAB策略
    - 外部服务状态
    - 各智能体状态
    """
    try:
        status = multi_agent_recommendation_service.get_system_status()
        
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            **status,
            "capabilities": {
                "environment_sensing": True,
                "user_profiling": True,
                "real_user_profile_service": True,  # 已集成真实用户画像服务
                "mab_decision": True,
                "online_learning": True,
                "strategy_switching": True
            },
            "external_services": {
                "weather_api": "和风天气 (QWeather)",
                "map_api": "高德地图 (AMap)",
                "calendar_api": "聚合数据日历",
                "poi_api": "高德POI搜索",
                "profile_service": "profile-service (用户画像)"
            },
            "mab_strategies": [
                {"name": "ucb1", "description": "UCB1 - 探索与利用平衡"},
                {"name": "thompson", "description": "Thompson Sampling - 贝叶斯方法"},
                {"name": "epsilon", "description": "ε-Greedy - 简单探索"},
                {"name": "contextual", "description": "上下文感知MAB - 综合多因素"}
            ]
        }
        
    except Exception as e:
        logger.error(f"获取系统状态失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"获取状态失败: {str(e)}"
        )


@router.get("/explain")
async def explain_agent_workflow():
    """
    📖 解释多智能体工作流程
    
    详细说明 LangGraph 编排的多智能体协作流程。
    """
    return {
        "title": "🤖 多智能体协作推荐系统",
        "description": "基于 LangGraph 的图状状态机编排，实现三个智能体的协作推荐",
        "workflow": {
            "entry_point": "ContextAgent",
            "flow": [
                {
                    "step": 1,
                    "agent": "ContextAgent",
                    "name": "环境感知智能体",
                    "responsibilities": [
                        "分析天气状况（晴/雨/雪等）",
                        "评估交通拥堵程度",
                        "判断用餐时段和节假日",
                        "计算环境综合影响分数"
                    ],
                    "output": "环境上下文分析结果"
                },
                {
                    "step": 2,
                    "agent": "ProfilerAgent",
                    "name": "用户画像智能体",
                    "responsibilities": [
                        "获取/构建用户画像（支持真实profile-service）",
                        "分析用户查询意图",
                        "根据环境调整用户偏好",
                        "计算推荐权重"
                    ],
                    "data_source": "profile-service（传入Token时使用真实数据）",
                    "output": "用户画像分析结果"
                },
                {
                    "step": 3,
                    "agent": "DecisionAgent",
                    "name": "决策智能体",
                    "responsibilities": [
                        "使用MAB算法排序餐厅",
                        "计算每个餐厅的推荐分数",
                        "生成推荐理由",
                        "记录用户反馈用于在线学习"
                    ],
                    "output": "最终推荐列表"
                }
            ],
            "exit_point": "推荐结果"
        },
        "mab_strategies": {
            "ucb1": "使用置信区间上界平衡探索与利用",
            "thompson": "基于贝塔分布采样的贝叶斯方法",
            "epsilon": "以ε概率探索新选项",
            "contextual": "综合距离、评分、价格、菜系等多因素"
        },
        "features": [
            "✅ 图状态机编排 - 支持条件分支和并行执行",
            "✅ 在线学习 - 通过用户反馈持续优化",
            "✅ 策略切换 - 动态切换MAB算法",
            "✅ 降级容错 - 智能体失败时自动降级"
        ]
    }
