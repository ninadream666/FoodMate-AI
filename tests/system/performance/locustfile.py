# -*- coding: utf-8 -*-
"""
FoodMate-AI 性能测试 - Locust 负载测试脚本

无头模式运行（2分钟，10用户）：
  cd D:/FoodMate-AI/tests/system/performance
  locust -f locustfile.py --headless -u 10 -r 2 --run-time 2m --host http://localhost

Web UI模式：
  locust -f locustfile.py --host http://localhost
  打开 http://localhost:8089
"""
from locust import HttpUser, task, between, tag, events
import random
import time
import os
import requests as req

os.environ["no_proxy"] = "localhost,127.0.0.1"
os.environ["NO_PROXY"] = "localhost,127.0.0.1"

PORTS = {
    "user": 8083, "merchant": 8081, "order": 8084,
    "marketing": 8082, "recommendation": 8087, "profile": 8086,
}

_s = req.Session()
_s.proxies = {"http": None, "https": None}
_s.trust_env = False


class CustomerUser(HttpUser):
    """模拟顾客用户"""
    wait_time = between(1, 3)
    token = None

    def on_start(self):
        ts = int(time.time() * 1000) + random.randint(0, 99999)
        username = f"perf_{ts}"
        try:
            _s.post(f"http://localhost:{PORTS['user']}/auth/register", json={
                "username": username, "email": f"{username}@p.com",
                "password": "Perf@123", "role": "CUSTOMER",
            }, timeout=10)
            r = _s.post(f"http://localhost:{PORTS['user']}/auth/login", json={
                "username": username, "password": "Perf@123", "role": "CUSTOMER",
            }, timeout=10)
            self.token = r.json().get("token", "") if r.status_code == 200 else ""
        except Exception:
            self.token = ""

    @property
    def _h(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def _do(self, method, service, path, name, json_data=None):
        url = f"http://localhost:{PORTS[service]}{path}"
        start = time.time()
        exc = None
        resp_len = 0
        status = 0
        try:
            if method == "GET":
                r = _s.get(url, headers=self._h, timeout=10)
            else:
                r = _s.post(url, headers=self._h, json=json_data, timeout=15)
            status = r.status_code
            resp_len = len(r.content)
        except Exception as e:
            exc = e
        elapsed = (time.time() - start) * 1000  # ms

        if exc:
            events.request.fire(
                request_type=method, name=name, response_time=elapsed,
                response_length=0, exception=exc,
            )
        elif status >= 400 and status != 429:
            events.request.fire(
                request_type=method, name=name, response_time=elapsed,
                response_length=resp_len, exception=Exception(f"HTTP {status}"),
            )
        else:
            events.request.fire(
                request_type=method, name=name, response_time=elapsed,
                response_length=resp_len, exception=None,
            )

    @task(5)
    @tag("read")
    def browse_merchants(self):
        """浏览商户列表"""
        self._do("GET", "merchant", "/merchants", "商户列表查询")

    @task(3)
    @tag("read")
    def view_my_orders(self):
        """查看订单列表"""
        self._do("GET", "order", "/orders/my-orders", "我的订单列表")

    @task(2)
    @tag("read")
    def view_profile(self):
        """查看个人资料"""
        self._do("GET", "user", "/users/me", "个人资料")

    @task(1)
    @tag("write")
    def create_order(self):
        """创建订单"""
        self._do("POST", "order", "/orders", "创建订单", {
            "merchantId": random.randint(1, 200),
            "items": [{"menuItemId": random.randint(1, 100), "quantity": 1}],
            "totalAmount": round(random.uniform(20, 100), 2),
        })
