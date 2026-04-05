# -*- coding: utf-8 -*-
"""
FoodMate-AI 性能测试 - Locust 负载测试脚本

测试场景：
1. 用户登录（并发认证压力）
2. 商户列表查询（高频读操作）
3. 菜单查询（热点数据缓存验证）
4. 订单创建（写操作并发）
5. 推荐服务（AI计算密集型）
6. 混合场景（模拟真实用户行为比例）

运行方式：
  locust -f locustfile.py --host=http://localhost
  # 或指定并发数：
  locust -f locustfile.py --host=http://localhost -u 100 -r 10 --run-time 5m

性能指标目标（参见 performance_config.yml）：
  - 商户列表: P95 < 500ms
  - 订单创建: P95 < 1000ms
  - 推荐服务: P95 < 3000ms
"""
from locust import HttpUser, task, between, tag
import json
import random
import time


class CustomerUser(HttpUser):
    """模拟普通顾客用户行为"""

    # 请求间隔：1~3秒，模拟真实用户浏览间隔
    wait_time = between(1, 3)

    token = None
    user_id = None

    def on_start(self):
        """用户启动时执行登录"""
        response = self.client.post("/api/auth/login", json={
            "username": f"loadtest_user_{random.randint(1, 1000)}",
            "password": "Test@123456",
            "role": "CUSTOMER"
        }, name="用户登录", catch_response=True)

        if response.status_code == 200:
            try:
                data = response.json()
                self.token = data.get("token", "")
                self.user_id = data.get("id", 1)
                response.success()
            except Exception:
                response.failure("登录响应解析失败")
        else:
            # 登录失败时使用默认token继续测试
            self.token = "test-token"
            self.user_id = 1

    @property
    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    # ===== 高频操作（权重大） =====

    @task(5)
    @tag("read", "merchant")
    def browse_merchants(self):
        """浏览商户列表 - 最高频操作"""
        with self.client.get(
            ":8081/api/merchants/public/list",
            headers=self.auth_headers,
            name="商户列表查询",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"状态码: {response.status_code}")

    @task(3)
    @tag("read", "menu")
    def view_menu(self):
        """查看商户菜单"""
        merchant_id = random.randint(1, 50)
        self.client.get(
            f":8081/api/merchants/{merchant_id}/menu",
            headers=self.auth_headers,
            name="商户菜单查询"
        )

    @task(3)
    @tag("read", "order")
    def view_my_orders(self):
        """查看我的订单"""
        self.client.get(
            ":8084/api/orders/my-orders",
            headers=self.auth_headers,
            name="我的订单列表"
        )

    # ===== 中频操作 =====

    @task(2)
    @tag("write", "order")
    def create_order(self):
        """创建订单 - 写操作压测"""
        payload = {
            "merchantId": random.randint(1, 50),
            "addressId": 1,
            "items": [
                {"menuItemId": random.randint(1, 100), "quantity": random.randint(1, 3),
                 "price": round(random.uniform(15, 60), 2)}
            ],
            "totalAmount": round(random.uniform(20, 150), 2),
            "paymentMethod": "WECHAT"
        }
        self.client.post(
            ":8084/api/orders",
            json=payload,
            headers=self.auth_headers,
            name="创建订单"
        )

    @task(2)
    @tag("ai", "recommendation")
    def get_recommendations(self):
        """获取智能推荐 - AI密集计算"""
        payload = {
            "user_id": str(self.user_id or 1),
            "location": {
                "address": "上海市浦东新区",
                "latitude": 31.2304 + random.uniform(-0.05, 0.05),
                "longitude": 121.4737 + random.uniform(-0.05, 0.05)
            },
            "query": "推荐附近美食",
            "max_results": 10,
            "health_context": {
                "daily_steps": random.randint(2000, 15000),
                "heart_rate": random.randint(60, 100),
                "activity_status": random.choice(["still", "walking", "running"]),
                "is_post_workout": random.choice([True, False])
            }
        }
        with self.client.post(
            ":8087/api/v2/agents/recommend",
            json=payload,
            headers=self.auth_headers,
            name="AI智能推荐",
            catch_response=True,
            timeout=60  # 推荐服务超时60秒
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.elapsed.total_seconds() > 30:
                response.failure(f"推荐服务响应过慢: {response.elapsed.total_seconds():.1f}s")

    # ===== 低频操作 =====

    @task(1)
    @tag("read", "profile")
    def view_profile(self):
        """查看个人资料"""
        self.client.get(
            ":8086/api/profiles/1",
            headers=self.auth_headers,
            name="用户画像查询"
        )

    @task(1)
    @tag("read", "coupon")
    def view_coupons(self):
        """查看优惠券"""
        self.client.get(
            ":8082/api/coupons/my",
            headers=self.auth_headers,
            name="我的优惠券"
        )


class MerchantUser(HttpUser):
    """模拟商户用户行为"""
    wait_time = between(2, 5)
    weight = 1  # 商户用户较少

    token = None

    def on_start(self):
        """商户登录"""
        response = self.client.post("/api/auth/login", json={
            "username": f"merchant_{random.randint(1, 100)}",
            "password": "Merchant@123",
            "role": "MERCHANT"
        }, name="商户登录")
        if response.status_code == 200:
            self.token = response.json().get("token", "test-merchant-token")
        else:
            self.token = "test-merchant-token"

    @property
    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    @task(3)
    @tag("merchant", "orders")
    def check_pending_orders(self):
        """查看待处理订单"""
        self.client.get(
            ":8081/api/merchant-orders/pending",
            headers=self.auth_headers,
            name="商户待处理订单"
        )

    @task(1)
    @tag("merchant", "menu")
    def manage_menu(self):
        """管理菜单"""
        self.client.get(
            ":8081/api/menus/my",
            headers=self.auth_headers,
            name="商户菜单管理"
        )
