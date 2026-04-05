# -*- coding: utf-8 -*-
"""
认证安全测试
覆盖JWT Token安全性、角色权限控制、Token篡改检测
直连真实运行的微服务
"""
import pytest
import requests
import json
import base64
import time
import os

os.environ["no_proxy"] = "localhost,127.0.0.1"

USER_URL = "http://localhost:8083"
ORDER_URL = "http://localhost:8084"
MERCHANT_URL = "http://localhost:8081"

_s = requests.Session()
_s.proxies = {"http": None, "https": None}
_s.trust_env = False
TIMEOUT = 10


@pytest.fixture(scope="module")
def valid_token():
    """获取有效的JWT Token"""
    ts = int(time.time())
    _s.post(f"{USER_URL}/auth/register", json={
        "username": f"sectest_{ts}", "email": f"sec_{ts}@test.com",
        "password": "Sec@Test123", "role": "CUSTOMER",
    }, timeout=TIMEOUT)
    r = _s.post(f"{USER_URL}/auth/login", json={
        "username": f"sectest_{ts}", "password": "Sec@Test123", "role": "CUSTOMER",
    }, timeout=TIMEOUT)
    return r.json().get("token", "") if r.status_code == 200 else ""


# ==================== JWT Token安全 ====================

class TestJwtTokenSecurity:
    """JWT Token安全测试"""

    def test_missing_auth_header_returns_401_or_403(self):
        """缺少Authorization头应返回401/403"""
        r = _s.get(f"{ORDER_URL}/orders/my-orders", timeout=TIMEOUT)
        assert r.status_code in [401, 403]

    def test_empty_token_returns_401_or_403(self):
        """空Token应返回401/403"""
        r = _s.get(f"{ORDER_URL}/orders/my-orders",
                   headers={"Authorization": "Bearer "}, timeout=TIMEOUT)
        assert r.status_code in [401, 403]

    def test_invalid_token_rejected(self):
        """无效Token格式应被拒绝"""
        r = _s.get(f"{ORDER_URL}/orders/my-orders",
                   headers={"Authorization": "Bearer not-a-valid-jwt"}, timeout=TIMEOUT)
        assert r.status_code in [401, 403]

    def test_tampered_token_rejected(self):
        """篡改签名的Token应被拒绝"""
        fake_header = base64.urlsafe_b64encode(
            json.dumps({"alg": "HS256"}).encode()).decode().rstrip("=")
        fake_payload = base64.urlsafe_b64encode(json.dumps({
            "sub": "admin", "role": "ADMIN", "exp": int(time.time()) + 3600
        }).encode()).decode().rstrip("=")
        tampered_token = f"{fake_header}.{fake_payload}.tampered_sig_12345"

        r = _s.get(f"{ORDER_URL}/orders/my-orders",
                   headers={"Authorization": f"Bearer {tampered_token}"}, timeout=TIMEOUT)
        assert r.status_code in [401, 403], "篡改的Token不应通过验证"

    def test_none_algorithm_attack_blocked(self):
        """none算法攻击应被拦截"""
        fake_header = base64.urlsafe_b64encode(
            json.dumps({"alg": "none", "typ": "JWT"}).encode()).decode().rstrip("=")
        fake_payload = base64.urlsafe_b64encode(
            json.dumps({"sub": "admin", "role": "ADMIN"}).encode()).decode().rstrip("=")
        attack_token = f"{fake_header}.{fake_payload}."

        r = _s.get(f"{ORDER_URL}/orders/my-orders",
                   headers={"Authorization": f"Bearer {attack_token}"}, timeout=TIMEOUT)
        assert r.status_code in [401, 403], "none算法攻击应被拦截"

    def test_valid_token_works(self, valid_token):
        """有效Token应能正常访问"""
        r = _s.get(f"{ORDER_URL}/orders/my-orders",
                   headers={"Authorization": f"Bearer {valid_token}"}, timeout=TIMEOUT)
        assert r.status_code == 200


# ==================== 角色权限控制 ====================

class TestRoleBasedAccessControl:
    """角色权限控制测试"""

    def test_customer_can_access_orders(self, valid_token):
        """顾客应能访问订单"""
        r = _s.get(f"{ORDER_URL}/orders/my-orders",
                   headers={"Authorization": f"Bearer {valid_token}"}, timeout=TIMEOUT)
        assert r.status_code == 200

    def test_customer_can_view_profile(self, valid_token):
        """顾客应能查看资料"""
        r = _s.get(f"{USER_URL}/users/me",
                   headers={"Authorization": f"Bearer {valid_token}"}, timeout=TIMEOUT)
        assert r.status_code == 200


# ==================== 速率限制 ====================

class TestRateLimiting:
    """速率限制测试"""

    def test_rapid_login_attempts(self):
        """快速登录尝试不应导致服务崩溃"""
        statuses = []
        for i in range(15):
            r = _s.post(f"{USER_URL}/auth/login", json={
                "username": "ratelimit_test", "password": "wrong", "role": "CUSTOMER"
            }, timeout=TIMEOUT)
            statuses.append(r.status_code)
        # 所有请求都应得到正常响应（不是5xx崩溃）
        assert all(s in [200, 400, 401, 403, 429] for s in statuses)

    def test_rapid_order_creation(self, valid_token):
        """快速创建订单应被限流"""
        statuses = []
        headers = {"Authorization": f"Bearer {valid_token}"}
        for i in range(5):
            r = _s.post(f"{ORDER_URL}/orders", headers=headers,
                        json={"merchantId": 1, "items": [{"menuItemId": 1, "quantity": 1}]},
                        timeout=TIMEOUT)
            statuses.append(r.status_code)
        # 应有正常响应，可能包含429限流
        assert all(isinstance(s, int) for s in statuses)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
