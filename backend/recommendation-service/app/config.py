"""
服务配置文件
"""

import os
from typing import Optional

class Config:
    """应用配置类"""
    
    # 服务基础配置
    SERVICE_NAME: str = "recommendation-service"
    SERVICE_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # 和风天气API配置
    QWEATHER_API_HOST: str = os.getenv("QWEATHER_API_HOST", "api.qweather.com")
    QWEATHER_USE_JWT: bool = os.getenv("QWEATHER_USE_JWT", "true").lower() == "true"  # 默认启用JWT
    
    # JWT认证配置
    QWEATHER_KEY_ID: Optional[str] = os.getenv("QWEATHER_KEY_ID")
    QWEATHER_PROJECT_ID: Optional[str] = os.getenv("QWEATHER_PROJECT_ID")
    QWEATHER_PRIVATE_KEY: Optional[str] = os.getenv("QWEATHER_PRIVATE_KEY")
    
    # 传统API Key（JWT认证优先）
    QWEATHER_API_KEY: Optional[str] = os.getenv("QWEATHER_API_KEY")
    
    # 地图API
    MAP_API_KEY: Optional[str] = os.getenv("MAP_API_KEY")
    
    # 用户画像服务配置
    # Docker内部: http://profile-service:8080
    # 本地开发: http://localhost:8086
    PROFILE_SERVICE_URL: str = os.getenv("PROFILE_SERVICE_URL", "http://profile-service:8080")
    
    # 外部API配置
    WEATHER_API_BASE_URL: str = os.getenv(
        "WEATHER_API_BASE_URL", 
        f"https://{os.getenv('QWEATHER_API_HOST', 'devapi.qweather.com')}/v7/weather"
    )
    MAP_API_BASE_URL: str = os.getenv(
        "MAP_API_BASE_URL", 
        "https://restapi.amap.com/v3"
    )
    
    # 推荐算法配置
    DEFAULT_RECOMMENDATION_COUNT: int = int(os.getenv("DEFAULT_RECOMMENDATION_COUNT", "10"))
    MAX_RECOMMENDATION_COUNT: int = int(os.getenv("MAX_RECOMMENDATION_COUNT", "50"))
    DEFAULT_MAX_DELIVERY_TIME: int = int(os.getenv("DEFAULT_MAX_DELIVERY_TIME", "60"))
    
    # 推荐权重配置
    WEATHER_WEIGHT: float = float(os.getenv("WEATHER_WEIGHT", "0.25"))
    SEASONAL_WEIGHT: float = float(os.getenv("SEASONAL_WEIGHT", "0.20"))
    TIME_WEIGHT: float = float(os.getenv("TIME_WEIGHT", "0.20"))
    TRAFFIC_WEIGHT: float = float(os.getenv("TRAFFIC_WEIGHT", "0.15"))
    DISTANCE_WEIGHT: float = float(os.getenv("DISTANCE_WEIGHT", "0.10"))
    RATING_WEIGHT: float = float(os.getenv("RATING_WEIGHT", "0.10"))
    
    # 数据库配置
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    
    # Redis配置
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @property
    def recommendation_weights(self) -> dict:
        """获取推荐权重配置"""
        return {
            "weather": self.WEATHER_WEIGHT,
            "seasonal": self.SEASONAL_WEIGHT,
            "time": self.TIME_WEIGHT,
            "traffic": self.TRAFFIC_WEIGHT,
            "distance": self.DISTANCE_WEIGHT,
            "rating": self.RATING_WEIGHT
        }

# 全局配置实例
config = Config()