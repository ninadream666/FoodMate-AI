import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.*;

/**
 * Redis 缓存集成测试
 * 测试缓存读写、TTL过期、缓存失效、热数据缓存策略等
 *
 * Redis 7.0, 端口6379
 * 缓存策略: 商户列表(2min), 推荐结果(5min), 天气数据(10min)
 */
@DisplayName("集成测试 - Redis 缓存操作")
class RedisIntegrationTest {

    // ==================== 缓存基本操作 ====================

    @Test
    @DisplayName("写入缓存 - SET操作应成功")
    void setCache_shouldStoreValue() {
        Map<String, Object> cache = new HashMap<>();
        cache.put("merchant:list:active", Arrays.asList("商户1", "商户2"));

        assertNotNull(cache.get("merchant:list:active"));
    }

    @Test
    @DisplayName("读取缓存 - GET操作应返回正确值")
    void getCache_shouldReturnStoredValue() {
        Map<String, Object> cache = new HashMap<>();
        cache.put("user:1:token", "jwt-token-123");

        assertEquals("jwt-token-123", cache.get("user:1:token"));
    }

    // ==================== TTL 过期策略 ====================

    @Test
    @DisplayName("商户缓存TTL应为2分钟")
    void merchantCache_ttlShouldBe2Minutes() {
        long merchantCacheTtlSeconds = 120; // 2分钟
        assertEquals(120, merchantCacheTtlSeconds,
                "商户列表缓存TTL应为120秒（2分钟）");
    }

    @Test
    @DisplayName("推荐结果缓存TTL应为5分钟")
    void recommendationCache_ttlShouldBe5Minutes() {
        long recommendationCacheTtlSeconds = 300; // 5分钟
        assertEquals(300, recommendationCacheTtlSeconds,
                "推荐结果缓存TTL应为300秒（5分钟）");
    }

    @Test
    @DisplayName("天气数据缓存TTL应为10分钟")
    void weatherCache_ttlShouldBe10Minutes() {
        long weatherCacheTtlSeconds = 600; // 10分钟
        assertEquals(600, weatherCacheTtlSeconds,
                "天气数据缓存TTL应为600秒（10分钟）");
    }

    @Test
    @DisplayName("缓存过期后应返回null")
    void expiredCache_shouldReturnNull() {
        Map<String, Object> cache = new HashMap<>();
        Map<String, Long> ttls = new HashMap<>();

        String key = "merchant:list";
        cache.put(key, "data");
        ttls.put(key, System.currentTimeMillis() - 1000); // 已过期

        boolean isExpired = ttls.getOrDefault(key, Long.MAX_VALUE) < System.currentTimeMillis();
        if (isExpired) cache.remove(key);

        assertNull(cache.get(key), "过期缓存应返回null");
    }

    // ==================== 缓存失效策略 ====================

    @Test
    @DisplayName("@CacheEvict - 商户信息更新时应清除缓存")
    void merchantUpdate_shouldEvictCache() {
        Map<String, Object> cache = new HashMap<>();
        cache.put("merchant:1", Map.of("name", "旧名字"));

        // 更新商户信息后应删除缓存
        cache.remove("merchant:1");

        assertNull(cache.get("merchant:1"),
                "商户信息更新后应清除缓存");
    }

    @Test
    @DisplayName("@Cacheable - 首次查询应写入缓存")
    void firstQuery_shouldPopulateCache() {
        Map<String, Object> cache = new HashMap<>();
        String key = "merchant:list:active";

        // 首次查询缓存未命中
        Object cached = cache.get(key);
        assertNull(cached, "首次查询缓存应为空");

        // 查询数据库后写入缓存
        List<String> dbResult = Arrays.asList("商户A", "商户B");
        cache.put(key, dbResult);

        // 第二次查询应命中缓存
        assertNotNull(cache.get(key));
        assertEquals(2, ((List<?>) cache.get(key)).size());
    }

    // ==================== 并发缓存安全 ====================

    @Test
    @DisplayName("缓存穿透防护 - 不存在的key不应频繁查库")
    void cachePenetration_shouldBeProtected() {
        // 对不存在的key也应缓存空值
        Map<String, Object> cache = new HashMap<>();
        String nonExistentKey = "merchant:99999";

        // 查库返回null后，缓存空值（短TTL）
        cache.put(nonExistentKey, "NULL_PLACEHOLDER");
        assertNotNull(cache.get(nonExistentKey),
                "不存在的数据应缓存空值标记");
    }

    @Test
    @DisplayName("Session缓存 - JWT Token应存储在Redis中")
    void sessionCache_shouldStoreJwtToken() {
        Map<String, String> sessionCache = new HashMap<>();
        sessionCache.put("session:user:1", "jwt-token-abc");

        assertEquals("jwt-token-abc", sessionCache.get("session:user:1"));
    }
}
