"""
基础智能体类 - 定义所有智能体的公共接口和行为
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class AgentMessage:
    """智能体间通信消息"""
    sender: str  # 发送者智能体名称
    receiver: str  # 接收者智能体名称
    content: Dict[str, Any]  # 消息内容
    message_type: str = "data"  # 消息类型: data, query, response, error
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "sender": self.sender,
            "receiver": self.receiver,
            "content": self.content,
            "message_type": self.message_type,
            "timestamp": self.timestamp.isoformat()
        }


@dataclass
class AgentState:
    """智能体状态"""
    agent_name: str
    status: str = "idle"  # idle, processing, completed, error
    last_action: Optional[str] = None
    last_result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    processing_time_ms: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_name": self.agent_name,
            "status": self.status,
            "last_action": self.last_action,
            "last_result": self.last_result,
            "error_message": self.error_message,
            "processing_time_ms": self.processing_time_ms
        }


class BaseAgent(ABC):
    """
    基础智能体抽象类
    
    所有智能体必须实现:
    - name: 智能体名称
    - description: 智能体描述
    - process(): 核心处理逻辑
    - get_capabilities(): 返回智能体能力列表
    """
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.state = AgentState(agent_name=name)
        self._message_history: List[AgentMessage] = []
        
    @abstractmethod
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        核心处理逻辑 - 子类必须实现
        
        Args:
            input_data: 输入数据
            
        Returns:
            处理结果
        """
        pass
    
    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """
        返回智能体能力列表
        
        Returns:
            能力字符串列表
        """
        pass
    
    async def send_message(self, receiver: str, content: Dict[str, Any], 
                          message_type: str = "data") -> AgentMessage:
        """发送消息给其他智能体"""
        message = AgentMessage(
            sender=self.name,
            receiver=receiver,
            content=content,
            message_type=message_type
        )
        self._message_history.append(message)
        logger.debug(f"Agent {self.name} sent message to {receiver}")
        return message
    
    def receive_message(self, message: AgentMessage):
        """接收其他智能体的消息"""
        self._message_history.append(message)
        logger.debug(f"Agent {self.name} received message from {message.sender}")
    
    def update_state(self, status: str, action: str = None, 
                    result: Dict[str, Any] = None, error: str = None):
        """更新智能体状态"""
        self.state.status = status
        if action:
            self.state.last_action = action
        if result:
            self.state.last_result = result
        if error:
            self.state.error_message = error
            
    def get_state(self) -> AgentState:
        """获取智能体状态"""
        return self.state
    
    def get_message_history(self) -> List[AgentMessage]:
        """获取消息历史"""
        return self._message_history.copy()
    
    def clear_history(self):
        """清除消息历史"""
        self._message_history.clear()


class Tool:
    """
    智能体工具定义
    
    用于定义智能体可调用的工具/能力，
    符合 MCP 协议的工具规范
    """
    
    def __init__(self, name: str, description: str, 
                 input_schema: Dict[str, Any], 
                 handler: callable):
        self.name = name
        self.description = description
        self.input_schema = input_schema
        self.handler = handler
        
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """执行工具"""
        try:
            result = await self.handler(**kwargs)
            return {"success": True, "result": result}
        except Exception as e:
            logger.error(f"Tool {self.name} execution failed: {e}")
            return {"success": False, "error": str(e)}
    
    def to_mcp_format(self) -> Dict[str, Any]:
        """转换为 MCP 协议格式"""
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": self.input_schema
        }


class ToolRegistry:
    """工具注册表 - 管理智能体可用的所有工具"""
    
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
        
    def register(self, tool: Tool):
        """注册工具"""
        self._tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
        
    def get(self, name: str) -> Optional[Tool]:
        """获取工具"""
        return self._tools.get(name)
    
    def list_tools(self) -> List[Dict[str, Any]]:
        """列出所有工具（MCP格式）"""
        return [tool.to_mcp_format() for tool in self._tools.values()]
    
    def get_all(self) -> List[Tool]:
        """获取所有工具"""
        return list(self._tools.values())


# 全局工具注册表
global_tool_registry = ToolRegistry()
