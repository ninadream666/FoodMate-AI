"""
增强版MCP服务器 - 多智能体协议服务

实现标准化的Model Context Protocol (MCP)，
让各服务以标准化方式暴露能力，支持即插即用。

服务能力:
1. 环境感知工具 (weather, traffic, temporal)
2. 用户画像工具 (profile, preferences)
3. 决策推荐工具 (recommendation, ranking)
4. 餐厅搜索工具 (search, filter)
"""

from mcp.server.fastmcp import FastMCP
from typing import Dict, List, Any, Optional
import json
import asyncio
from datetime import datetime
import os
import sys
import logging

from dotenv import load_dotenv
load_dotenv()

# 添加路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入智能体模块
from app.agents import (
    ContextAgent,
    ProfilerAgent,
    DecisionAgent,
    LangGraphOrchestrator,
    create_langgraph_orchestrator
)

# 导入外部服务
from app.services.external_api import WeatherAPIService, MapAPIService, CalendarAPIService
from app.services.amap_poi_service import AmapPOIService

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 默认配置
DEFAULT_CITY = os.getenv("DEFAULT_CITY", "深圳")
DEFAULT_LATITUDE = float(os.getenv("DEFAULT_LATITUDE", "22.5431"))
DEFAULT_LONGITUDE = float(os.getenv("DEFAULT_LONGITUDE", "114.0579"))

# 初始化MCP服务器
mcp = FastMCP("SmartDeliveryAgentSystem")

# 初始化服务
weather_service = None
map_service = None
calendar_service = None
poi_service = None
orchestrator = None


def init_services():
    """初始化所有服务"""
    global weather_service, map_service, calendar_service, poi_service, orchestrator
    
    try:
        weather_service = WeatherAPIService()
        map_service = MapAPIService()
        calendar_service = CalendarAPIService()
        poi_service = AmapPOIService()
        
        # 创建 LangGraph 编排器
        orchestrator = create_langgraph_orchestrator(
            weather_service=weather_service,
            map_service=map_service,
            calendar_service=calendar_service,
            mab_strategy="contextual"
        )
        
        logger.info("✅ 所有服务初始化成功")
    except Exception as e:
        logger.error(f"服务初始化失败: {e}")


# 启动时初始化
init_services()


# =============================================================================
# 环境感知工具（Context Awareness Tools）
# =============================================================================

