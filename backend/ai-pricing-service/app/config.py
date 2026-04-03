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
    
    # RabbitMQ 配置
    RABBITMQ_URL: str = os.getenv(
        "RABBITMQ_URL", 
        "amqp://dev:dev123@rabbitmq:5672/"
    )
    
    # AI API 配置
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    # 默认为你指定的 preview 模型
    AI_MODEL: str = os.getenv("AI_MODEL", "deepseek-chat")
    
    # 业务规则
    # AUTO_APPROVE_THRESHOLD: float = 0.05
    # 修改为 0，意味着所有变动都需要人工审批 (除了价格未变的情况)
    AUTO_APPROVE_THRESHOLD: float = -1.0 
    
    class Config:
        env_file = ".env"

settings = Settings()