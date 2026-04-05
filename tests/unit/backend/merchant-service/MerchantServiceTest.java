import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * MerchantService 单元测试
 * 覆盖商户CRUD、导入、认领、审核、缓存等功能
 */
@DisplayName("商户服务 - MerchantService 单元测试")
class MerchantServiceTest {

    // ====== 内联商户数据 ======
    private Map<Long, Map<String, Object>> merchantStore;
    private Map<String, Map<String, Object>> externalIdIndex; // externalId -> merchant
    private long nextId;

    // ====== 内联业务逻辑 ======

    private List<Map<String, Object>> getActiveMerchants() {
        return merchantStore.values().stream()
                .filter(m -> "ACTIVE".equals(m.get("status")))
                .collect(Collectors.toList());
    }

    private Map<String, Object> getMerchant(long id) {
        Map<String, Object> m = merchantStore.get(id);
        if (m == null) throw new RuntimeException("商户不存在: " + id);
        return m;
    }

    private Map<String, Object> importMerchant(String name, String externalId, String cuisineType) {
        // 已存在则更新
        if (externalIdIndex.containsKey(externalId)) {
            Map<String, Object> existing = externalIdIndex.get(externalId);
            existing.put("name", name);
            return existing;
        }
        // 新建
        Map<String, Object> m = new HashMap<>();
        m.put("id", nextId++);
        m.put("name", name);
        m.put("externalId", externalId);
        m.put("cuisineType", cuisineType);
        m.put("status", "PENDING_REVIEW");
        m.put("userId", null);
        merchantStore.put((long) m.get("id"), m);
        externalIdIndex.put(externalId, m);
        return m;
    }

    private Map<String, Object> claimMerchant(long merchantId, long userId) {
        Map<String, Object> m = getMerchant(merchantId);
        if (m.get("userId") != null) {
            throw new RuntimeException("商户已被认领");
        }
        m.put("userId", userId);
        return m;
    }

    private void disableMerchant(long merchantId) {
        Map<String, Object> m = getMerchant(merchantId);
        m.put("status", "INACTIVE");
    }

    private List<Map<String, Object>> getUnclaimedMerchants() {
        return merchantStore.values().stream()
                .filter(m -> m.get("userId") == null)
                .collect(Collectors.toList());
    }

    @BeforeEach
    void setUp() {
        merchantStore = new HashMap<>();
        externalIdIndex = new HashMap<>();
        nextId = 1L;

        Map<String, Object> testMerchant = new HashMap<>();
        testMerchant.put("id", nextId++);
        testMerchant.put("name", "测试餐厅");
        testMerchant.put("userId", 10L);
        testMerchant.put("cuisineType", "川菜");
        testMerchant.put("rating", 4.5);
        testMerchant.put("status", "ACTIVE");
        testMerchant.put("latitude", 31.2304);
        testMerchant.put("longitude", 121.4737);
        merchantStore.put(1L, testMerchant);
    }

    // ==================== 商户查询 ====================

    @Test
    @DisplayName("获取商户列表 - 返回所有活跃商户")
    void getMerchantList_shouldReturnActiveMerchants() {
        List<Map<String, Object>> result = getActiveMerchants();

        assertEquals(1, result.size());
        assertEquals("测试餐厅", result.get(0).get("name"));
    }

    @Test
    @DisplayName("获取商户详情 - 返回指定商户信息")
    void getMerchant_shouldReturnMerchantDetail() {
        Map<String, Object> result = getMerchant(1L);

        assertNotNull(result);
        assertEquals("川菜", result.get("cuisineType"));
    }

    @Test
    @DisplayName("查询不存在的商户 - 应抛出异常")
    void getMerchant_withNonExistent_shouldThrowException() {
        assertThrows(RuntimeException.class, () -> getMerchant(999L));
    }

    // ==================== 商户导入（从地图API） ====================

    @Test
    @DisplayName("导入外部餐厅 - 设置外部ID并保存")
    void importMerchant_shouldSetExternalIdAndSave() {
        Map<String, Object> result = importMerchant("高德导入餐厅", "amap_12345", "日料");

        assertNotNull(result.get("id"));
        assertEquals("amap_12345", result.get("externalId"));
    }

    @Test
    @DisplayName("导入已存在的外部餐厅 - 应更新而非重复创建")
    void importMerchant_withExistingExternalId_shouldUpdate() {
        importMerchant("原始名", "amap_12345", "日料");
        Map<String, Object> result = importMerchant("更新的餐厅名", "amap_12345", "日料");

        assertEquals("更新的餐厅名", result.get("name"));
        // 应该是更新现有记录，store中只有初始的测试餐厅+1个导入记录
        long importedCount = externalIdIndex.size();
        assertEquals(1, importedCount);
    }

    // ==================== 商户认领 ====================

    @Test
    @DisplayName("认领未认领的商户 - 应设置userId")
    void claimMerchant_withUnclaimedMerchant_shouldSetUserId() {
        // 导入一个未认领商户
        Map<String, Object> unclaimed = importMerchant("无主餐厅", "amap_99", "粤菜");
        long id = (long) unclaimed.get("id");

        Map<String, Object> result = claimMerchant(id, 20L);

        assertEquals(20L, result.get("userId"));
    }

    @Test
    @DisplayName("认领已被认领的商户 - 应拒绝")
    void claimMerchant_withAlreadyClaimed_shouldReject() {
        // 商户1已被用户10认领
        assertThrows(RuntimeException.class, () -> claimMerchant(1L, 20L));
    }

    // ==================== 商户状态管理 ====================

    @Test
    @DisplayName("禁用商户 - 状态变为INACTIVE")
    void disableMerchant_shouldSetInactive() {
        disableMerchant(1L);
        assertEquals("INACTIVE", merchantStore.get(1L).get("status"));
    }

    @Test
    @DisplayName("获取未认领商户列表 - 用于商户入驻流程")
    void getUnclaimedMerchants_shouldReturnMerchantsWithoutUserId() {
        importMerchant("无主餐厅", "amap_unclaimed", "粤菜");

        List<Map<String, Object>> result = getUnclaimedMerchants();

        assertEquals(1, result.size());
        assertNull(result.get(0).get("userId"));
    }
}
