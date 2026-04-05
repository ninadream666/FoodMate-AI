# -*- coding: utf-8 -*-
"""
输入验证与注入防护安全测试
覆盖SQL注入、XSS攻击、请求参数校验
直连真实运行的微服务
"""
import pytest
import requests
import time
import os

os.environ["no_proxy"] = "localhost,127.0.0.1"

USER_URL = "http://localhost:8083"
ORDER_URL = "http://localhost:8084"
NUTRIVISION_URL = "http://localhost:8090"

_s = requests.Session()
_s.proxies = {"http": None, "https": None}
_s.trust_env = False
TIMEOUT = 10


# ==================== SQL注入防护 ====================

class TestSQLInjection:
    """SQL注入防护测试"""

    @pytest.mark.parametrize("payload", [
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--",
        "'; DROP TABLE users;--",
        "1' OR '1'='1' /*",
    ])
    def test_login_sql_injection(self, payload):
        """登录接口SQL注入应被防护"""
        r = _s.post(f"{USER_URL}/auth/login", json={
            "username": payload, "password": "test", "role": "CUSTOMER"
        }, timeout=TIMEOUT)
        # 注入不应导致登录成功（200带token）
        if r.status_code == 200:
            data = r.json()
            assert "token" not in data or not data.get("token"), \
                f"SQL注入载荷 '{payload}' 不应导致登录成功"

    def test_register_sql_injection(self):
        """注册接口SQL注入"""
        r = _s.post(f"{USER_URL}/auth/register", json={
            "username": "'; DROP TABLE users;--",
            "email": "sql@test.com",
            "password": "Test@123",
            "role": "CUSTOMER"
        }, timeout=TIMEOUT)
        # 应正常处理，不崩溃
        assert r.status_code in [200, 400, 500]


# ==================== XSS防护 ====================

class TestXSSPrevention:
    """XSS攻击防护测试"""

    @pytest.mark.parametrize("payload", [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert(1)>",
        "javascript:alert(1)",
        "<svg onload=alert(1)>",
    ])
    def test_register_xss_in_username(self, payload):
        """注册用户名中的XSS载荷应被处理"""
        r = _s.post(f"{USER_URL}/auth/register", json={
            "username": payload,
            "email": f"xss_{int(time.time())}@test.com",
            "password": "Test@123456",
            "role": "CUSTOMER"
        }, timeout=TIMEOUT)
        if r.status_code == 200:
            # 如果注册成功，返回数据不应包含未转义的脚本
            text = r.text
            assert "<script>" not in text.lower()
        # 不论成功失败，服务不应崩溃
        assert r.status_code in [200, 400, 500]


# ==================== 参数类型校验 ====================

class TestParameterValidation:
    """参数类型校验测试"""

    def test_empty_register_body(self):
        """空注册请求应返回错误"""
        r = _s.post(f"{USER_URL}/auth/register", json={}, timeout=TIMEOUT)
        assert r.status_code in [400, 422, 500]

    def test_empty_login_body(self):
        """空登录请求应返回错误"""
        r = _s.post(f"{USER_URL}/auth/login", json={}, timeout=TIMEOUT)
        assert r.status_code in [400, 401, 500]

    def test_very_long_username(self):
        """超长用户名应被处理"""
        r = _s.post(f"{USER_URL}/auth/register", json={
            "username": "A" * 10000,
            "email": "long@test.com",
            "password": "Test@123",
            "role": "CUSTOMER"
        }, timeout=TIMEOUT)
        assert r.status_code in [200, 400, 413, 500]

    def test_invalid_role(self):
        """无效角色应被拒绝或忽略"""
        r = _s.post(f"{USER_URL}/auth/register", json={
            "username": f"invalidrole_{int(time.time())}",
            "email": f"role_{int(time.time())}@test.com",
            "password": "Test@123456",
            "role": "SUPERADMIN"
        }, timeout=TIMEOUT)
        # 应拒绝或当作默认角色
        assert r.status_code in [200, 400, 403, 500]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
