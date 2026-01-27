#!/usr/bin/env python3
"""
API健康检查端点
提供统一的API状态监控和健康检查接口
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import asyncio
from datetime import datetime

from ..services.api_monitor import api_monitor
from ..services.external_api import ExternalAPIService

router = APIRouter()

@router.get("/health/overall")
async def get_overall_health():
    """获取整体健康状态"""
    try:
        health_status = api_monitor.get_overall_health()
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "data": health_status
        }
    except Exception as e:
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "error",
            "error": str(e)
        }

@router.get("/health/services")
async def get_all_services_health():
    """获取所有服务健康状态"""
    try:
        services_status = api_monitor.get_all_services_status()
        
        # 转换为可序列化的格式
        serialized_status = {}
        for service_name, status in services_status.items():
            serialized_status[service_name] = {
                "service_name": status.service_name,
                "total_calls": status.total_calls,
                "successful_calls": status.successful_calls,
                "failed_calls": status.failed_calls,
                "success_rate": round(status.success_rate, 2),
                "average_response_time": round(status.average_response_time, 3),
                "last_success_time": status.last_success_time.isoformat() if status.last_success_time else None,
                "last_failure_time": status.last_failure_time.isoformat() if status.last_failure_time else None,
                "last_error_message": status.last_error_message,
                "is_healthy": status.is_healthy
            }
        
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "data": serialized_status
        }
    except Exception as e:
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "error", 
            "error": str(e)
        }

@router.get("/health/service/{service_name}")
async def get_service_health(service_name: str):
    """获取特定服务健康状态"""
    try:
        service_report = api_monitor.get_service_report(service_name)
        
        if "error" in service_report:
            raise HTTPException(status_code=404, detail=service_report["error"])
        
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "data": service_report
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "error",
            "error": str(e)
        }

@router.get("/health/failures")
async def get_recent_failures(hours: int = 1):
    """获取最近的失败记录"""
    try:
        if hours < 1 or hours > 24:
            raise HTTPException(status_code=400, detail="hours参数必须在1-24之间")
        
        failures = api_monitor.get_recent_failures(hours)
        
        # 转换为可序列化格式
        serialized_failures = []
        for failure in failures:
            serialized_failures.append({
                "service_name": failure.service_name,
                "endpoint": failure.endpoint,
                "status": failure.status.value,
                "response_time": round(failure.response_time, 3),
                "timestamp": failure.timestamp.isoformat(),
                "error_message": failure.error_message,
                "http_status": failure.http_status
            })
        
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "data": {
                "timeframe_hours": hours,
                "total_failures": len(serialized_failures),
                "failures": serialized_failures
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "error",
            "error": str(e)
        }

@router.post("/health/test/{service_name}")
async def test_service_api(service_name: str):
    """测试特定API服务"""
    try:
        api_service = ExternalAPIService()
        test_results = {}
        
        if service_name == "qweather" or service_name == "all":
            # 测试天气API
            try:
                weather_result = await api_service.weather_service.get_weather(39.9042, 116.4074)  # 北京坐标
                test_results["qweather"] = {
                    "status": "success" if weather_result else "failed",
                    "result": "天气数据获取成功" if weather_result else "天气数据获取失败",
                    "data": {
                        "temperature": weather_result.temperature if weather_result else None,
                        "condition": weather_result.condition if weather_result else None
                    } if weather_result else None
                }
            except Exception as e:
                test_results["qweather"] = {
                    "status": "error",
                    "result": f"测试异常: {str(e)}"
                }
        
        if service_name == "amap" or service_name == "all":
            # 测试地图API
            try:
                location_result = await api_service.map_service.get_location_info("北京市朝阳区国贸")
                test_results["amap"] = {
                    "status": "success" if location_result else "failed",
                    "result": "位置信息获取成功" if location_result else "位置信息获取失败",
                    "data": {
                        "address": location_result.address if location_result else None,
                        "district": location_result.district if location_result else None
                    } if location_result else None
                }
            except Exception as e:
                test_results["amap"] = {
                    "status": "error",
                    "result": f"测试异常: {str(e)}"
                }
        
        if service_name == "juhe" or service_name == "all":
            # 测试日历API
            try:
                calendar_result = await api_service.calendar_service.get_calendar_info()
                test_results["juhe"] = {
                    "status": "success" if calendar_result else "failed",
                    "result": "日历信息获取成功" if calendar_result else "日历信息获取失败",
                    "data": {
                        "date": calendar_result.date if calendar_result else None,
                        "weekday": calendar_result.weekday if calendar_result else None,
                        "is_holiday": calendar_result.is_holiday if calendar_result else None
                    } if calendar_result else None
                }
            except Exception as e:
                test_results["juhe"] = {
                    "status": "error",
                    "result": f"测试异常: {str(e)}"
                }
        
        if not test_results:
            raise HTTPException(status_code=400, detail=f"不支持的服务名称: {service_name}。支持: qweather, amap, juhe, all")
        
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "data": {
                "service_tested": service_name,
                "results": test_results
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "error",
            "error": str(e)
        }

@router.get("/health/report")
async def export_health_report():
    """导出完整的健康监控报告"""
    try:
        report = api_monitor.export_report("json")
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "data": report
        }
    except Exception as e:
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "error",
            "error": str(e)
        }

@router.get("/health/stats")
async def get_quick_stats():
    """获取快速统计信息"""
    try:
        overall_health = api_monitor.get_overall_health()
        services_status = api_monitor.get_all_services_status()
        recent_failures = api_monitor.get_recent_failures(1)
        
        quick_stats = {
            "overall_status": overall_health.get("status", "unknown"),
            "healthy_services_count": overall_health.get("healthy_services", 0),
            "total_services_count": overall_health.get("total_services", 0),
            "overall_success_rate": overall_health.get("overall_success_rate", 0),
            "recent_failures_count": len(recent_failures),
            "services_summary": {}
        }
        
        # 添加每个服务的快速状态
        for service_name, status in services_status.items():
            quick_stats["services_summary"][service_name] = {
                "is_healthy": status.is_healthy,
                "success_rate": round(status.success_rate, 1),
                "total_calls": status.total_calls,
                "avg_response_time": round(status.average_response_time, 2)
            }
        
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "data": quick_stats
        }
        
    except Exception as e:
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "error",
            "error": str(e)
        }