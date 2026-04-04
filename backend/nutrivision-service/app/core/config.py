import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NutriVision Service"
    DEBUG: bool = True
    
    # API密钥与模型配置
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4.1-mini")
    AI_BASE_URL: str = os.getenv("AI_BASE_URL", "https://yinli.one/v1/chat/completions")
    
    class Config:
        env_file = ".env"

settings = Settings()