import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NutriVision Service"
    DEBUG: bool = True
    
    # API 密钥与模型配置
    # 优先从环境变量读取
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    # 中转商提供的 OpenAI 兼容接口地址
    GEMINI_BASE_URL: str = os.getenv("GEMINI_BASE_URL", "https://yinli.one/v1/chat/completions")
    
    class Config:
        env_file = ".env"

settings = Settings()