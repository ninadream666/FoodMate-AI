"""
LangGraph 智能体编排器

基于 LangGraph 的图状态机编排器，实现多智能体协作工作流：

工作流程:
1. START → ContextAgent (环境感知)
2. ContextAgent → ProfilerAgent (用户画像)  
3. ProfilerAgent → DecisionAgent (MAB决策)
4. DecisionAgent → END (输出结果)

支持条件分支:
- 恶劣天气时跳过远距离餐厅
- 高峰时段调整推荐策略
- 用户紧急需求快速响应
"""

from typing import Dict, Any, List, Optional, TypedDict, Annotated
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import asyncio
import logging
import operator
import os
import sys

# 尝试导入 langgraph
try:
    from langgraph.graph import StateGraph, END
    from langgraph.checkpoint.memory import MemorySaver
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    StateGraph = None
    END = "end"

from .context_agent import ContextAgent, create_context_agent
from .profiler_agent import ProfilerAgent, create_profiler_agent
from .decision_agent import DecisionAgent, create_decision_agent

logger = logging.getLogger(__name__)


class WorkflowState(TypedDict, total=False):
    """
    工作流状态定义
    
    LangGraph 使用 TypedDict 来定义图的状态结构，
    所有节点共享此状态，可以读取和更新状态中的字段。
    """
    # 输入参数
    user_id: str
    user_query: str
    location: str
    latitude: Optional[float]
    longitude: Optional[float]
    restaurants: List[Dict[str, Any]]
    top_k: int
    
    # 智能体处理结果
    context_analysis: Dict[str, Any]
    profile_analysis: Dict[str, Any]
    decision_result: Dict[str, Any]
    
    # 工作流元数据
    workflow_id: str
    start_time: str
    current_node: str
    node_history: List[str]
    errors: List[str]
    
    # 最终输出
    recommendations: List[Dict[str, Any]]
    reasoning: str
    confidence_score: float
    processing_time_ms: float


class NodeResult:
    """节点执行结果"""
    
    def __init__(self, success: bool, data: Dict[str, Any] = None, 
                 error: str = None, next_node: str = None):
        self.success = success
        self.data = data or {}
        self.error = error
        self.next_node = next_node


