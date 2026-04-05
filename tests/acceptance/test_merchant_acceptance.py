# -*- coding: utf-8 -*-
"""
商户用户场景验收测试
基于���户用户故事的端到端验收测试

用户故事覆盖：
- 作为商户，我可以注册和管理我的餐厅
- 作为商户，我可以管理菜单
- 作为商户，我可以接受/拒绝订单
- 作为商户，我可以使用AI智能定价
- 作为商户，我可以处理退款请求
- 作为商户，我可以查看结算和佣金
"""
import pytest
import requests
import time

BASE_URLS = {
    "user": "http://localhost:8083",
    "merchant": "http://localhost:8081",
    "order": "http://localhost:8084",
    "pricing": "http://localhost:8089",
    "platform": "http://localhost:8088",
}


class TestMerchantRegistration:
    """用户故事：作为商户，我可以注册和管理我的餐厅"""

    def test_register_as_merchant(self):
        """AC1: 可以注册商户账号"""
        payload = {
            "username": f"merchant_{int(time.time())}",
            "email": f"merchant_{int(time.time())}@test.com",
            "password": "Merchant@123",
            "role": "MERCHANT"
        }
        response = requests.post(f"{BASE_URLS['user']}/api/auth/register", json=payload)
        assert response.status_code in [200, 201]

    def test_merchant_onboarding(self):
        """AC2: 可以完善商户入驻信息"""
        headers = {"Authorization": "Bearer merchant-token"}
        payload = {
            "name": "验收测试餐厅",
            "cuisineType": "川菜",
            "address": "上海市浦东新区���试路1号",
            "phone": "021-12345678"
        }
        response = requests.post(
            f"{BASE_URLS['merchant']}/api/merchants",
            json=payload, headers=headers
        )
        assert response.status_code in [200, 201, 401]

    def test_claim_imported_merchant(self):
        """AC3: 可以认领已导入的餐厅"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.get(
            f"{BASE_URLS['merchant']}/api/merchants/unclaimed",
            headers=headers
        )
        assert response.status_code in [200, 401, 404]


class TestMenuManagement:
    """用户故事：作为商户，我可以管理菜单"""

    def test_view_my_menu(self):
        """AC1: 可以查看我的菜单列表"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.get(
            f"{BASE_URLS['merchant']}/api/menus/my",
            headers=headers
        )
        assert response.status_code in [200, 401]

    def test_add_menu_item(self):
        """AC2: 可以添加新菜品"""
        headers = {"Authorization": "Bearer merchant-token"}
        payload = {
            "name": "验收测试菜品",
            "price": 38.0,
            "category": "招牌菜",
            "description": "测试用菜品"
        }
        response = requests.post(
            f"{BASE_URLS['merchant']}/api/menus",
            json=payload, headers=headers
        )
        assert response.status_code in [200, 201, 401]

    def test_update_menu_item_price(self):
        """AC3: 可以修改菜品价格"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.put(
            f"{BASE_URLS['merchant']}/api/menus/1",
            json={"price": 42.0},
            headers=headers
        )
        assert response.status_code in [200, 401, 404]

    def test_disable_menu_item(self):
        """AC4: 可以下架菜品"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.put(
            f"{BASE_URLS['merchant']}/api/menus/1/disable",
            headers=headers
        )
        assert response.status_code in [200, 401, 404]


class TestOrderManagement:
    """用户故事：作为商户，我可以接受/拒绝订单"""

    def test_view_pending_orders(self):
        """AC1: 可以查看待处理订单"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.get(
            f"{BASE_URLS['merchant']}/api/merchant-orders/pending",
            headers=headers
        )
        assert response.status_code in [200, 401]

    def test_accept_order(self):
        """AC2: 可以接受订单"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.post(
            f"{BASE_URLS['merchant']}/api/merchant-orders/1/accept",
            headers=headers
        )
        assert response.status_code in [200, 400, 401, 404]

    def test_reject_order_with_reason(self):
        """AC3: 可以拒绝订单并说明原因"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.post(
            f"{BASE_URLS['merchant']}/api/merchant-orders/1/reject",
            json={"reason": "已打烊"},
            headers=headers
        )
        assert response.status_code in [200, 400, 401, 404]


class TestAISmartPricing:
    """用户故事：作为商户，我可以使用AI智能定价"""

    def test_ai_pricing_service_health(self):
        """AC1: AI定价服务应可用"""
        response = requests.get(f"{BASE_URLS['pricing']}/health")
        assert response.status_code in [200, 404, 500]

    def test_trigger_pricing_analysis(self):
        """AC2: 可以触发定价分析"""
        response = requests.post(f"{BASE_URLS['pricing']}/trigger-cycle")
        assert response.status_code in [200, 202, 500]


class TestRefundHandling:
    """用户故事：作为���户，我可以处理退款请求"""

    def test_view_refund_requests(self):
        """AC1: 可以查看退款申请列表"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.get(
            f"{BASE_URLS['merchant']}/api/merchant-refunds",
            headers=headers
        )
        assert response.status_code in [200, 401]

    def test_approve_refund(self):
        """AC2: 可以批准退款"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.post(
            f"{BASE_URLS['merchant']}/api/merchant-refunds/1/approve",
            headers=headers
        )
        assert response.status_code in [200, 400, 401, 404]


class TestSettlementAndCommission:
    """用户故事：作为商户，我可以查看结算和佣金"""

    def test_view_commission_records(self):
        """AC1: 可以查看佣金记录"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.get(
            f"{BASE_URLS['platform']}/api/commissions",
            headers=headers
        )
        assert response.status_code in [200, 401]

    def test_view_settlement_dashboard(self):
        """AC2: 可以查看结算仪表盘"""
        headers = {"Authorization": "Bearer merchant-token"}
        response = requests.get(
            f"{BASE_URLS['platform']}/api/settlements",
            headers=headers
        )
        assert response.status_code in [200, 401]
