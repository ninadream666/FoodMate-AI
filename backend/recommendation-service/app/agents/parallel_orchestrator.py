"""
并行智能体编排器 (Parallel LangGraph Orchestrator)

架构:
┌─────────────────────────────────────────────────────────────────────┐
│  📡 主页 API 请求: (User: 1001, Loc: 22.5, 113.9)                   │
│      │                                                               │
│      ▼                                                               │
│  🔗 MCP Client (调用工具)                                           │
│      └── ⚡️ JSON-RPC: call_tool("smart_recommend")                  │
│           │                                                          │
│           ▼                                                          │
│  📦 MCP Server (AI 导购中台)                                        │
│      │                                                               │
│      └── 🧠 LangGraph 编排 (并行加速模式):                          │
│           │                                                          │
│           ├── 🔄 并行分支 A: ContextAgent                           │
│           │      └─ 🌦️ 调天气/日历 API (150ms)                      │
│           │                                                          │
│           ├── 🔄 并行分支 B: RetrievalAgent                         │
│           │      └─ 🗺️ 调高德 POI API (200ms)                       │
│           │                                                          │
│           ├── 🔄 并行分支 C: ProfilerAgent                          │
│           │      └─ 🗄️ 查画像 DB (5ms)                              │
│           │                                                          │
│           │  ====== ⬇️ 数据汇聚 (State Merge) ⬇️ ======              │
│           │                                                          │
│           └── ✨ ReasoningAgent (核心大脑):                         │
│                  ├─ 🧐 深度思考                                      │
│                  ├─ ⚖️ 决策排序                                      │
│                  └─ ✍️ 暖心文案                                      │
│           │                                                          │
│           ▼                                                          │
│  ✅ 响应完成: 返回 JSON (含推荐列表 + AI 推荐语)                    │
└─────────────────────────────────────────────────────────────────────┘
"""

from typing import Dict, Any, List, Optional, TypedDict
from dataclasses import dataclass
from datetime import datetime
import asyncio
import logging
import os

# 尝试导入 langgraph
try:
    from langgraph.graph import StateGraph, END
    from langgraph.checkpoint.memory import MemorySaver
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    StateGraph = None
    END = "end"

from .context_agent import create_context_agent
from .profiler_agent import create_profiler_agent
from .reasoning_agent import create_reasoning_agent
from .collaborative_agent import create_collaborative_agent

logger = logging.getLogger(__name__)


class ParallelWorkflowState(TypedDict, total=False):
    """并行工作流状态"""
    # 输入参数
    user_id: str
    user_query: str
    location: str
    latitude: float
    longitude: float
    top_k: int
    
    # 并行分支结果
    context_result: Dict[str, Any]      # ContextAgent 结果
    retrieval_result: Dict[str, Any]    # RetrievalAgent 结果 (POI)
    profile_result: Dict[str, Any]      # ProfilerAgent 结果
    collaborative_result: Dict[str, Any]  # CollaborativeAgent 结果
    
    # 候选餐厅
    restaurants: List[Dict[str, Any]]
    
    # 最终输出
    recommendations: List[Dict[str, Any]]
    warm_message: str
    thinking_summary: str
    
    # 性能追踪
    timing: Dict[str, float]
    errors: List[str]


