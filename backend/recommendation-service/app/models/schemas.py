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


class HealthContext(BaseModel):
    """健康上下文模型 - 用于接收用户生理状态数据"""
    daily_steps: int = Field(0, description="今日步数")
    recent_steps_30min: int = Field(0, description="最近30分钟步数")
    heart_rate: int = Field(75, description="心率 (bpm)")
    activity_status: str = Field("still", description="活动状态: still/walking/running/cycling")
    is_post_workout: bool = Field(False, description="是否刚运动完")
    
    class Config:
        extra = "allow"


class WeatherContext(BaseModel):
    """天气上下文模型 - 用于接收实时天气数据"""
    condition: str = Field("晴", description="天气状况：晴、多云、小雨、大雨等")
    temperature: float = Field(25, description="温度（摄氏度）")
    humidity: float = Field(50, description="湿度（%）")
    wind_speed: float = Field(10.0, description="风速（km/h）")
    is_raining: bool = Field(False, description="是否下雨")
    is_heavy_rain: bool = Field(False, description="是否大雨")
    delivery_impact: str = Field("none", description="配送影响: none/minor/moderate/severe")
    
    class Config:
        extra = "allow"


class RecommendationRequest(BaseModel):
    """智能推荐请求模型"""
    location: LocationRequest
    user_preferences: Optional[UserPreferences] = Field(None, alias="preferences")
    budget_range: Optional[tuple] = Field(None, description="预算范围")
    max_delivery_time: int = Field(60, description="最大配送时间（分钟）")
    max_results: int = Field(10, description="最大返回结果数")
    search_radius: int = Field(20000, description="搜索半径（米）")
    user_id: Optional[str] = Field(None, description="用户ID")
    query: Optional[str] = Field(None, description="用户查询")
    health_context: Optional[HealthContext] = Field(None, description="健康上下文")
    weather_context: Optional[WeatherContext] = Field(None, description="天气上下文")
    allergies: Optional[List[str]] = Field(None, description="用户忌口/过敏原列表，如：花生过敏、海鲜过敏、不吃辣")

    class Config:
        populate_by_name = True


# ========== 端云协同专有模型 ==========

class EdgeSynergyConstraints(BaseModel):
    """端云协同 - 边缘端计算出的脱敏硬性约束"""
    forbidden_ingredients: Optional[List[str]] = Field(default_factory=list, description="绝对禁用的成分（如过敏原、生理期不适宜成分等）")
    required_temperature: Optional[List[str]] = Field(default_factory=list, description="温度要求（如：常温、热饮）")
    max_price: Optional[float] = Field(None, description="最高价格限制")
    preferred_tags: Optional[List[str]] = Field(default_factory=list, description="偏好的食物标签（如：清淡、甜品）")

    class Config:
        extra = "allow"


class EdgeSynergyRequest(BaseModel):
    """端云协同推荐请求模型"""
    location: LocationRequest
    query: str = Field(..., description="用户通过语音输入的点餐意图")
    constraints: EdgeSynergyConstraints = Field(..., description="边缘端计算出的脱敏约束条件")
    max_results: int = Field(10, description="最大返回结果数")
    search_radius: int = Field(20000, description="搜索半径（米）")
    weather_context: Optional[WeatherContext] = Field(None, description="天气上下文")

    class Config:
        populate_by_name = True


# ========== 上下文模型，兼容多智能体输出 ==========

class ContextInfo(BaseModel):
    """上下文信息模型，兼容多种输入格式"""
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
    """餐厅信息模型"""
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