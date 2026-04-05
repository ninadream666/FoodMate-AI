import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Pricing Service"
    DEBUG: bool = True
    
    # 数据库配置
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://dev:dev123@postgres-db:5432/ai_pricing_db"
    )
    
    # RabbitMQ配置
    RABBITMQ_URL: str = os.getenv(
        "RABBITMQ_URL", 
        "amqp://dev:dev123@rabbitmq:5672/"
    )
    
    # AI API配置
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "deepseek-chat")
    
    # 业务规则：自动审批的阈值，低于这个值的价格变动将自动审批，高于这个值的需要人工审批
    AUTO_APPROVE_THRESHOLD: float = -1.0 
    
    class Config:
        env_file = ".env"

settings = Settings()