class ParallelOrchestrator:
    """
    并行智能体编排器
    
    特点:
    1. 并行执行 ContextAgent + RetrievalAgent + ProfilerAgent + CollaborativeAgent
    2. 数据汇聚后由 ReasoningAgent 统一处理
    3. 生成推荐列表和暖心文案
    """
    
    def __init__(
        self,
        weather_service=None,
        map_service=None,
        calendar_service=None,
        user_service=None,
        poi_service=None
    ):
        """初始化并行编排器"""
        # 创建智能体
        self.context_agent = create_context_agent(
            weather_service, map_service, calendar_service
        )
        self.profiler_agent = create_profiler_agent(user_service)
        self.collaborative_agent = create_collaborative_agent()
        self.reasoning_agent = create_reasoning_agent()
        
        # POI 服务 (用于 RetrievalAgent)
        self.poi_service = poi_service
        
        # 构建图
        self.graph = self._build_parallel_graph() if LANGGRAPH_AVAILABLE else None
        self.checkpointer = MemorySaver() if LANGGRAPH_AVAILABLE else None
        self.app = self.graph.compile(checkpointer=self.checkpointer) if self.graph else None
        
        logger.info(f"ParallelOrchestrator initialized (LangGraph: {LANGGRAPH_AVAILABLE})")
    
    def _build_parallel_graph(self) -> Optional[StateGraph]:
        """构建并行工作流图"""
        if not LANGGRAPH_AVAILABLE:
            return None
        
        workflow = StateGraph(ParallelWorkflowState)
        
        # 添加并行节点
        workflow.add_node("parallel_fetch", self._parallel_fetch_node)
        workflow.add_node("reasoning", self._reasoning_node)
        
        # 设置流程: START → parallel_fetch → reasoning → END
        workflow.set_entry_point("parallel_fetch")
        workflow.add_edge("parallel_fetch", "reasoning")
        workflow.add_edge("reasoning", END)
        
        return workflow
    
    async def _parallel_fetch_node(self, state: ParallelWorkflowState) -> Dict[str, Any]:
        """
        并行获取节点
        
        同时执行:
        - ContextAgent: 获取天气/交通/日历
        - RetrievalAgent: 获取附近餐厅 (POI)
        - ProfilerAgent: 获取用户画像
        """
        logger.info("🔄 执行并行获取节点")
        timing = {}
        start_time = datetime.now()
        
        # 准备任务
        tasks = []
        task_names = []
        
        # 任务A: ContextAgent - 环境信息
        async def fetch_context():
            t0 = datetime.now()
            result = await self.context_agent.process({
                "latitude": state.get("latitude"),
                "longitude": state.get("longitude"),
                "location": state.get("location", "")
            })
            timing["context_ms"] = (datetime.now() - t0).total_seconds() * 1000
            logger.info(f"  🌦️ ContextAgent 完成 ({timing['context_ms']:.0f}ms)")
            return result
        
        tasks.append(fetch_context())
        task_names.append("context")
        
        # 任务B: RetrievalAgent - 获取餐厅
        async def fetch_restaurants():
            t0 = datetime.now()
            restaurants = []
            
            if self.poi_service:
                lat = state.get("latitude")
                lng = state.get("longitude")
                if lat and lng:
                    location_str = f"{lng},{lat}"  # 高德格式
                    poi_results = await self.poi_service.search_restaurants_around(
                        location=location_str,
                        radius=3000,
                        page_size=30
                    )
                    # 转换 POI 结果
                    for poi in poi_results:
                        restaurants.append({
                            "id": poi.id,
                            "name": poi.name,
                            "cuisine": poi.cuisine_type,
                            "rating": poi.rating,
                            "distance": int(poi.distance * 1000),
                            "delivery_time": poi.estimated_delivery_time,
                            "price": poi.avg_price,
                            "address": poi.address,
                            "image_url": poi.photos[0].get("url") if poi.photos else None
                        })
            
            timing["retrieval_ms"] = (datetime.now() - t0).total_seconds() * 1000
            logger.info(f"  🗺️ RetrievalAgent 完成 ({timing['retrieval_ms']:.0f}ms) - {len(restaurants)} 家餐厅")
            return {"restaurants": restaurants}
        
        tasks.append(fetch_restaurants())
        task_names.append("retrieval")
        
        # 任务C: ProfilerAgent - 用户画像
        async def fetch_profile():
            t0 = datetime.now()
            result = await self.profiler_agent.process({
                "user_id": state.get("user_id", "anonymous"),
                "query": state.get("user_query", ""),
                "context": {}
            })
            timing["profile_ms"] = (datetime.now() - t0).total_seconds() * 1000
            logger.info(f"  🗄️ ProfilerAgent 完成 ({timing['profile_ms']:.0f}ms)")
            return result
        
        tasks.append(fetch_profile())
        task_names.append("profile")
        
        # 任务D: CollaborativeAgent - 协同过滤
        async def fetch_collaborative():
            t0 = datetime.now()
            result = await self.collaborative_agent.process({
                "restaurants": state.get("restaurants", []),
                "profile_analysis": {},  # 并行模式下画像可能尚未完成，CF 独立运行
                "user_id": state.get("user_id", "anonymous"),
            })
            timing["collaborative_ms"] = (datetime.now() - t0).total_seconds() * 1000
            logger.info(f"  🤝 CollaborativeAgent 完成 ({timing['collaborative_ms']:.0f}ms)")
            return result
        
        tasks.append(fetch_collaborative())
        task_names.append("collaborative")
        
        # 并行执行所有任务
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理结果
        context_result = {}
        retrieval_result = {}
        profile_result = {}
        collaborative_result = {}
        restaurants = []
        errors = []
        
        for name, result in zip(task_names, results):
            if isinstance(result, Exception):
                errors.append(f"{name}: {str(result)}")
                logger.error(f"  ❌ {name} 失败: {result}")
            elif name == "context":
                context_result = result
            elif name == "retrieval":
                retrieval_result = result
                restaurants = result.get("restaurants", [])
            elif name == "profile":
                profile_result = result
            elif name == "collaborative":
                collaborative_result = result
        
        total_ms = (datetime.now() - start_time).total_seconds() * 1000
        timing["parallel_total_ms"] = total_ms
        logger.info(f"✅ 并行获取完成 (总耗时: {total_ms:.0f}ms)")
        
        return {
            "context_result": context_result,
            "retrieval_result": retrieval_result,
            "profile_result": profile_result,
            "collaborative_result": collaborative_result,
            "restaurants": restaurants,
            "timing": timing,
            "errors": errors
        }
    
    async def _reasoning_node(self, state: ParallelWorkflowState) -> Dict[str, Any]:
        """
        推理节点 (核心大脑)
        
        汇聚所有并行结果，进行深度思考和决策
        """
        logger.info("✨ 执行推理节点 (ReasoningAgent)")
        t0 = datetime.now()
        
        # 调用 ReasoningAgent (注入协同过滤分数)
        result = await self.reasoning_agent.process({
            "context_analysis": state.get("context_result", {}),
            "profile_analysis": state.get("profile_result", {}),
            "collaborative_analysis": state.get("collaborative_result", {}),
            "restaurants": state.get("restaurants", []),
            "user_query": state.get("user_query", ""),
            "top_k": state.get("top_k", 5)
        })
        
        reasoning_ms = (datetime.now() - t0).total_seconds() * 1000
        logger.info(f"  🧠 ReasoningAgent 完成 ({reasoning_ms:.0f}ms)")
        
        # 更新 timing
        timing = state.get("timing", {})
        timing["reasoning_ms"] = reasoning_ms
        
        return {
            "recommendations": result.get("recommendations", []),
            "warm_message": result.get("warm_message", ""),
            "thinking_summary": result.get("thinking", {}).get("summary", ""),
            "timing": timing
        }
    
    async def orchestrate(
        self,
        user_id: str = "anonymous",
        user_query: str = "推荐附近餐厅",
        location: str = "",
        latitude: float = None,
        longitude: float = None,
        restaurants: List[Dict[str, Any]] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        执行并行编排
        
        Returns:
            包含推荐结果、暖心文案、性能数据的字典
        """
        start_time = datetime.now()
        
        # 初始状态
        initial_state: ParallelWorkflowState = {
            "user_id": user_id,
            "user_query": user_query,
            "location": location,
            "latitude": latitude,
            "longitude": longitude,
            "top_k": top_k,
            "restaurants": restaurants or [],
            "timing": {},
            "errors": []
        }
        
        try:
            if self.app:
                # 使用 LangGraph 执行
                config = {"configurable": {"thread_id": f"parallel_{datetime.now().timestamp()}"}}
                final_state = await self.app.ainvoke(initial_state, config)
            else:
                # 降级模式: 手动并行执行
                final_state = await self._fallback_orchestrate(initial_state)
            
            total_ms = (datetime.now() - start_time).total_seconds() * 1000
            timing = final_state.get("timing", {})
            timing["total_ms"] = total_ms
            
            logger.info(f"🎉 并行编排完成 (总耗时: {total_ms:.0f}ms)")
            
            return {
                "success": True,
                "recommendations": final_state.get("recommendations", []),
                "warm_message": final_state.get("warm_message", ""),
                "thinking_summary": final_state.get("thinking_summary", ""),
                "context": final_state.get("context_result", {}),
                "candidate_count": len(final_state.get("restaurants", [])),
                "timing": timing,
                "errors": final_state.get("errors", [])
            }
            
        except Exception as e:
            logger.error(f"❌ 并行编排失败: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "recommendations": [],
                "timing": {"total_ms": (datetime.now() - start_time).total_seconds() * 1000}
            }
    
    async def _fallback_orchestrate(self, state: ParallelWorkflowState) -> ParallelWorkflowState:
        """降级模式: 手动并行执行"""
        # 执行并行获取
        parallel_result = await self._parallel_fetch_node(state)
        state.update(parallel_result)
        
        # 执行推理
        reasoning_result = await self._reasoning_node(state)
        state.update(reasoning_result)
        
        return state


def create_parallel_orchestrator(
    weather_service=None,
    map_service=None,
    calendar_service=None,
    user_service=None,
    poi_service=None
) -> ParallelOrchestrator:
    """创建并行编排器实例"""
    return ParallelOrchestrator(
        weather_service=weather_service,
        map_service=map_service,
        calendar_service=calendar_service,
        user_service=user_service,
        poi_service=poi_service
    )
