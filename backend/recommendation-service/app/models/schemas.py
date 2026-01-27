"""
数据模型定义
用于API请求和响应的数据结构
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class LocationRequest(BaseModel):
    """位置请求模型"""
    address: str = Field(..., description="用户地址")
    latitude: Optional[float] = Field(None, description="纬度")
    longitude: Optional[float] = Field(None, description="经度")


class UserPreferences(BaseModel):
    """用户偏好模型"""
    cuisine_types: Optional[List[str]] = Field(None, description="偏好菜系")
    spice_level: Optional[str] = Field(None, description="辣度偏好：无、微辣、中辣、重辣")
    dietary_restrictions: Optional[List[str]] = Field(None, description="饮食限制")
    price_sensitivity: Optional[str] = Field("medium", description="价格敏感度：low、medium、high")
    max_price: Optional[float] = Field(None, description="最高价格")


class RecommendationRequest(BaseModel):
    """智能推荐请求模型"""
    location: LocationRequest
    user_preferences: Optional[UserPreferences] = Field(None, alias="preferences")
    budget_range: Optional[tuple] = Field(None, description="预算范围")
    max_delivery_time: int = Field(60, description="最大配送时间（分钟）")
    max_results: int = Field(10, description="最大返回结果数")
    search_radius: int = Field(5000, description="搜索半径（米）")
    user_id: Optional[str] = Field(None, description="用户ID")
    query: Optional[str] = Field(None, description="用户查询")

    class Config:
        populate_by_name = True


# ========== 简化版上下文模型（兼容多智能体输出） ==========

class ContextInfo(BaseModel):
    """上下文信息模型（简化版，兼容多种输入格式）"""
    # 天气
    weather: Optional[str] = Field(None, description="天气状况")
    temperature: Optional[float] = Field(None, description="温度")
    is_bad_weather: Optional[bool] = Field(False, description="是否恶劣天气")
    
    # 时间
    time_period: Optional[str] = Field(None, description="用餐时段")
    is_weekend: Optional[bool] = Field(False, description="是否周末")
    is_holiday: Optional[bool] = Field(False, description="是否节假日")
    is_peak_hour: Optional[bool] = Field(False, description="是否高峰时段")
    current_hour: Optional[int] = Field(None, description="当前小时")
    
    # 交通
    traffic_level: Optional[str] = Field(None, description="交通状况")
    congestion_index: Optional[float] = Field(1.0, description="拥堵指数")
    
    # 位置
    location: Optional[str] = Field(None, description="位置")
    
    class Config:
        extra = "allow"  # 允许额外字段


class RestaurantInfo(BaseModel):
    """餐厅信息模型（简化版，必填字段减少）"""
    id: str
    name: str
    cuisine_type: str = ""
    avg_price: float = 40.0
    rating: float = 4.0
    distance: float = 2000.0
    estimated_delivery_time: Optional[int] = Field(30, alias="delivery_time")
    
    # 可选字段
    is_hot_food: bool = True
    is_cold_food: bool = False
    spice_level: str = "无"
    tags: List[str] = Field(default_factory=list)
    address: str = ""
    tel: str = ""
    
    # 推荐得分
    match_score: float = 0.0
    weather_score: float = 0.0
    seasonal_score: float = 0.0
    time_score: float = 0.0
    traffic_score: float = 0.0
    final_score: float = 0.0
    
    # 推荐理由
    match_reasons: List[str] = Field(default_factory=list)
    recommendation_reason: str = ""
    
    class Config:
        populate_by_name = True
        extra = "allow"


class RecommendationResponse(BaseModel):
    """智能推荐响应模型"""
    status: str = "success"
    message: str = "推荐成功"
    context: Optional[ContextInfo] = None
    restaurants: List[RestaurantInfo] = Field(default_factory=list)
    total_count: int = 0
    request_time: datetime = Field(default_factory=datetime.now)
    
    # 额外信息
    reasoning: Optional[str] = Field(None, description="推荐理由")
    processing_time_ms: Optional[float] = Field(None, description="处理时间(ms)")
    
    class Config:
        extra = "allow"


class HealthCheckResponse(BaseModel):
    """健康检查响应模型"""
    status: str = "UP"
    service: str = "recommendation-service"
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    """错误响应模型"""
    status: str = "error"
    message: str
    error_code: str
    timestamp: datetime = Field(default_factory=datetime.now)
