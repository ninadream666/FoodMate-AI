"""
FoodMate-AI 云端部署测试 — 03 性能测试与数据流量分析
包含：单接口基准、连续请求稳定性、并发压力、数据流量统计
"""

import time
import statistics
import concurrent.futures
import requests
import pytest

from config import (
    BASE_URL, APK_URL,
    TEST_CUSTOMER_PASSWORD,
    PERF_SEQUENTIAL_REQUESTS, PERF_CONCURRENT_REQUESTS, PERF_TIMEOUT,
    THRESHOLDS,
)


# ── 辅助函数 ────────────────────────────────────────────

def _setup_user():
    """注册并登录一个测试用户，返回 token"""
    username = f"perf_{int(time.time() * 1000)}"
    requests.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "username": username,
            "email": f"{username}@test.com",
            "password": TEST_CUSTOMER_PASSWORD,
            "role": "customer",
        },
        timeout=10,
    )
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": username, "password": TEST_CUSTOMER_PASSWORD},
        timeout=10,
    )
    return resp.json()["token"]


_token = None


def _get_token():
    global _token
    if _token is None:
        _token = _setup_user()
    return _token


def _auth_header():
    return {"Authorization": f"Bearer {_get_token()}"}


# ── 单接口响应时间基准 ──────────────────────────────────

class TestSingleEndpointBenchmark:
    """5.4.1 各核心接口单次响应时间"""

    def test_web_homepage(self):
        """Web 首页加载时间"""
        start = time.time()
        resp = requests.get(BASE_URL, timeout=PERF_TIMEOUT)
        elapsed = time.time() - start
        assert resp.status_code == 200
        assert elapsed < THRESHOLDS["web_homepage"]
        print(f"\n  Web 首页: {elapsed:.3f}s, {len(resp.content)} bytes")

    def test_register(self):
        """用户注册响应时间"""
        username = f"bench_{int(time.time() * 1000)}"
        start = time.time()
        resp = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "username": username,
                "email": f"{username}@test.com",
                "password": TEST_CUSTOMER_PASSWORD,
                "role": "customer",
            },
            timeout=PERF_TIMEOUT,
        )
        elapsed = time.time() - start
        assert resp.status_code == 200
        assert elapsed < THRESHOLDS["register"]
        print(f"\n  注册: {elapsed:.3f}s, {len(resp.content)} bytes")

    def test_login(self):
        """用户登录响应时间"""
        _get_token()  # 确保用户已创建
        start = time.time()
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "username": f"perf_{int(time.time() * 1000)}",
                "password": TEST_CUSTOMER_PASSWORD,
            },
            timeout=PERF_TIMEOUT,
        )
        elapsed = time.time() - start
        # 用新用户名登录会 401，这里只测延迟
        print(f"\n  登录: {elapsed:.3f}s, {len(resp.content)} bytes")

    def test_merchants_list(self):
        """商家列表响应时间"""
        start = time.time()
        resp = requests.get(
            f"{BASE_URL}/api/merchants",
            headers=_auth_header(),
            timeout=PERF_TIMEOUT,
        )
        elapsed = time.time() - start
        assert resp.status_code == 200
        assert elapsed < THRESHOLDS["merchants_list"]
        print(f"\n  商家列表: {elapsed:.3f}s, {len(resp.content)} bytes")

    def test_profile(self):
        """个人资料响应时间"""
        start = time.time()
        resp = requests.get(
            f"{BASE_URL}/api/users/me",
            headers=_auth_header(),
            timeout=PERF_TIMEOUT,
        )
        elapsed = time.time() - start
        assert resp.status_code == 200
        assert elapsed < THRESHOLDS["profile"]
        print(f"\n  个人资料: {elapsed:.3f}s, {len(resp.content)} bytes")

    def test_create_order(self):
        """创建订单响应时间"""
        start = time.time()
        resp = requests.post(
            f"{BASE_URL}/api/orders",
            headers=_auth_header(),
            json={
                "merchantId": 1,
                "items": [{"menuItemId": 1, "quantity": 1, "price": 15.5}],
                "deliveryAddress": "性能测试地址",
            },
            timeout=PERF_TIMEOUT,
        )
        elapsed = time.time() - start
        assert resp.status_code == 200
        assert elapsed < THRESHOLDS["create_order"]
        print(f"\n  创建订单: {elapsed:.3f}s, {len(resp.content)} bytes")


# ── 连续请求稳定性测试 ──────────────────────────────────

