"""
FoodMate-AI 云端部署测试 — 01 功能验证
验证核心业务链路：注册 → 登录 → 浏览商家 → 创建订单 → 支付
"""

import time
import requests
import pytest

from config import BASE_URL, APK_URL, TEST_CUSTOMER_PASSWORD, TEST_MERCHANT_PASSWORD, THRESHOLDS

# ── 全局状态（跨用例共享） ──────────────────────────────
_state = {}


def _unique_name(prefix: str) -> str:
    return f"{prefix}_{int(time.time() * 1000)}"


# ── 用户认证 ────────────────────────────────────────────

class TestAuth:
    """用户认证模块测试"""

    def test_register_customer(self):
        """ST-DEPLOY-001 步骤1：消费者注册"""
        username = _unique_name("cust")
        _state["customer_username"] = username
        resp = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "username": username,
                "email": f"{username}@test.com",
                "password": TEST_CUSTOMER_PASSWORD,
                "role": "customer",
            },
            timeout=THRESHOLDS["register"],
        )
        assert resp.status_code == 200
        assert "registered" in resp.text.lower() or "success" in resp.text.lower()

    def test_register_merchant(self):
        """ST-DEPLOY-001 步骤2：商家注册"""
        username = _unique_name("merch")
        _state["merchant_username"] = username
        resp = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "username": username,
                "email": f"{username}@test.com",
                "password": TEST_MERCHANT_PASSWORD,
                "role": "merchant",
            },
            timeout=THRESHOLDS["register"],
        )
        assert resp.status_code == 200

    def test_login_customer(self):
        """ST-DEPLOY-001 步骤3：消费者登录获取 Token"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "username": _state["customer_username"],
                "password": TEST_CUSTOMER_PASSWORD,
            },
            timeout=THRESHOLDS["login"],
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["role"] == "customer"
        _state["customer_token"] = data["token"]
        _state["customer_id"] = data["id"]

    def test_login_merchant(self):
        """ST-DEPLOY-001 步骤3b：商家登录获取 Token"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "username": _state["merchant_username"],
                "password": TEST_MERCHANT_PASSWORD,
            },
            timeout=THRESHOLDS["login"],
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["role"] == "merchant"
        _state["merchant_token"] = data["token"]

    def test_duplicate_register_rejected(self):
        """ST-DEPLOY-001 步骤4：重复用户名注册被拒绝"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "username": _state["customer_username"],
                "email": "dup@test.com",
                "password": TEST_CUSTOMER_PASSWORD,
                "role": "customer",
            },
            timeout=THRESHOLDS["register"],
        )
        # 重复注册应返回非 200（可能是 409 或 500）
        assert resp.status_code != 200


# ── 核心业务 ────────────────────────────────────────────

class TestCoreBusiness:
    """核心业务接口测试"""

    def _auth_header(self, role="customer"):
        token = _state.get(f"{role}_token", "")
        return {"Authorization": f"Bearer {token}"}

    def test_get_merchants(self):
        """ST-DEPLOY-001 步骤5：获取商家列表"""
        resp = requests.get(
            f"{BASE_URL}/api/merchants",
            headers=self._auth_header(),
            timeout=THRESHOLDS["merchants_list"],
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "content" in data
        assert data["totalElements"] > 0
        _state["merchant_count"] = data["totalElements"]

    def test_get_profile(self):
        """ST-DEPLOY-001 步骤6：获取个人资料"""
        resp = requests.get(
            f"{BASE_URL}/api/users/me",
            headers=self._auth_header(),
            timeout=THRESHOLDS["profile"],
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == _state["customer_username"]

    def test_create_order(self):
        """ST-DEPLOY-001 步骤7：创建订单"""
        resp = requests.post(
            f"{BASE_URL}/api/orders",
            headers=self._auth_header(),
            json={
                "merchantId": 1,
                "items": [{"menuItemId": 1, "quantity": 2, "price": 25.0}],
                "deliveryAddress": "云端部署测试地址",
            },
            timeout=THRESHOLDS["create_order"],
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "PENDING"
        _state["order_id"] = data["id"]

    def test_pay_order(self):
        """ST-DEPLOY-001 步骤8：支付订单"""
        order_id = _state["order_id"]
        resp = requests.post(
            f"{BASE_URL}/api/orders/{order_id}/pay",
            headers=self._auth_header(),
            timeout=THRESHOLDS["pay_order"],
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "PAID"
        assert "paymentTransactionId" in data


# ── Web 端与 APK ────────────────────────────────────────

class TestWebAndApk:
    """Web 管理端与 APK 下载测试"""

    def test_web_homepage(self):
        """ST-DEPLOY-001 步骤9：Web 管理端首页加载"""
        resp = requests.get(BASE_URL, timeout=THRESHOLDS["web_homepage"])
        assert resp.status_code == 200
        assert "FoodMate-AI" in resp.text

    def test_apk_download_page(self):
        """ST-DEPLOY-001 步骤10：APK 下载页可达"""
        resp = requests.get(APK_URL, timeout=5)
        assert resp.status_code == 200
        assert "FoodMateAI.apk" in resp.text

    def test_apk_file_exists(self):
        """验证 APK 文件存在且大小合理（>100MB，含端侧模型）"""
        resp = requests.head(f"{APK_URL}/FoodMateAI.apk", timeout=10)
        assert resp.status_code == 200
        size = int(resp.headers.get("Content-Length", 0))
        assert size > 100 * 1024 * 1024, f"APK 体积过小: {size} bytes"
        _state["apk_size_mb"] = round(size / 1024 / 1024, 1)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
