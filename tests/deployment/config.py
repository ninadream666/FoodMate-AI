"""
FoodMate-AI 云端部署测试 — 全局配置
"""

# 云端服务器地址
BASE_URL = "http://8.217.223.120"
APK_URL = "http://8.217.223.120:9099"

# 测试用户凭据（每次运行自动生成唯一用户名）
TEST_CUSTOMER_PASSWORD = "Test123456"
TEST_MERCHANT_PASSWORD = "Test123456"

# 性能测试参数
PERF_SEQUENTIAL_REQUESTS = 10       # 连续请求次数
PERF_CONCURRENT_REQUESTS = 10       # 并发请求次数
PERF_TIMEOUT = 30                   # 单次请求超时（秒）

# 响应时间阈值（秒）
THRESHOLDS = {
    "register": 2.0,
    "login": 2.0,
    "merchants_list": 1.0,
    "profile": 1.0,
    "create_order": 2.0,
    "pay_order": 10.0,
    "web_homepage": 1.0,
}