class LangGraphOrchestrator:
    """
    LangGraph 智能体编排器
    
    使用 LangGraph 构建有状态的、图状的多智能体系统，
    实现 ContextAgent → ProfilerAgent → DecisionAgent 的协作工作流。
    """
    
    def __init__(self, 
                 weather_service=None,
                 map_service=None,
                 calendar_service=None,
                 user_service=None,
                 mab_strategy: str = "contextual"):
        """
        初始化编排器
        
        Args:
            weather_service: 天气服务
            map_service: 地图服务
            calendar_service: 日历服务
            user_service: 用户服务
            mab_strategy: MAB策略 (ucb1, thompson, epsilon, contextual)
        """
        # 创建智能体
        self.context_agent = create_context_agent(
            weather_service, map_service, calendar_service
        )
        self.profiler_agent = create_profiler_agent(user_service)
        self.decision_agent = create_decision_agent(mab_strategy)
        
        # 构建工作流图
        self.graph = self._build_graph() if LANGGRAPH_AVAILABLE else None
        
        # 检查点存储（用于状态持久化）
        self.checkpointer = MemorySaver() if LANGGRAPH_AVAILABLE else None
        
        # 编译图
        self.app = self.graph.compile(checkpointer=self.checkpointer) if self.graph else None
        
        logger.info(f"LangGraph Orchestrator initialized (LangGraph available: {LANGGRAPH_AVAILABLE})")
    
    def _build_graph(self) -> Optional[StateGraph]:
        """构建 LangGraph 工作流图"""
        if not LANGGRAPH_AVAILABLE:
            logger.warning("LangGraph not available, using fallback orchestration")
            return None
        
        # 创建状态图
        workflow = StateGraph(WorkflowState)
        
        # 添加节点
        workflow.add_node("context_analysis", self._context_node)
        workflow.add_node("profile_analysis", self._profile_node)
        workflow.add_node("decision_making", self._decision_node)
        
        # 设置入口点
        workflow.set_entry_point("context_analysis")
        
        # 添加条件边
        workflow.add_conditional_edges(
            "context_analysis",
            self._route_after_context,
            {
                "profile_analysis": "profile_analysis",
                "decision_making": "decision_making",  # 紧急情况跳过画像
                "end": END
            }
        )
        
        workflow.add_conditional_edges(
            "profile_analysis",
            self._route_after_profile,
            {
                "decision_making": "decision_making",
                "end": END
            }
        )
        
        # 决策节点直接到终点
        workflow.add_edge("decision_making", END)
        
        return workflow
    
    async def _context_node(self, state: WorkflowState) -> Dict[str, Any]:
        """
        环境感知节点
        
        执行 ContextAgent，分析天气、交通、时间等环境因素。
        """
        logger.info("Executing context_analysis node")
        
        try:
            # 调用环境感知智能体
            result = await self.context_agent.process({
                "city": self._extract_city(state.get("location", "")),
                "latitude": state.get("latitude"),
                "longitude": state.get("longitude"),
                "location": state.get("location", "")
            })
            
            # 更新状态
            node_history = state.get("node_history", [])
            node_history.append("context_analysis")
            
            return {
                "context_analysis": result,
                "current_node": "context_analysis",
                "node_history": node_history
            }
            
        except Exception as e:
            logger.error(f"Context analysis failed: {e}")
            errors = state.get("errors", [])
            errors.append(f"context_analysis: {str(e)}")
            return {
                "context_analysis": {"success": False, "error": str(e)},
                "errors": errors
            }
    
    async def _profile_node(self, state: WorkflowState) -> Dict[str, Any]:
        """
        用户画像节点
        
        执行 ProfilerAgent，分析用户偏好和行为。
        """
        logger.info("Executing profile_analysis node")
        
        try:
            # 获取环境分析结果作为上下文
            context_analysis = state.get("context_analysis", {})
            
            # 调用用户画像智能体
            result = await self.profiler_agent.process({
                "user_id": state.get("user_id", "guest"),
                "query": state.get("user_query", ""),
                "context": context_analysis
            })
            
            # 更新状态
            node_history = state.get("node_history", [])
            node_history.append("profile_analysis")
            
            return {
                "profile_analysis": result,
                "current_node": "profile_analysis",
                "node_history": node_history
            }
            
        except Exception as e:
            logger.error(f"Profile analysis failed: {e}")
            errors = state.get("errors", [])
            errors.append(f"profile_analysis: {str(e)}")
            return {
                "profile_analysis": {"success": False, "error": str(e)},
                "errors": errors
            }
    
    async def _decision_node(self, state: WorkflowState) -> Dict[str, Any]:
        """
        决策节点
        
        执行 DecisionAgent，使用 MAB 算法进行最终推荐决策。
        """
        logger.info("Executing decision_making node")
        
        try:
            # 调用决策智能体
            result = await self.decision_agent.process({
                "restaurants": state.get("restaurants", []),
                "context_analysis": state.get("context_analysis", {}),
                "profile_analysis": state.get("profile_analysis", {}),
                "user_query": state.get("user_query", ""),
                "top_k": state.get("top_k", 10)
            })
            
            # 更新状态
            node_history = state.get("node_history", [])
            node_history.append("decision_making")
            
            # 计算处理时间
            start_time = state.get("start_time")
            if start_time:
                processing_time = (datetime.now() - datetime.fromisoformat(start_time)).total_seconds() * 1000
            else:
                processing_time = 0
            
            return {
                "decision_result": result,
                "recommendations": result.get("recommendations", []),
                "reasoning": result.get("reasoning", ""),
                "confidence_score": result.get("confidence_score", 0.0),
                "current_node": "decision_making",
                "node_history": node_history,
                "processing_time_ms": processing_time
            }
            
        except Exception as e:
            logger.error(f"Decision making failed: {e}")
            errors = state.get("errors", [])
            errors.append(f"decision_making: {str(e)}")
            return {
                "decision_result": {"success": False, "error": str(e)},
                "errors": errors
            }
    
    def _route_after_context(self, state: WorkflowState) -> str:
        """
        环境分析后的路由决策
        
        根据环境分析结果决定下一步:
        - 正常情况: 继续到用户画像
        - 紧急情况: 跳过画像直接决策
        - 严重错误: 直接结束
        """
        context = state.get("context_analysis", {})
        
        # 检查错误
        if not context.get("success", True):
            # 即使环境分析失败，也继续处理
            logger.warning("Context analysis failed, continuing with profile analysis")
            return "profile_analysis"
        
        # 检查紧急情况
        environment = context.get("environment_impact", {})
        temporal = context.get("temporal", {})
        
        # 紧急请求跳过画像直接决策
        if temporal.get("urgency_level") == "high" and state.get("restaurants"):
            logger.info("Urgent request, skipping profile analysis")
            return "decision_making"
        
        return "profile_analysis"
    
    def _route_after_profile(self, state: WorkflowState) -> str:
        """
        用户画像后的路由决策
        """
        profile = state.get("profile_analysis", {})
        
        # 检查是否有餐厅数据
        if not state.get("restaurants"):
            logger.warning("No restaurants to recommend")
            return "end"
        
        return "decision_making"
    
    def _extract_city(self, location: str) -> str:
        """从位置字符串提取城市"""
        # 简单的城市提取逻辑
        cities = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "西安"]
        for city in cities:
            if city in location:
                return city
        return "深圳"  # 默认城市
    
    async def orchestrate(self, 
                         user_query: str,
                         location: str,
                         restaurants: List[Dict[str, Any]],
                         user_id: str = "guest",
                         latitude: float = None,
                         longitude: float = None,
                         top_k: int = 10) -> Dict[str, Any]:
        """
        执行完整的推荐编排流程
        
        Args:
            user_query: 用户查询
            location: 用户位置
            restaurants: 候选餐厅列表
            user_id: 用户ID
            latitude: 纬度
            longitude: 经度
            top_k: 返回数量
            
        Returns:
            推荐结果
        """
        start_time = datetime.now()
        workflow_id = f"wf_{start_time.strftime('%Y%m%d%H%M%S')}_{user_id}"
        
        # 初始状态
        initial_state: WorkflowState = {
            "user_id": user_id,
            "user_query": user_query,
            "location": location,
            "latitude": latitude,
            "longitude": longitude,
            "restaurants": restaurants,
            "top_k": top_k,
            "workflow_id": workflow_id,
            "start_time": start_time.isoformat(),
            "current_node": "start",
            "node_history": [],
            "errors": []
        }
        
        try:
            if self.app and LANGGRAPH_AVAILABLE:
                # 使用 LangGraph 执行工作流
                config = {"configurable": {"thread_id": workflow_id}}
                final_state = await self.app.ainvoke(initial_state, config)
            else:
                # 回退到顺序执行
                final_state = await self._fallback_orchestrate(initial_state)
            
            # 计算总处理时间
            total_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # 构建返回结果
            return {
                "success": True,
                "workflow_id": workflow_id,
                "recommendations": final_state.get("recommendations", []),
                "reasoning": final_state.get("reasoning", ""),
                "confidence_score": final_state.get("confidence_score", 0.0),
                "context_analysis": final_state.get("context_analysis", {}),
                "profile_analysis": final_state.get("profile_analysis", {}),
                "node_history": final_state.get("node_history", []),
                "processing_time_ms": total_time,
                "orchestrator": "langgraph" if LANGGRAPH_AVAILABLE else "fallback"
            }
            
        except Exception as e:
            logger.error(f"Orchestration failed: {e}")
            return {
                "success": False,
                "workflow_id": workflow_id,
                "error": str(e),
                "recommendations": [],
                "reasoning": "推荐服务暂时不可用",
                "confidence_score": 0.0,
                "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000
            }
    
    async def _fallback_orchestrate(self, state: WorkflowState) -> WorkflowState:
        """
        回退编排方法（当 LangGraph 不可用时）
        
        按顺序执行各个智能体。
        """
        logger.info("Using fallback orchestration (sequential)")
        
        # 1. 环境分析
        context_result = await self._context_node(state)
        state.update(context_result)
        
        # 2. 用户画像
        profile_result = await self._profile_node(state)
        state.update(profile_result)
        
        # 3. 决策
        decision_result = await self._decision_node(state)
        state.update(decision_result)
        
        return state
    
    def update_reward(self, restaurant_id: str, reward: float):
        """
        更新餐厅奖励（用于在线学习）
        
        当用户完成订单或给出反馈时调用此方法，
        用于 MAB 算法的在线学习。
        """
        self.decision_agent.update_reward(restaurant_id, reward)
    
    def set_mab_strategy(self, strategy: str):
        """动态切换 MAB 策略"""
        self.decision_agent.set_strategy(strategy)
    
    def get_agent_states(self) -> Dict[str, Any]:
        """获取所有智能体状态"""
        return {
            "context_agent": self.context_agent.get_state().to_dict(),
            "profiler_agent": self.profiler_agent.get_state().to_dict(),
            "decision_agent": self.decision_agent.get_state().to_dict()
        }


