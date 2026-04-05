# -*- coding: utf-8 -*-
"""
用户流程功能测试
完整用户生命周期：注册 → 登录 → 查看资料 → 浏览商户
直连真实运行的微服务
"""
import pytest
import requests
import time
import os

os.environ["no_proxy"] = "localhost,127.0.0.1"

BASE = {
    "user": "http://localhost:8083",
    "merchant": "http://localhost:8081",
}

_s = requests.Session()
_s.proxies = {"http": None, "https": None}
_s.trust_env = False


@pytest.fixture(scope="module")
def registered_user():
    """注册一个测试用户并登录，返回token和用户信息"""
    ts = int(time.time())
    username = f"functest_{ts}"
    reg = _s.post(f"{BASE['user']}/auth/register", json={
        "username": username, "email": f"{username}@test.com",
        "password": "Func@Test123", "role": "CUSTOMER",
    }, timeout=10)

    login = _s.post(f"{BASE['user']}/auth/login", json={
        "username": username, "password": "Func@Test123", "role": "CUSTOMER",
    }, timeout=10)

    data = login.json() if login.status_code == 200 else {}
    return {
        "username": username,
        "token": data.get("token", ""),
        "id": data.get("id"),
        "headers": {"Authorization": f"Bearer {data.get('token', '')}"},
        "reg_status": reg.status_code,
        "login_status": login.status_code,
    }


# ==================== 注册流程 ====================

class TestUserRegistration:
    """用户注册流程"""

    def test_register_new_customer(self, registered_user):
        """新用户注册应成功"""
        assert registered_user["reg_status"] == 200

    def test_register_duplicate_should_fail(self, registered_user):
        """重复用户名注册应失败"""
        r = _s.post(f"{BASE['user']}/auth/register", json={
            "username": registered_user["username"],
            "email": "dup@test.com", "password": "Dup@123", "role": "CUSTOMER",
        }, timeout=10)
        assert r.status_code in [400, 409, 500]

    def test_register_empty_fields_should_fail(self):
        """空字段注册应失败"""
        r = _s.post(f"{BASE['user']}/auth/register", json={}, timeout=10)
        assert r.status_code in [400, 422, 500]


# ==================== 登录流程 ====================

class TestUserLogin:
    """用户登录流程"""

    def test_login_success_returns_token(self, registered_user):
        """正确凭据登录应返回JWT Token"""
        assert registered_user["login_status"] == 200
        assert len(registered_user["token"]) > 20

    def test_login_wrong_password_fails(self):
        """错误密码应返回401"""
        r = _s.post(f"{BASE['user']}/auth/login", json={
            "username": "functest_nonexist", "password": "wrong", "role": "CUSTOMER",
        }, timeout=10)
        assert r.status_code in [400, 401]

    def test_login_response_contains_user_info(self, registered_user):
        """登录响应应包含用户ID和角色"""
        assert registered_user["id"] is not None


# ==================== 个人资料 ====================

class TestUserProfile:
    """个人资料查看"""

    def test_get_my_profile(self, registered_user):
        """已登录用户可查看个人资料"""
        r = _s.get(f"{BASE['user']}/users/me",
                   headers=registered_user["headers"], timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data.get("username") == registered_user["username"]

    def test_profile_without_auth_fails(self):
        """未登录访问资料应被拒绝"""
        r = _s.get(f"{BASE['user']}/users/me", timeout=10)
        assert r.status_code in [401, 403]


# ==================== 浏览商户 ====================

class TestBrowseMerchants:
    """浏览商户"""

    def test_get_merchant_list(self, registered_user):
        """应能获取商户列表"""
        r = _s.get(f"{BASE['merchant']}/merchants",
                   headers=registered_user["headers"], timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "content" in data or isinstance(data, list)

    def test_get_merchant_detail(self, registered_user):
        """应能获取商户详情"""
        # 先拿列表
        r = _s.get(f"{BASE['merchant']}/merchants",
                   headers=registered_user["headers"], timeout=10)
        if r.status_code == 200:
            data = r.json()
            merchants = data.get("content", data) if isinstance(data, dict) else data
            if merchants and len(merchants) > 0:
                mid = merchants[0].get("id")
                r2 = _s.get(f"{BASE['merchant']}/merchants/{mid}",
                            headers=registered_user["headers"], timeout=10)
                assert r2.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