@mcp.tool()
async def analyze_environment(
    city: str = None,
    latitude: float = None,
    longitude: float = None,
    location: str = None
) -> str:
    """
    🌍 综合环境分析工具
    
    分析当前环境状态，包括天气、交通和时间因素。
    这是一个高级工具，整合了多个环境感知能力。
    
    Args:
        city: 城市名称（如"深圳"）
        latitude: 纬度
        longitude: 经度
        location: 具体位置描述
        
    Returns:
        JSON格式的环境分析结果，包含：
        - weather: 天气分析
        - traffic: 交通分析  
        - temporal: 时间上下文
        - environment_impact: 综合影响评估
    """
    try:
        if orchestrator:
            context_agent = orchestrator.context_agent
            result = await context_agent.process({
                "city": city or DEFAULT_CITY,
                "latitude": latitude,
                "longitude": longitude,
                "location": location or city or DEFAULT_CITY
            })
            return json.dumps(result, ensure_ascii=False, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "编排器未初始化"
            }, ensure_ascii=False)
    except Exception as e:
        logger.error(f"环境分析失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@mcp.tool()
async def get_weather_analysis(
    city: str = None,
    latitude: float = None,
    longitude: float = None
) -> str:
    """
    🌤️ 天气分析工具
    
    获取详细的天气分析，包括配送影响和食物推荐。
    
    Args:
        city: 城市名称
        latitude: 纬度（可选，优先级高于城市）
        longitude: 经度
        
    Returns:
        天气分析结果JSON，包含：
        - condition: 天气状况
        - temperature: 温度
        - humidity: 湿度
        - delivery_impact: 配送影响评估
        - food_suggestions: 推荐食物类型
    """
    try:
        if weather_service:
            # 如果没有提供经纬度，使用默认位置
            if latitude is None or longitude is None:
                # 深圳默认坐标
                latitude = 22.5431
                longitude = 114.0579
            
            weather_data = await weather_service.get_weather(latitude, longitude)
            
            # 使用 ContextAgent 处理天气数据
            if orchestrator:
                processed = orchestrator.context_agent._process_weather_data(weather_data)
                return json.dumps({
                    "success": True,
                    "weather": processed,
                    "raw_data": weather_data.to_dict() if weather_data else None
                }, ensure_ascii=False, indent=2)
            
            return json.dumps({
                "success": True,
                "weather": weather_data.to_dict() if weather_data else None
            }, ensure_ascii=False, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "天气服务未初始化"
            }, ensure_ascii=False)
    except Exception as e:
        logger.error(f"天气分析失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@mcp.tool()
async def get_traffic_analysis(
    city: str = None,
    latitude: float = None,
    longitude: float = None,
    location: str = None
) -> str:
    """
    🚦 交通分析工具
    
    获取交通状况分析，评估配送时间影响。
    
    Args:
        city: 城市名称
        latitude: 纬度
        longitude: 经度
        location: 具体位置
        
    Returns:
        交通分析结果JSON，包含：
        - congestion_level: 拥堵等级
        - congestion_index: 拥堵指数
        - recommended_delivery_radius: 推荐配送半径
        - tips: 交通建议
    """
    try:
        if map_service:
            # 如果没有提供经纬度，使用默认位置
            if latitude is None or longitude is None:
                # 深圳默认坐标
                latitude = 22.5431
                longitude = 114.0579
            
            traffic_data = await map_service.get_traffic_info(latitude, longitude)
            
            if orchestrator:
                processed = orchestrator.context_agent._process_traffic_data(traffic_data)
                return json.dumps({
                    "success": True,
                    "traffic": processed
                }, ensure_ascii=False, indent=2)
            
            return json.dumps({
                "success": True,
                "traffic": traffic_data.to_dict() if traffic_data else {
                    "congestion_level": "未知",
                    "congestion_index": 1.0,
                    "recommended_delivery_radius": 5000,
                    "estimated_delay_factor": 1.0,
                    "tips": "配送正常"
                }
            }, ensure_ascii=False, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "地图服务未初始化"
            }, ensure_ascii=False)
    except Exception as e:
        logger.error(f"交通分析失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


# =============================================================================
# 用户画像工具（User Profiling Tools）
# =============================================================================

@mcp.tool()
async def analyze_user_profile(
    user_id: str = "guest",
    query: str = "",
    context: str = "{}"
) -> str:
    """
    👤 用户画像分析工具
    
    分析用户偏好、行为模式和个性化特征。
    
    Args:
        user_id: 用户ID
        query: 用户查询/需求描述
        context: 环境上下文JSON字符串
        
    Returns:
        用户画像分析结果JSON，包含：
        - profile: 用户基础画像
        - intent_analysis: 意图分析
        - adjusted_preferences: 上下文调整后的偏好
        - recommendation_weights: 推荐权重
    """
    try:
        if orchestrator:
            # 解析上下文
            try:
                context_dict = json.loads(context) if isinstance(context, str) else context
            except:
                context_dict = {}
            
            result = await orchestrator.profiler_agent.process({
                "user_id": user_id,
                "query": query,
                "context": context_dict
            })
            return json.dumps(result, ensure_ascii=False, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "编排器未初始化"
            }, ensure_ascii=False)
    except Exception as e:
        logger.error(f"用户画像分析失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@mcp.tool()
async def get_user_preferences(
    user_id: str = "guest"
) -> str:
    """
    ❤️ 获取用户偏好
    
    获取用户的餐饮偏好设置。
    
    Args:
        user_id: 用户ID
        
    Returns:
        用户偏好JSON，包含：
        - preferred_cuisines: 偏好菜系
        - price_range: 价格区间
        - taste_preferences: 口味偏好
        - dietary_restrictions: 饮食限制
    """
    try:
        if orchestrator:
            profile = await orchestrator.profiler_agent._get_or_create_profile(user_id)
            return json.dumps({
                "success": True,
                "user_id": user_id,
                "preferences": profile.to_dict()
            }, ensure_ascii=False, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "编排器未初始化"
            }, ensure_ascii=False)
    except Exception as e:
        logger.error(f"获取用户偏好失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


# =============================================================================
# 推荐决策工具（Recommendation Decision Tools）
# =============================================================================

@mcp.tool()
async def get_smart_recommendations(
    query: str,
    location: str,
    user_id: str = "guest",
    latitude: float = None,
    longitude: float = None,
    max_results: int = 10
) -> str:
    """
    智能推荐工具（完整编排）
    
    执行完整的多智能体推荐编排流程：
    ContextAgent → ProfilerAgent → DecisionAgent
    
    这是最高级的推荐工具，整合了环境感知、用户画像和MAB决策。
    
    Args:
        query: 用户查询/需求描述
        location: 用户位置
        user_id: 用户ID
        latitude: 纬度（精准定位）
        longitude: 经度
        max_results: 最大返回数量
        
    Returns:
        智能推荐结果JSON，包含：
        - recommendations: 推荐餐厅列表（带评分和排名）
        - reasoning: AI推理说明
        - confidence_score: 置信度
        - context_analysis: 环境分析详情
        - profile_analysis: 用户画像详情
        - node_history: 智能体执行路径
    """
    try:
        # 搜索附近餐厅
        if poi_service:
            restaurants = await poi_service.search_restaurants(
                location=location,
                latitude=latitude,
                longitude=longitude,
                keywords="餐厅",
                radius=5000,
                limit=30
            )
        else:
            restaurants = []
        
        if not restaurants:
            return json.dumps({
                "success": False,
                "error": "未找到附近餐厅",
                "recommendations": []
            }, ensure_ascii=False)
        
        # 转换为标准格式
        formatted_restaurants = []
        for r in restaurants:
            formatted_restaurants.append({
                "id": r.get("id", ""),
                "name": r.get("name", ""),
                "cuisine_type": r.get("type", "餐厅"),
                "rating": float(r.get("rating", 4.0)),
                "avg_price": int(r.get("avg_price", 40)),
                "distance": int(r.get("distance", 2000)),
                "estimated_delivery_time": int(r.get("distance", 2000)) // 100 + 15,
                "address": r.get("address", ""),
                "tel": r.get("tel", ""),
                "is_hot_food": True
            })
        
        # 执行智能编排
        if orchestrator:
            result = await orchestrator.orchestrate(
                user_query=query,
                location=location,
                restaurants=formatted_restaurants,
                user_id=user_id,
                latitude=latitude,
                longitude=longitude,
                top_k=max_results
            )
            
            # 将推荐结果与原始餐厅数据合并
            for rec in result.get("recommendations", []):
                for r in formatted_restaurants:
                    if r["id"] == rec.get("restaurant_id"):
                        rec["restaurant_info"] = r
                        break
            
            return json.dumps(result, ensure_ascii=False, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "编排器未初始化"
            }, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"智能推荐失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@mcp.tool()
async def make_mab_decision(
    restaurants: str,
    context: str = "{}",
    strategy: str = "contextual",
    top_k: int = 5
) -> str:
    """
    MAB决策工具
    
    使用多臂老虎机算法对餐厅进行排序。
    
    支持的策略：
    - ucb1: UCB1算法（探索与利用平衡）
    - thompson: Thompson采样（贝叶斯方法）
    - epsilon: ε-Greedy（简单探索）
    - contextual: 上下文感知MAB（默认，综合考虑多个因素）
    
    Args:
        restaurants: 餐厅列表JSON字符串
        context: 决策上下文JSON字符串
        strategy: MAB策略
        top_k: 返回前K个结果
        
    Returns:
        MAB决策结果JSON
    """
    try:
        # 解析输入
        try:
            restaurants_list = json.loads(restaurants) if isinstance(restaurants, str) else restaurants
            context_dict = json.loads(context) if isinstance(context, str) else context
        except:
            return json.dumps({
                "success": False,
                "error": "输入格式错误，请提供有效的JSON"
            }, ensure_ascii=False)
        
        if orchestrator:
            # 临时切换策略
            original_strategy = orchestrator.decision_agent.strategy_name
            orchestrator.decision_agent.set_strategy(strategy)
            
            result = await orchestrator.decision_agent.process({
                "restaurants": restaurants_list,
                "context_analysis": context_dict.get("context_analysis", {}),
                "profile_analysis": context_dict.get("profile_analysis", {}),
                "user_query": context_dict.get("query", ""),
                "top_k": top_k
            })
            
            # 恢复策略
            orchestrator.decision_agent.set_strategy(original_strategy)
            
            return json.dumps(result, ensure_ascii=False, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "编排器未初始化"
            }, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"MAB决策失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@mcp.tool()
async def update_recommendation_feedback(
    restaurant_id: str,
    reward: float,
    feedback_type: str = "order"
) -> str:
    """
    更新推荐反馈
    
    记录用户对推荐的反馈，用于MAB算法的在线学习。
    
    Args:
        restaurant_id: 餐厅ID
        reward: 奖励值（0-1，1表示正向反馈）
        feedback_type: 反馈类型（order/click/rating）
        
    Returns:
        更新结果JSON
    """
    try:
        if orchestrator:
            # 根据反馈类型调整奖励
            adjusted_reward = reward
            if feedback_type == "click":
                adjusted_reward = reward * 0.3
            elif feedback_type == "rating":
                adjusted_reward = reward * 0.5
            
            orchestrator.update_reward(restaurant_id, adjusted_reward)
            
            return json.dumps({
                "success": True,
                "restaurant_id": restaurant_id,
                "reward_applied": adjusted_reward,
                "feedback_type": feedback_type
            }, ensure_ascii=False, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "编排器未初始化"
            }, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"更新反馈失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


# =============================================================================
# 餐厅搜索工具（Restaurant Search Tools）
# =============================================================================

@mcp.tool()
async def search_restaurants(
    location: str = None,
    latitude: float = None,
    longitude: float = None,
    keywords: str = "餐厅",
    category: str = "全部",
    max_distance: int = 5000,
    limit: int = 20
) -> str:
    """
    搜索附近餐厅
    
    使用高德POI API搜索附近餐厅。
    
    Args:
        location: 位置描述（如"深圳市南山区"）
        latitude: 纬度（精准搜索）
        longitude: 经度
        keywords: 搜索关键词
        category: 餐厅类别
        max_distance: 最大搜索半径（米）
        limit: 返回数量限制
        
    Returns:
        餐厅列表JSON
    """
    try:
        if poi_service:
            restaurants = await poi_service.search_restaurants(
                location=location or DEFAULT_CITY,
                latitude=latitude,
                longitude=longitude,
                keywords=keywords,
                radius=max_distance,
                limit=limit
            )
            
            return json.dumps({
                "success": True,
                "count": len(restaurants),
                "restaurants": restaurants
            }, ensure_ascii=False, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "POI服务未初始化"
            }, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"搜索餐厅失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


# =============================================================================
# 系统工具（System Tools）
# =============================================================================

@mcp.tool()
async def get_agent_system_status() -> str:
    """
    获取智能体系统状态
    
    返回所有智能体的当前状态和配置信息。
    
    Returns:
        系统状态JSON，包含：
        - agents: 各智能体状态
        - mab_strategy: 当前MAB策略
        - services: 外部服务状态
        - capabilities: 系统能力列表
    """
    try:
        status = {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "orchestrator_type": "langgraph" if orchestrator else "none",
            "agents": {},
            "mab_strategy": None,
            "services": {
                "weather": weather_service is not None,
                "map": map_service is not None,
                "calendar": calendar_service is not None,
                "poi": poi_service is not None
            },
            "capabilities": [
                "environment_analysis",
                "user_profiling",
                "mab_recommendation",
                "restaurant_search",
                "online_learning"
            ]
        }
        
        if orchestrator:
            status["agents"] = orchestrator.get_agent_states()
            status["mab_strategy"] = orchestrator.decision_agent.strategy_name
        
        return json.dumps(status, ensure_ascii=False, indent=2)
        
    except Exception as e:
        logger.error(f"获取系统状态失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@mcp.tool()
async def switch_mab_strategy(strategy: str) -> str:
    """
    切换MAB策略
    
    动态切换推荐决策使用的MAB算法。
    
    可用策略：
    - ucb1: UCB1算法
    - thompson: Thompson采样
    - epsilon: ε-Greedy
    - contextual: 上下文感知MAB
    
    Args:
        strategy: 策略名称
        
    Returns:
        切换结果JSON
    """
    try:
        valid_strategies = ["ucb1", "thompson", "epsilon", "contextual"]
        if strategy not in valid_strategies:
            return json.dumps({
                "success": False,
                "error": f"无效策略，可用策略: {valid_strategies}"
            }, ensure_ascii=False)
        
        if orchestrator:
            orchestrator.set_mab_strategy(strategy)
            return json.dumps({
                "success": True,
                "new_strategy": strategy,
                "message": f"已切换到 {strategy} 策略"
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "success": False,
                "error": "编排器未初始化"
            }, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"切换策略失败: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


# =============================================================================
# MCP资源（Resources）
# =============================================================================

@mcp.resource("agent://context-agent/capabilities")
async def get_context_agent_capabilities() -> str:
    """获取环境感知智能体能力描述"""
    return json.dumps({
        "name": "ContextAgent",
        "description": "环境感知智能体 - 观察和分析天气、交通、时间等环境因素",
        "capabilities": [
            {
                "name": "weather_analysis",
                "description": "天气分析，评估配送影响",
                "input": ["city", "latitude", "longitude"],
                "output": ["condition", "temperature", "delivery_impact", "food_suggestions"]
            },
            {
                "name": "traffic_analysis", 
                "description": "交通分析，评估配送时间",
                "input": ["city", "location"],
                "output": ["congestion_level", "recommended_delivery_radius"]
            },
            {
                "name": "temporal_analysis",
                "description": "时间上下文分析（节假日、用餐时段）",
                "input": ["date"],
                "output": ["meal_period", "is_holiday", "is_peak_hour"]
            }
        ],
        "mcp_version": "1.0"
    }, ensure_ascii=False, indent=2)


@mcp.resource("agent://profiler-agent/capabilities")  
async def get_profiler_agent_capabilities() -> str:
    """获取用户画像智能体能力描述"""
    return json.dumps({
        "name": "ProfilerAgent",
        "description": "用户画像智能体 - 分析用户偏好和个性化特征",
        "capabilities": [
            {
                "name": "user_profiling",
                "description": "构建用户画像",
                "input": ["user_id"],
                "output": ["preferred_cuisines", "price_range", "taste_preferences"]
            },
            {
                "name": "intent_analysis",
                "description": "分析用户意图",
                "input": ["query"],
                "output": ["intent_type", "detected_keywords", "urgency"]
            },
            {
                "name": "preference_adjustment",
                "description": "根据上下文调整偏好",
                "input": ["profile", "context"],
                "output": ["adjusted_preferences", "recommendation_weights"]
            }
        ],
        "mcp_version": "1.0"
    }, ensure_ascii=False, indent=2)


@mcp.resource("agent://decision-agent/capabilities")
async def get_decision_agent_capabilities() -> str:
    """获取决策智能体能力描述"""
    return json.dumps({
        "name": "DecisionAgent",
        "description": "决策智能体 - 使用MAB算法进行推荐决策",
        "capabilities": [
            {
                "name": "mab_ranking",
                "description": "多臂老虎机排序",
                "input": ["restaurants", "context"],
                "output": ["ranked_recommendations", "scores"]
            },
            {
                "name": "reasoning_generation",
                "description": "生成推荐理由",
                "input": ["recommendations", "context"],
                "output": ["reasoning"]
            },
            {
                "name": "reward_learning",
                "description": "在线学习更新",
                "input": ["restaurant_id", "reward"],
                "output": ["updated_stats"]
            }
        ],
        "strategies": ["ucb1", "thompson", "epsilon", "contextual"],
        "mcp_version": "1.0"
    }, ensure_ascii=False, indent=2)


# =============================================================================
# 主入口
# =============================================================================

def main():
    """启动MCP服务器（stdio模式）"""
    import sys
    
    print("🚀 启动智能外卖推荐多智能体MCP服务器...", file=sys.stderr)
    print("", file=sys.stderr)
    print("📡 智能体系统:", file=sys.stderr)
    print("   - ContextAgent: 环境感知（天气/交通/时间）", file=sys.stderr)
    print("   - ProfilerAgent: 用户画像（偏好/意图）", file=sys.stderr)
    print("   - DecisionAgent: MAB决策（UCB1/Thompson/ε-Greedy）", file=sys.stderr)
    print("", file=sys.stderr)
    print("🛠️ 可用工具:", file=sys.stderr)
    print("   - analyze_environment: 综合环境分析", file=sys.stderr)
    print("   - get_weather_analysis: 天气分析", file=sys.stderr)
    print("   - get_traffic_analysis: 交通分析", file=sys.stderr)
    print("   - analyze_user_profile: 用户画像分析", file=sys.stderr)
    print("   - get_smart_recommendations: 智能推荐（完整编排）", file=sys.stderr)
    print("   - make_mab_decision: MAB决策", file=sys.stderr)
    print("   - search_restaurants: 餐厅搜索", file=sys.stderr)
    print("", file=sys.stderr)
    print("🔗 MCP协议版本: 1.0", file=sys.stderr)
    print("", file=sys.stderr)
    
    mcp.run()


if __name__ == "__main__":
    main()