# 工厂函数
def create_langgraph_orchestrator(
    weather_service=None,
    map_service=None,
    calendar_service=None,
    user_service=None,
    mab_strategy: str = "contextual"
) -> LangGraphOrchestrator:
    """
    创建 LangGraph 编排器实例
    
    Args:
        weather_service: 天气服务
        map_service: 地图服务
        calendar_service: 日历服务
        user_service: 用户服务
        mab_strategy: MAB策略
        
    Returns:
        LangGraphOrchestrator 实例
    """
    return LangGraphOrchestrator(
        weather_service=weather_service,
        map_service=map_service,
        calendar_service=calendar_service,
        user_service=user_service,
        mab_strategy=mab_strategy
    )


async def test_orchestrator():
    """测试编排器"""
    # 模拟餐厅数据
    mock_restaurants = [
        {
            "id": "r1",
            "name": "海底捞火锅",
            "cuisine_type": "火锅",
            "rating": 4.8,
            "avg_price": 120,
            "distance": 1500,
            "estimated_delivery_time": 35
        },
        {
            "id": "r2", 
            "name": "麦当劳",
            "cuisine_type": "快餐",
            "rating": 4.2,
            "avg_price": 35,
            "distance": 500,
            "estimated_delivery_time": 15
        },
        {
            "id": "r3",
            "name": "真功夫",
            "cuisine_type": "中式快餐",
            "rating": 4.0,
            "avg_price": 30,
            "distance": 800,
            "estimated_delivery_time": 20
        }
    ]
    
    # 创建编排器
    orchestrator = create_langgraph_orchestrator()
    
    # 执行推荐
    result = await orchestrator.orchestrate(
        user_query="下雨天想吃点热的",
        location="深圳市南山区",
        restaurants=mock_restaurants,
        user_id="test_user",
        top_k=3
    )
    
    print("=== LangGraph 编排器测试结果 ===")
    print(f"成功: {result['success']}")
    print(f"工作流ID: {result['workflow_id']}")
    print(f"处理时间: {result['processing_time_ms']:.1f}ms")
    print(f"节点历史: {result['node_history']}")
    print(f"推荐理由: {result['reasoning']}")
    print(f"推荐餐厅数: {len(result['recommendations'])}")
    
    for rec in result['recommendations']:
        print(f"  - {rec['rank']}. {rec['name']} (评分: {rec['score']})")


if __name__ == "__main__":
    asyncio.run(test_orchestrator())
