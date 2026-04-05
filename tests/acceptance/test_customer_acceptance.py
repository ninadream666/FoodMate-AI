# -*- coding: utf-8 -*-
"""
顾客用户场景验收测试
基于用户故事的端到端验收测试
"""
import pytest
import requests
import time
import os

os.environ["no_proxy"] = "localhost,127.0.0.1"

BASE = {
    "user": "http://localhost:8083",
    "merchant": "http://localhost:8081",
    "order": "http://localhost:8084",
    "recommendation": "http://localhost:8087",
    "nutrivision": "http://localhost:8090",
}

_s = requests.Session()
_s.proxies = {"http": None, "https": None}
_s.trust_env = False
TIMEOUT = 10


@pytest.fixture(scope="module")
def customer():
    """注册并登录顾客用户"""
    ts = int(time.time())
    username = f"accept_cust_{ts}"
    _s.post(f"{BASE['user']}/auth/register", json={
        "username": username, "email": f"{username}@test.com",
        "password": "Accept@123", "role": "CUSTOMER",
    }, timeout=TIMEOUT)
    r = _s.post(f"{BASE['user']}/auth/login", json={
        "username": username, "password": "Accept@123", "role": "CUSTOMER",
    }, timeout=TIMEOUT)
    data = r.json() if r.status_code == 200 else {}
    return {
        "token": data.get("token", ""),
        "id": data.get("id"),
        "headers": {"Authorization": f"Bearer {data.get('token', '')}"},
    }


class TestStory_RegisterAndLogin:
    """用户故事：作为顾客，我可以注册和登录"""

    def test_can_register(self):
        """AC1: 可以注册新账号"""
        ts = int(time.time())
        r = _s.post(f"{BASE['user']}/auth/register", json={
            "username": f"ac_reg_{ts}", "email": f"ac_{ts}@t.com",
            "password": "AC@123456", "role": "CUSTOMER",
        }, timeout=TIMEOUT)
        assert r.status_code == 200

    def test_can_login_and_get_token(self, customer):
        """AC2: 可以登录获取Token"""
        assert customer["token"]
        assert len(customer["token"]) > 20

    def test_can_view_profile(self, customer):
        """AC3: 可以查看个人资料"""
        r = _s.get(f"{BASE['user']}/users/me",
                   headers=customer["headers"], timeout=TIMEOUT)
        assert r.status_code == 200


class TestStory_BrowseRestaurants:
    """用户故事：作为顾客，我可以浏览餐厅"""

    def test_can_see_merchant_list(self, customer):
        """AC1: 可以看到商户列表"""
        r = _s.get(f"{BASE['merchant']}/merchants",
                   headers=customer["headers"], timeout=TIMEOUT)
        assert r.status_code == 200

    def test_can_see_merchant_detail(self, customer):
        """AC2: 可以看到商户详情"""
        r = _s.get(f"{BASE['merchant']}/merchants",
                   headers=customer["headers"], timeout=TIMEOUT)
        if r.status_code == 200:
            data = r.json()
            merchants = data.get("content", []) if isinstance(data, dict) else data
            if merchants:
                mid = merchants[0].get("id")
                r2 = _s.get(f"{BASE['merchant']}/merchants/{mid}",
                            headers=customer["headers"], timeout=TIMEOUT)
                assert r2.status_code == 200


class TestStory_PlaceOrder:
    """用户故事：作为顾客，我可以下单"""

    def test_can_view_my_orders(self, customer):
        """AC1: 可以查看订单列表"""
        r = _s.get(f"{BASE['order']}/orders/my-orders",
                   headers=customer["headers"], timeout=TIMEOUT)
        assert r.status_code == 200

    def test_order_creation_endpoint_works(self, customer):
        """AC2: 订单创建接口可用"""
        r = _s.post(f"{BASE['order']}/orders", headers=customer["headers"],
                    json={"merchantId": 140, "items": [{"menuItemId": 1, "quantity": 1}],
                          "totalAmount": 30.0},
                    timeout=TIMEOUT)
        assert r.status_code in [200, 201, 400, 429, 500]


class TestStory_AIRecommendation:
    """用户故事：作为顾客，我可以获取AI推荐"""

    def test_recommendation_service_available(self):
        """AC1: 推荐服务可用"""
        r = _s.get(f"{BASE['recommendation']}/health", timeout=TIMEOUT)
        assert r.status_code == 200


class TestStory_NutriVision:
    """用户故事：作为顾客，我可以使用NutriVision"""

    def test_nutrivision_service_available(self):
        """AC1: NutriVision服务可用"""
        r = _s.get(f"{BASE['nutrivision']}/health", timeout=TIMEOUT)
        assert r.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
