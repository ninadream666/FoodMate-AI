#!/usr/bin/env python3
"""
API状态监控系统
提供全面的API调用状态跟踪、成功率统计和健康检查功能
"""

import asyncio
import time
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import logging

# 配置日志
logger = logging.getLogger(__name__)

class APIStatus(Enum):
    """API状态枚举"""
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
    UNKNOWN = "unknown"

@dataclass
class APICallResult:
    """API调用结果"""
    service_name: str
    endpoint: str
    status: APIStatus
    response_time: float
    timestamp: datetime
    error_message: Optional[str] = None
    http_status: Optional[int] = None

@dataclass
class APIServiceStatus:
    """API服务状态"""
    service_name: str
    total_calls: int
    successful_calls: int
    failed_calls: int
    success_rate: float
    average_response_time: float
    last_success_time: Optional[datetime]
    last_failure_time: Optional[datetime]
    last_error_message: Optional[str]
    is_healthy: bool

class APIStatusMonitor:
    """API状态监控器"""
    
    def __init__(self):
        self.call_history: List[APICallResult] = []
        self.max_history_size = 1000  # 最多保存1000条记录
        self.service_stats: Dict[str, APIServiceStatus] = {}
        
    def record_api_call(self, 
                       service_name: str, 
                       endpoint: str, 
                       status: APIStatus,
                       response_time: float,
                       error_message: Optional[str] = None,
                       http_status: Optional[int] = None):
        """记录API调用结果"""
        result = APICallResult(
            service_name=service_name,
            endpoint=endpoint,
            status=status,
            response_time=response_time,
            timestamp=datetime.now(),
            error_message=error_message,
            http_status=http_status
        )
        
        # 添加到历史记录
        self.call_history.append(result)
        
        # 限制历史记录大小
        if len(self.call_history) > self.max_history_size:
            self.call_history = self.call_history[-self.max_history_size:]
        
        # 更新服务统计
        self._update_service_stats(result)
    
    def _update_service_stats(self, result: APICallResult):
        """更新服务统计信息"""
        service_name = result.service_name
        
        if service_name not in self.service_stats:
            self.service_stats[service_name] = APIServiceStatus(
                service_name=service_name,
                total_calls=0,
                successful_calls=0,
                failed_calls=0,
                success_rate=0.0,
                average_response_time=0.0,
                last_success_time=None,
                last_failure_time=None,
                last_error_message=None,
                is_healthy=True
            )
        
        stats = self.service_stats[service_name]
        stats.total_calls += 1
        
        if result.status == APIStatus.SUCCESS:
            stats.successful_calls += 1
            stats.last_success_time = result.timestamp
        else:
            stats.failed_calls += 1
            stats.last_failure_time = result.timestamp
            stats.last_error_message = result.error_message
        
        # 计算成功率
        stats.success_rate = (stats.successful_calls / stats.total_calls) * 100
        
        # 计算平均响应时间
        recent_calls = [r for r in self.call_history 
                       if r.service_name == service_name][-20:]  # 最近20次调用
        if recent_calls:
            stats.average_response_time = sum(r.response_time for r in recent_calls) / len(recent_calls)
        
        # 判断健康状态 (成功率>70%且最近5分钟内有成功调用)
        now = datetime.now()
        recent_success = stats.last_success_time and (now - stats.last_success_time) < timedelta(minutes=5)
        stats.is_healthy = stats.success_rate > 70 and recent_success
    
    def get_service_status(self, service_name: str) -> Optional[APIServiceStatus]:
        """获取特定服务状态"""
        return self.service_stats.get(service_name)
    
    def get_all_services_status(self) -> Dict[str, APIServiceStatus]:
        """获取所有服务状态"""
        return self.service_stats.copy()
    
    def get_overall_health(self) -> Dict[str, Any]:
        """获取整体健康状态"""
        if not self.service_stats:
            return {
                "status": "unknown",
                "healthy_services": 0,
                "total_services": 0,
                "overall_success_rate": 0.0,
                "message": "暂无API调用数据"
            }
        
        healthy_count = sum(1 for stats in self.service_stats.values() if stats.is_healthy)
        total_services = len(self.service_stats)
        
        # 计算整体成功率
        total_calls = sum(stats.total_calls for stats in self.service_stats.values())
        total_success = sum(stats.successful_calls for stats in self.service_stats.values())
        overall_success_rate = (total_success / total_calls * 100) if total_calls > 0 else 0
        
        # 判断整体状态
        if healthy_count == total_services:
            status = "healthy"
            message = "所有API服务运行正常"
        elif healthy_count > total_services / 2:
            status = "warning"
            message = f"部分API服务异常 ({total_services - healthy_count}/{total_services})"
        else:
            status = "critical"
            message = f"多数API服务异常 ({total_services - healthy_count}/{total_services})"
        
        return {
            "status": status,
            "healthy_services": healthy_count,
            "total_services": total_services,
            "overall_success_rate": round(overall_success_rate, 2),
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_recent_failures(self, hours: int = 1) -> List[APICallResult]:
        """获取最近的失败调用"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return [
            result for result in self.call_history
            if result.timestamp > cutoff_time and result.status != APIStatus.SUCCESS
        ]
    
    def get_service_report(self, service_name: str) -> Dict[str, Any]:
        """生成服务详细报告"""
        if service_name not in self.service_stats:
            return {"error": f"服务 {service_name} 不存在"}
        
        stats = self.service_stats[service_name]
        service_calls = [r for r in self.call_history if r.service_name == service_name]
        
        # 最近的调用记录
        recent_calls = service_calls[-10:]
        
        # 错误类型统计
        error_types = {}
        for call in service_calls:
            if call.status != APIStatus.SUCCESS and call.error_message:
                error_types[call.error_message] = error_types.get(call.error_message, 0) + 1
        
        return {
            "service_name": service_name,
            "status": asdict(stats),
            "recent_calls": [asdict(call) for call in recent_calls],
            "error_types": error_types,
            "performance_trend": self._get_performance_trend(service_calls),
            "recommendations": self._get_service_recommendations(stats)
        }
    
    def _get_performance_trend(self, calls: List[APICallResult]) -> str:
        """分析性能趋势"""
        if len(calls) < 5:
            return "数据不足"
        
        recent_times = [c.response_time for c in calls[-5:]]
        earlier_times = [c.response_time for c in calls[-10:-5]] if len(calls) >= 10 else []
        
        if not earlier_times:
            return "稳定"
        
        recent_avg = sum(recent_times) / len(recent_times)
        earlier_avg = sum(earlier_times) / len(earlier_times)
        
        if recent_avg > earlier_avg * 1.2:
            return "性能下降"
        elif recent_avg < earlier_avg * 0.8:
            return "性能提升"
        else:
            return "稳定"
    
    def _get_service_recommendations(self, stats: APIServiceStatus) -> List[str]:
        """生成服务建议"""
        recommendations = []
        
        if stats.success_rate < 50:
            recommendations.append("成功率过低，建议检查API配置和网络连接")
        elif stats.success_rate < 80:
            recommendations.append("成功率偏低，建议优化错误处理和重试机制")
        
        if stats.average_response_time > 5.0:
            recommendations.append("响应时间过长，建议检查网络延迟或API性能")
        
        if stats.last_failure_time and stats.last_failure_time > (datetime.now() - timedelta(minutes=5)):
            recommendations.append("最近有失败调用，建议检查错误信息")
        
        if not recommendations:
            recommendations.append("服务运行正常，无需特殊处理")
        
        return recommendations
    
    def export_report(self, format: str = "json") -> str:
        """导出监控报告"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "overall_health": self.get_overall_health(),
            "services": {},
            "recent_failures": [asdict(r) for r in self.get_recent_failures()]
        }
        
        for service_name in self.service_stats:
            report["services"][service_name] = self.get_service_report(service_name)
        
        if format == "json":
            return json.dumps(report, ensure_ascii=False, indent=2, default=str)
        else:
            return str(report)

# 全局监控器实例
api_monitor = APIStatusMonitor()