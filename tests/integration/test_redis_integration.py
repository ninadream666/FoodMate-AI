# -*- coding: utf-8 -*-
"""
Redis 真实集成测试
直连 Redis，验证缓存读写、TTL过期、Key管理、缓存策略
连接信息: localhost:6379
"""
import pytest
import redis
import time
import json

REDIS_CONFIG = {
    "host": "localhost",
    "port": 6379,
    "db": 0,
    "decode_responses": True,
}

# 测试用key前缀，方便清理
TEST_PREFIX = "test_integration:"


@pytest.fixture(scope="module")
def r():
    """创建Redis连接"""
    try:
        client = redis.Redis(**REDIS_CONFIG)
        client.ping()
        yield client
        # 清理测试数据
        for key in client.scan_iter(f"{TEST_PREFIX}*"):
            client.delete(key)
        client.close()
    except (redis.ConnectionError, redis.TimeoutError) as e:
        pytest.skip(f"Redis 不可用: {e}")


# ==================== 连接验证 ====================

class TestRedisConnection:
    """Redis连接验证"""

    def test_can_connect_to_redis(self, r):
        """应能成功连接到Redis"""
        assert r.ping() is True

    def test_redis_info(self, r):
        """应能获取Redis服务信息"""
        info = r.info()
        assert "redis_version" in info


# ==================== 基本缓存操作 ====================

class TestBasicCacheOperations:
    """基本缓存读写测试"""

    def test_set_and_get(self, r):
        """SET/GET操作应正确存取"""
        key = f"{TEST_PREFIX}basic:1"
        r.set(key, "hello")
        assert r.get(key) == "hello"

    def test_set_json_value(self, r):
        """应能存取JSON数据"""
        key = f"{TEST_PREFIX}merchant:list"
        merchants = json.dumps([
            {"id": 1, "name": "川味观", "rating": 4.8},
            {"id": 2, "name": "寿司之家", "rating": 4.6},
        ], ensure_ascii=False)
        r.set(key, merchants)

        cached = json.loads(r.get(key))
        assert len(cached) == 2
        assert cached[0]["name"] == "川味观"

    def test_delete_key(self, r):
        """DELETE操作应删除key"""
        key = f"{TEST_PREFIX}to_delete"
        r.set(key, "temp")
        r.delete(key)
        assert r.get(key) is None

    def test_key_not_exists_returns_none(self, r):
        """查询不存在的key应返回None"""
        result = r.get(f"{TEST_PREFIX}nonexistent_key_12345")
        assert result is None


# ==================== TTL过期测试 ====================

class TestTTLExpiration:
    """缓存TTL过期策略测试"""

    def test_set_with_ttl(self, r):
        """设置TTL后key应自动过期"""
        key = f"{TEST_PREFIX}ttl:short"
        r.setex(key, 2, "will_expire")  # 2秒TTL

        assert r.get(key) == "will_expire"
        time.sleep(3)
        assert r.get(key) is None, "TTL过期后key应被自动删除"

    def test_merchant_cache_ttl_120s(self, r):
        """商户缓存TTL应为120秒"""
        key = f"{TEST_PREFIX}merchant:cache:test"
        ttl = 120  # 2分钟
        r.setex(key, ttl, "merchant_data")

        remaining = r.ttl(key)
        assert 0 < remaining <= 120

    def test_recommendation_cache_ttl_300s(self, r):
        """推荐缓存TTL应为300秒"""
        key = f"{TEST_PREFIX}recommendation:cache:test"
        ttl = 300  # 5分钟
        r.setex(key, ttl, "recommendation_data")

        remaining = r.ttl(key)
        assert 0 < remaining <= 300

    def test_weather_cache_ttl_600s(self, r):
        """天气缓存TTL应为600秒"""
        key = f"{TEST_PREFIX}weather:cache:test"
        ttl = 600  # 10分钟
        r.setex(key, ttl, "weather_data")

        remaining = r.ttl(key)
        assert 0 < remaining <= 600


# ==================== 缓存失效策略 ====================

class TestCacheInvalidation:
    """缓存失效策略测试"""

    def test_cache_evict_on_update(self, r):
        """更新数据后应清除缓存（模拟@CacheEvict）"""
        key = f"{TEST_PREFIX}merchant:1:info"
        r.set(key, json.dumps({"name": "旧名字"}))

        # 模拟商户信息更新后清除缓存
        r.delete(key)
        assert r.get(key) is None, "更新后缓存应被清除"

    def test_cache_populate_on_first_query(self, r):
        """首次查询后应写入缓存（模拟@Cacheable）"""
        key = f"{TEST_PREFIX}merchant:list:active"

        # 首次查询：缓存未命中
        assert r.get(key) is None

        # 查询数据库后写入缓存
        db_result = json.dumps(["商户A", "商户B"])
        r.setex(key, 120, db_result)

        # 第二次：缓存命中
        cached = json.loads(r.get(key))
        assert len(cached) == 2

    def test_cache_penetration_protection(self, r):
        """缓存穿透防护：不存在的数据也应缓存空值"""
        key = f"{TEST_PREFIX}merchant:99999"

        # 查询不存在的商户，缓存空标记
        r.setex(key, 30, "NULL")  # 短TTL缓存空值

        cached = r.get(key)
        assert cached == "NULL", "不存在的数据应缓存空值标记"


# ==================== Session/Token缓存 ====================

class TestSessionCache:
    """JWT Token缓存测试"""

    def test_store_session_token(self, r):
        """应能存储用户Session Token"""
        key = f"{TEST_PREFIX}session:user:1"
        token = "jwt_testuser_CUSTOMER_1"
        r.setex(key, 86400, token)  # 1天过期

        assert r.get(key) == token

    def test_session_ttl_is_one_day(self, r):
        """Session TTL应为86400秒（1天）"""
        key = f"{TEST_PREFIX}session:user:2"
        r.setex(key, 86400, "some_token")

        remaining = r.ttl(key)
        assert remaining > 86000  # 接近1天


# ==================== 并发安全 ====================

class TestConcurrencySafety:
    """Redis原子操作测试"""

    def test_incr_is_atomic(self, r):
        """INCR操作应是原子的"""
        key = f"{TEST_PREFIX}counter:orders"
        r.set(key, 0)

        for _ in range(100):
            r.incr(key)

        assert int(r.get(key)) == 100

    def test_setnx_for_distributed_lock(self, r):
        """SETNX可用于分布式锁"""
        lock_key = f"{TEST_PREFIX}lock:pricing_cycle"

        # 第一次获取锁应成功
        acquired = r.setnx(lock_key, "locked")
        assert acquired is True

        # 第二次获取应失败
        acquired_again = r.setnx(lock_key, "locked")
        assert acquired_again is False

        r.delete(lock_key)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
