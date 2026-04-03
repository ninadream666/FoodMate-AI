import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NutriVision Service"
    DEBUG: bool = True
    
    # API 密钥与模型配置
    # 优先从环境变量读取
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4.1-mini")
    # 中转商提供的 OpenAI 兼容接口地址
    AI_BASE_URL: str = os.getenv("AI_BASE_URL", "https://yinli.one/v1/chat/completions")
    
    class Config:
        env_file = ".env"

settings = Settings()