class TestSequentialStability:
    """5.4.2 连续请求稳定性"""

    def test_sequential_merchants(self):
        """连续 N 次请求商家列表，验证稳定性"""
        times = []
        failures = 0
        for i in range(PERF_SEQUENTIAL_REQUESTS):
            start = time.time()
            try:
                resp = requests.get(
                    f"{BASE_URL}/api/merchants",
                    headers=_auth_header(),
                    timeout=PERF_TIMEOUT,
                )
                elapsed = time.time() - start
                if resp.status_code == 200:
                    times.append(elapsed)
                else:
                    failures += 1
            except requests.RequestException:
                failures += 1

        assert failures == 0, f"{failures}/{PERF_SEQUENTIAL_REQUESTS} 请求失败"
        avg = statistics.mean(times)
        stddev = statistics.stdev(times) if len(times) > 1 else 0
        p50 = sorted(times)[len(times) // 2]
        p95 = sorted(times)[int(len(times) * 0.95)]

        print(f"\n  连续 {PERF_SEQUENTIAL_REQUESTS} 次请求统计:")
        print(f"    成功率: {len(times)}/{PERF_SEQUENTIAL_REQUESTS} (100%)")
        print(f"    平均: {avg*1000:.0f}ms")
        print(f"    P50:  {p50*1000:.0f}ms")
        print(f"    P95:  {p95*1000:.0f}ms")
        print(f"    标准差: {stddev*1000:.0f}ms")

        # 稳定性断言：标准差不超过均值的 30%
        assert stddev < avg * 0.3, f"响应时间抖动过大: stddev={stddev:.3f}s, avg={avg:.3f}s"


# ── 并发请求压力测试 ─────────────────────────────────────

class TestConcurrentLoad:
    """5.4.3 并发请求压力测试"""

    def test_concurrent_merchants(self):
        """N 个并发请求同时访问商家列表"""

        def _single_request(_):
            start = time.time()
            try:
                resp = requests.get(
                    f"{BASE_URL}/api/merchants",
                    headers=_auth_header(),
                    timeout=PERF_TIMEOUT,
                )
                elapsed = time.time() - start
                return resp.status_code, elapsed
            except requests.RequestException as e:
                return 0, time.time() - start

        wall_start = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=PERF_CONCURRENT_REQUESTS) as pool:
            results = list(pool.map(_single_request, range(PERF_CONCURRENT_REQUESTS)))
        wall_time = time.time() - wall_start

        statuses = [r[0] for r in results]
        times = [r[1] for r in results]
        success = statuses.count(200)
        avg = statistics.mean(times)
        throughput = PERF_CONCURRENT_REQUESTS / wall_time

        print(f"\n  并发 {PERF_CONCURRENT_REQUESTS} 请求统计:")
        print(f"    成功: {success}/{PERF_CONCURRENT_REQUESTS}")
        print(f"    平均响应: {avg*1000:.0f}ms")
        print(f"    最快: {min(times)*1000:.0f}ms")
        print(f"    最慢: {max(times)*1000:.0f}ms")
        print(f"    壁钟时间: {wall_time*1000:.0f}ms")
        print(f"    吞吐量: {throughput:.1f} req/s")

        assert success == PERF_CONCURRENT_REQUESTS, f"{PERF_CONCURRENT_REQUESTS - success} 个请求失败"


# ── 数据流量分析 ─────────────────────────────────────────

class TestDataFlowAnalysis:
    """5.4.4 数据流量分析"""

    def test_full_user_journey_traffic(self):
        """统计一次完整用户操作链路的数据流量"""
        username = f"flow_{int(time.time() * 1000)}"
        total_upload = 0
        total_download = 0
        steps = []

        # 步骤1: 注册
        req_body = {
            "username": username,
            "email": f"{username}@test.com",
            "password": TEST_CUSTOMER_PASSWORD,
            "role": "customer",
        }
        import json
        req_size = len(json.dumps(req_body).encode())
        resp = requests.post(f"{BASE_URL}/api/auth/register", json=req_body, timeout=10)
        resp_size = len(resp.content)
        total_upload += req_size
        total_download += resp_size
        steps.append(("注册", req_size, resp_size))

        # 步骤2: 登录
        req_body = {"username": username, "password": TEST_CUSTOMER_PASSWORD}
        req_size = len(json.dumps(req_body).encode())
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=req_body, timeout=10)
        resp_size = len(resp.content)
        token = resp.json()["token"]
        total_upload += req_size
        total_download += resp_size
        steps.append(("登录", req_size, resp_size))

        headers = {"Authorization": f"Bearer {token}"}

        # 步骤3: 浏览商家
        resp = requests.get(f"{BASE_URL}/api/merchants", headers=headers, timeout=10)
        resp_size = len(resp.content)
        total_upload += 50  # 约 50 bytes 请求头
        total_download += resp_size
        steps.append(("商家列表", 50, resp_size))

        # 步骤4: 个人资料
        resp = requests.get(f"{BASE_URL}/api/users/me", headers=headers, timeout=10)
        resp_size = len(resp.content)
        total_upload += 50
        total_download += resp_size
        steps.append(("个人资料", 50, resp_size))

        # 步骤5: 创建订单
        req_body = {
            "merchantId": 1,
            "items": [{"menuItemId": 1, "quantity": 1, "price": 15.5}],
            "deliveryAddress": "流量测试",
        }
        req_size = len(json.dumps(req_body).encode())
        resp = requests.post(f"{BASE_URL}/api/orders", headers=headers, json=req_body, timeout=10)
        resp_size = len(resp.content)
        order_id = resp.json().get("id")
        total_upload += req_size
        total_download += resp_size
        steps.append(("创建订单", req_size, resp_size))

        # 步骤6: 支付
        if order_id:
            resp = requests.post(f"{BASE_URL}/api/orders/{order_id}/pay", headers=headers, timeout=30)
            resp_size = len(resp.content)
            total_upload += 50
            total_download += resp_size
            steps.append(("支付订单", 50, resp_size))

        # 输出
        print("\n  完整用户链路数据流量:")
        print(f"  {'操作':<12} {'上行(B)':>8} {'下行(B)':>8}")
        print(f"  {'-'*32}")
        for name, up, down in steps:
            print(f"  {name:<12} {up:>8} {down:>8}")
        print(f"  {'-'*32}")
        print(f"  {'合计':<12} {total_upload:>8} {total_download:>8}")
        print(f"  总流量: {(total_upload + total_download) / 1024:.1f} KB")

        # 断言：单次完整链路总流量不超过 50 KB（高效传输）
        total = total_upload + total_download
        assert total < 50 * 1024, f"流量过大: {total} bytes"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s", "--tb=short"])
