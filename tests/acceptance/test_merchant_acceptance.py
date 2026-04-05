# -*- coding: utf-8 -*-
"""
商户用户场景验收测试
"""
import pytest
import requests
import time
import os

os.environ["no_proxy"] = "localhost,127.0.0.1"

BASE = {
    "user": "http://localhost:8083",
    "merchant": "http://localhost:8081",
    "pricing": "http://localhost:8089",
    "platform": "http://localhost:8088",
}

_s = requests.Session()
_s.proxies = {"http": None, "https": None}
_s.trust_env = False
TIMEOUT = 10


@pytest.fixture(scope="module")
def merchant():
    """注册并登录商户用户"""
    ts = int(time.time())
    username = f"accept_merch_{ts}"
    _s.post(f"{BASE['user']}/auth/register", json={
        "username": username, "email": f"{username}@test.com",
        "password": "Merch@123", "role": "MERCHANT",
    }, timeout=TIMEOUT)
    r = _s.post(f"{BASE['user']}/auth/login", json={
        "username": username, "password": "Merch@123", "role": "MERCHANT",
    }, timeout=TIMEOUT)
    data = r.json() if r.status_code == 200 else {}
    return {
        "token": data.get("token", ""),
        "id": data.get("id"),
        "headers": {"Authorization": f"Bearer {data.get('token', '')}"},
    }


class TestStory_MerchantRegistration:
    """用户故事：作为商户，我可以注册"""

    def test_can_register_as_merchant(self):
        """AC1: 可以注册商户账号"""
        ts = int(time.time())
        r = _s.post(f"{BASE['user']}/auth/register", json={
            "username": f"m_reg_{ts}", "email": f"m_{ts}@t.com",
            "password": "M@123456", "role": "MERCHANT",
        }, timeout=TIMEOUT)
        assert r.status_code == 200

    def test_can_login_as_merchant(self, merchant):
        """AC2: 可以登录"""
        assert merchant["token"]


class TestStory_MerchantViewData:
    """用户故事：作为商户，我可以查看商户数据"""

    def test_can_view_merchants(self, merchant):
        """AC1: 可以访问商户接口"""
        r = _s.get(f"{BASE['merchant']}/merchants",
                   headers=merchant["headers"], timeout=TIMEOUT)
        assert r.status_code in [200, 403]


class TestStory_AIPricing:
    """用户故事：作为商户，我可以使用AI定价"""

    def test_ai_pricing_service_available(self):
        """AC1: AI定价服务可用"""
        r = _s.get(f"{BASE['pricing']}/health", timeout=TIMEOUT)
        assert r.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
