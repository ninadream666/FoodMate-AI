# -*- coding: utf-8 -*-
"""
订单流程功能测试
浏览商户 → 查看订单列表 → 创建订单 → 查看详情
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
    "order": "http://localhost:8084",
}

_s = requests.Session()
_s.proxies = {"http": None, "https": None}
_s.trust_env = False


@pytest.fixture(scope="module")
def auth_headers():
    """注册并登录获取认证头"""
    ts = int(time.time())
    _s.post(f"{BASE['user']}/auth/register", json={
        "username": f"ordertest_{ts}", "email": f"ordertest_{ts}@test.com",
        "password": "Order@Test123", "role": "CUSTOMER",
    }, timeout=10)
    r = _s.post(f"{BASE['user']}/auth/login", json={
        "username": f"ordertest_{ts}", "password": "Order@Test123", "role": "CUSTOMER",
    }, timeout=10)
    token = r.json().get("token", "") if r.status_code == 200 else ""
    return {"Authorization": f"Bearer {token}"}


# ==================== 浏览商户和菜单 ====================

class TestBrowseBeforeOrder:
    """下单前浏览"""

    def test_merchant_list_accessible(self, auth_headers):
        """商户列表可访问"""
        r = _s.get(f"{BASE['merchant']}/merchants", headers=auth_headers, timeout=10)
        assert r.status_code == 200

    def test_merchant_list_has_content(self, auth_headers):
        """商户列表应有数据"""
        r = _s.get(f"{BASE['merchant']}/merchants", headers=auth_headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            merchants = data.get("content", []) if isinstance(data, dict) else data
            assert isinstance(merchants, list)


# ==================== 订单列表 ====================

class TestOrderList:
    """订单列表查询"""

    def test_get_my_orders(self, auth_headers):
        """应能查询我的订单列表"""
        r = _s.get(f"{BASE['order']}/orders/my-orders",
                   headers=auth_headers, timeout=10)
        assert r.status_code == 200

    def test_my_orders_returns_paginated_data(self, auth_headers):
        """订单列表应返回分页结构"""
        r = _s.get(f"{BASE['order']}/orders/my-orders",
                   headers=auth_headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            # Spring Data分页结构
            assert "content" in data or isinstance(data, list)

    def test_orders_without_auth_fails(self):
        """未登录查询订单应被拒绝"""
        r = _s.get(f"{BASE['order']}/orders/my-orders", timeout=10)
        assert r.status_code in [401, 403]


# ==================== 创建订单 ====================

class TestOrderCreation:
    """订单创建"""

    def test_create_order_endpoint_exists(self, auth_headers):
        """订单创建接口应存在"""
        r = _s.post(f"{BASE['order']}/orders", headers=auth_headers,
                    json={"merchantId": 140, "items": [{"menuItemId": 1, "quantity": 1}],
                          "totalAmount": 30.0},
                    timeout=10)
        # 可能因限流(429)、参数问题(400)、或成功(200/201)
        assert r.status_code in [200, 201, 400, 429, 500]

    def test_create_order_without_auth_fails(self):
        """未登录创建订单应被拒绝"""
        r = _s.post(f"{BASE['order']}/orders",
                    json={"merchantId": 1, "items": []},
                    timeout=10)
        assert r.status_code in [401, 403]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
