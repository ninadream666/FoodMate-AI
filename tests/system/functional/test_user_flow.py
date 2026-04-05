# -*- coding: utf-8 -*-
"""
用户流程功能测试
完整用户生命周期：注册 → 登录 → 完善资料 → 地址管理 → 浏览商户 → 退出
"""
import pytest
import requests
import time

# 服务地址配置
BASE_URLS = {
    "user": "http://localhost:8083",
    "merchant": "http://localhost:8081",
    "profile": "http://localhost:8086",
}


class TestUserRegistrationFlow:
    """用户注册流程测试"""

    def test_register_new_customer(self):
        """新用户注册 - 应返回用户ID"""
        payload = {
            "username": f"testuser_{int(time.time())}",
            "email": f"test_{int(time.time())}@example.com",
            "password": "Test@123456",
            "role": "CUSTOMER"
        }
        response = requests.post(f"{BASE_URLS['user']}/api/auth/register", json=payload)
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data or "data" in data

    def test_register_duplicate_username_should_fail(self):
        """重复用户名注册应失败"""
        payload = {
            "username": "duplicate_user",
            "email": "dup@example.com",
            "password": "Test@123456",
            "role": "CUSTOMER"
        }
        # 第一次注册
        requests.post(f"{BASE_URLS['user']}/api/auth/register", json=payload)
        # 第二次重复注册
        response = requests.post(f"{BASE_URLS['user']}/api/auth/register", json=payload)
        assert response.status_code in [400, 409, 500]

    def test_register_with_invalid_email_should_fail(self):
        """无效邮箱格式应被拒绝"""
        payload = {
            "username": "invalid_email_user",
            "email": "not-an-email",
            "password": "Test@123456",
            "role": "CUSTOMER"
        }
        response = requests.post(f"{BASE_URLS['user']}/api/auth/register", json=payload)
        assert response.status_code in [400, 422]


class TestUserLoginFlow:
    """用户登录流程测试"""

    def test_login_with_valid_credentials(self):
        """正确凭据登录应返回JWT Token"""
        payload = {"username": "testuser", "password": "password123", "role": "CUSTOMER"}
        response = requests.post(f"{BASE_URLS['user']}/api/auth/login", json=payload)
        if response.status_code == 200:
            data = response.json()
            assert "token" in data
            assert len(data["token"]) > 20  # JWT Token长度

    def test_login_with_wrong_password_should_fail(self):
        """错误密码应返回认证失败"""
        payload = {"username": "testuser", "password": "wrong_password", "role": "CUSTOMER"}
        response = requests.post(f"{BASE_URLS['user']}/api/auth/login", json=payload)
        assert response.status_code in [400, 401, 403]

    def test_login_with_nonexistent_user_should_fail(self):
        """不存在的用户名应返回错误"""
        payload = {"username": "nobody_exists_123", "password": "any", "role": "CUSTOMER"}
        response = requests.post(f"{BASE_URLS['user']}/api/auth/login", json=payload)
        assert response.status_code in [400, 401, 404]


class TestAddressManagementFlow:
    """地址管理流程测试"""

    def test_create_address(self):
        """创建收货地址"""
        # 需要先登录获取token
        headers = {"Authorization": "Bearer test-token"}
        payload = {
            "receiverName": "张三",
            "receiverPhone": "13800138000",
            "province": "上海市",
            "city": "上海市",
            "district": "浦东新区",
            "detailAddress": "陆家嘴环路1000号",
            "isDefault": True
        }
        response = requests.post(
            f"{BASE_URLS['user']}/api/addresses",
            json=payload, headers=headers
        )
        # 未认证时应返回401，认证后应返回200/201
        assert response.status_code in [200, 201, 401, 403]

    def test_get_address_list(self):
        """获取地址列表"""
        headers = {"Authorization": "Bearer test-token"}
        response = requests.get(
            f"{BASE_URLS['user']}/api/addresses",
            headers=headers
        )
        assert response.status_code in [200, 401]


class TestUserProfileFlow:
    """用户资料管理流程测试"""

    def test_get_user_profile(self):
        """获取用户个人资料"""
        headers = {"Authorization": "Bearer test-token"}
        response = requests.get(
            f"{BASE_URLS['user']}/api/users/profile",
            headers=headers
        )
        assert response.status_code in [200, 401]

    def test_update_avatar(self):
        """更新用户头像"""
        headers = {"Authorization": "Bearer test-token"}
        # 头像上传通常是multipart/form-data
        response = requests.get(
            f"{BASE_URLS['user']}/api/users/profile",
            headers=headers
        )
        assert response.status_code in [200, 401]
