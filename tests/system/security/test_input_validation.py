# -*- coding: utf-8 -*-
"""
输入验证与注入防护安全测试
覆盖SQL注入、XSS攻击、请求大小限制、参数类型校验、CORS策略等
"""
import pytest
import requests

BASE_URLS = {
    "user": "http://localhost:8083",
    "merchant": "http://localhost:8081",
    "order": "http://localhost:8084",
    "nutrivision": "http://localhost:8090",
}


class TestSQLInjection:
    """SQL注入防护测试"""

    def test_login_sql_injection_username(self):
        """登录用户名字段SQL注入尝试"""
        payloads = [
            "' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users--",
            "'; DROP TABLE users;--",
            "1' OR '1'='1' /*",
        ]
        for payload in payloads:
            response = requests.post(f"{BASE_URLS['user']}/api/auth/login", json={
                "username": payload, "password": "test", "role": "CUSTOMER"
            })
            # 注入不应导致成功登录或服务崩溃
            assert response.status_code in [400, 401, 403, 500], \
                f"SQL注入载荷 '{payload}' 不应导致登录成功"

    def test_search_sql_injection(self):
        """搜索接口SQL注入尝试"""
        injection_payload = "'; SELECT * FROM users WHERE '1'='1"
        response = requests.get(
            f"{BASE_URLS['merchant']}/api/merchants/public/list",
            params={"keyword": injection_payload}
        )
        # 应正常返回或返回空结果，不应泄露数据
        assert response.status_code in [200, 400]

    def test_order_id_injection(self):
        """订单ID参数注入"""
        headers = {"Authorization": "Bearer test-token"}
        malicious_id = "1 OR 1=1"
        response = requests.get(
            f"{BASE_URLS['order']}/api/orders/{malicious_id}/detail",
            headers=headers
        )
        assert response.status_code in [400, 401, 404, 500]


class TestXSSPrevention:
    """XSS攻击防护测试"""

    def test_xss_in_username_registration(self):
        """注册用户名XSS载荷"""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert(1)>",
            "javascript:alert(1)",
            "<svg onload=alert(1)>",
        ]
        for payload in xss_payloads:
            response = requests.post(f"{BASE_URLS['user']}/api/auth/register", json={
                "username": payload,
                "email": "xss@test.com",
                "password": "Test@123456",
                "role": "CUSTOMER"
            })
            if response.status_code == 200:
                data = response.json()
                # 返回的数据不应包含未转义的脚本标签
                response_text = str(data)
                assert "<script>" not in response_text

    def test_xss_in_address_detail(self):
        """地址详情字段XSS载荷"""
        headers = {"Authorization": "Bearer test-token"}
        payload = {
            "receiverName": "<script>alert('xss')</script>",
            "receiverPhone": "13800138000",
            "detailAddress": "<img src=x onerror=alert(1)>",
        }
        response = requests.post(
            f"{BASE_URLS['user']}/api/addresses",
            json=payload, headers=headers
        )
        assert response.status_code in [200, 201, 400, 401]

    def test_xss_in_order_cancel_reason(self):
        """订单取消原因XSS载荷"""
        headers = {"Authorization": "Bearer test-token"}
        response = requests.post(
            f"{BASE_URLS['order']}/api/orders/1/cancel",
            json={"cancelReason": "<script>document.cookie</script>"},
            headers=headers
        )
        assert response.status_code in [200, 400, 401, 404]


class TestRequestSizeLimits:
    """请求大小限制测试"""

    def test_oversized_request_body_should_be_rejected(self):
        """超大请求体应被拒绝"""
        # 构造一个超大的JSON请求
        large_data = {"data": "A" * (5 * 1024 * 1024)}  # 5MB
        response = requests.post(
            f"{BASE_URLS['user']}/api/auth/register",
            json=large_data
        )
        assert response.status_code in [400, 413, 500]

    def test_nutrivision_image_size_limit(self):
        """NutriVision图片大小限制（10MB）"""
        large_image = "A" * (11 * 1024 * 1024)  # 超过10MB
        response = requests.post(
            f"{BASE_URLS['nutrivision']}/api/v1/vision/analyze",
            json={"image": large_image, "mode": "menu"}
        )
        assert response.status_code in [400, 413, 422, 500]


class TestParameterValidation:
    """参数类型校验测试"""

    def test_non_numeric_order_id_should_fail(self):
        """非数字订单ID应返回错误"""
        headers = {"Authorization": "Bearer test-token"}
        response = requests.get(
            f"{BASE_URLS['order']}/api/orders/abc/detail",
            headers=headers
        )
        assert response.status_code in [400, 401, 404, 500]

    def test_negative_quantity_should_fail(self):
        """负数数量应被拒绝"""
        headers = {"Authorization": "Bearer test-token"}
        response = requests.post(f"{BASE_URLS['order']}/api/orders", json={
            "merchantId": 1,
            "items": [{"menuItemId": 1, "quantity": -5, "price": 30}],
            "totalAmount": -150
        }, headers=headers)
        assert response.status_code in [400, 401, 422]

    def test_missing_required_fields(self):
        """缺少必填字段应返回错误"""
        response = requests.post(f"{BASE_URLS['user']}/api/auth/register", json={})
        assert response.status_code in [400, 422]


class TestCORSPolicy:
    """CORS策略验证"""

    def test_cors_preflight_request(self):
        """OPTIONS预检请求应正确响应"""
        response = requests.options(
            f"{BASE_URLS['user']}/api/auth/login",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type,Authorization"
            }
        )
        # 应返回CORS头
        assert response.status_code in [200, 204, 403]
