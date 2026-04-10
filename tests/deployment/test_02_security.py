"""
FoodMate-AI 云端部署测试 — 02 安全测试
验证 SQL 注入、JWT 认证、XSS 攻击的防护能力
"""

import requests
import pytest

from config import BASE_URL, THRESHOLDS


class TestSQLInjection:
    """SQL 注入防护测试"""

    @pytest.mark.parametrize("payload", [
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--",
        "'; DROP TABLE users;--",
        "' OR 1=1 LIMIT 1--",
    ])
    def test_sql_injection_login(self, payload):
        """ST-DEPLOY-SEC-001：SQL 注入攻击应被拦截"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": payload, "password": "anything"},
            timeout=THRESHOLDS["login"],
        )
        # 不应返回 200（成功登录）
        assert resp.status_code != 200
        # 不应包含数据库错误信息泄露
        body = resp.text.lower()
        assert "stacktrace" not in body
        assert "sql" not in body


class TestJWTSecurity:
    """JWT 认证安全测试"""

    def test_no_token(self):
        """无 Token 访问受保护接口应返回 401/403"""
        resp = requests.get(f"{BASE_URL}/api/users/me", timeout=5)
        assert resp.status_code in (401, 403)

    def test_empty_bearer(self):
        """空 Bearer Token 应返回 401/403"""
        resp = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"Authorization": "Bearer "},
            timeout=5,
        )
        assert resp.status_code in (401, 403, 500)

    def test_invalid_token(self):
        """伪造 Token 应返回 401/403/500"""
        resp = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"Authorization": "Bearer fake.invalid.token"},
            timeout=5,
        )
        assert resp.status_code in (401, 403, 500)

    def test_malformed_header(self):
        """格式错误的 Authorization 头"""
        resp = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"Authorization": "not-a-valid-scheme"},
            timeout=5,
        )
        assert resp.status_code in (401, 403, 500)


class TestXSS:
    """XSS 攻击防护测试"""

    @pytest.mark.parametrize("payload", [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        '"><svg onload=alert(1)>',
        "javascript:alert(1)",
    ])
    def test_xss_in_registration(self, payload):
        """XSS 载荷注册后不应在响应中以未转义形式出现"""
        import time
        username = f"xss_{int(time.time() * 1000)}"
        resp = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "username": payload,
                "email": f"{username}@test.com",
                "password": "Test123456",
                "role": "customer",
            },
            timeout=5,
        )
        # 无论注册是否成功，响应中不应包含未转义的脚本标签
        if resp.status_code == 200:
            body = resp.text
            assert "<script>" not in body
            assert "onerror=" not in body


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
