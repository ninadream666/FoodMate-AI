"""
认证 API - 简化版本

提供基本的注册和登录功能，用于前端开发测试。
使用内存存储，重启后数据会丢失。
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["认证"])

# 内存存储（仅用于开发测试）
users_db = {}
tokens_db = {}


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user_id: Optional[str] = None
    username: Optional[str] = None


def hash_password(password: str) -> str:
    """简单的密码哈希"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token() -> str:
    """生成简单的 token"""
    return secrets.token_urlsafe(32)


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    用户注册
    
    创建新用户账户
    """
    logger.info(f"注册请求: {request.username}")
    
    # 检查用户是否已存在
    if request.username in users_db:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    # 创建用户
    user_id = f"user_{len(users_db) + 1001}"
    users_db[request.username] = {
        "user_id": user_id,
        "username": request.username,
        "password_hash": hash_password(request.password),
        "email": request.email,
        "phone": request.phone,
        "created_at": datetime.now().isoformat()
    }
    
    # 生成 token
    token = generate_token()
    tokens_db[token] = {
        "user_id": user_id,
        "username": request.username,
        "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
    }
    
    logger.info(f"用户注册成功: {request.username} -> {user_id}")
    
    return AuthResponse(
        success=True,
        message="注册成功",
        token=token,
        user_id=user_id,
        username=request.username
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    用户登录
    
    验证用户凭据并返回 token
    """
    logger.info(f"登录请求: {request.username}")
    
    # 检查用户是否存在
    if request.username not in users_db:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    user = users_db[request.username]
    
    # 验证密码
    if user["password_hash"] != hash_password(request.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    # 生成新 token
    token = generate_token()
    tokens_db[token] = {
        "user_id": user["user_id"],
        "username": request.username,
        "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
    }
    
    logger.info(f"用户登录成功: {request.username}")
    
    return AuthResponse(
        success=True,
        message="登录成功",
        token=token,
        user_id=user["user_id"],
        username=request.username
    )


@router.get("/me")
async def get_current_user(token: str):
    """
    获取当前用户信息
    
    根据 token 返回用户信息
    """
    if token not in tokens_db:
        raise HTTPException(status_code=401, detail="无效的 token")
    
    token_data = tokens_db[token]
    username = token_data["username"]
    
    if username not in users_db:
        raise HTTPException(status_code=401, detail="用户不存在")
    
    user = users_db[username]
    
    return {
        "user_id": user["user_id"],
        "username": user["username"],
        "email": user["email"],
        "phone": user["phone"],
        "created_at": user["created_at"]
    }


@router.post("/logout")
async def logout(token: str):
    """
    用户登出
    
    使 token 失效
    """
    if token in tokens_db:
        del tokens_db[token]
    
    return {"success": True, "message": "登出成功"}


# 添加一些测试用户
def init_test_users():
    """初始化测试用户"""
    test_users = [
        {"username": "test", "password": "123456", "email": "test@example.com"},
        {"username": "demo", "password": "demo123", "email": "demo@example.com"},
        {"username": "user1001", "password": "password", "email": "user1001@example.com"},
    ]
    
    for user in test_users:
        if user["username"] not in users_db:
            user_id = f"user_{len(users_db) + 1001}"
            users_db[user["username"]] = {
                "user_id": user_id,
                "username": user["username"],
                "password_hash": hash_password(user["password"]),
                "email": user["email"],
                "phone": None,
                "created_at": datetime.now().isoformat()
            }
            logger.info(f"初始化测试用户: {user['username']}")


# 启动时初始化测试用户
init_test_users()
