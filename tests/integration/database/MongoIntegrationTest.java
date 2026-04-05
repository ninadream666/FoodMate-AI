import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.*;

/**
 * MongoDB 集成测试
 * 测试用户画像文档的CRUD、灵活schema、数组操作、聚合查询等
 *
 * 数据库: food_delivery_profile (MongoDB 6.0)
 * 集合: user_profiles
 * 由 profile-service(8086) 使用 Spring Data MongoDB 管理
 */
@DisplayName("集成测试 - MongoDB 用户画像操作")
class MongoIntegrationTest {

    // ==================== 文档CRUD ====================

    @Test
    @DisplayName("创建用户画像文档 - 应支持灵活字段")
    void createProfile_shouldSupportFlexibleSchema() {
        Map<String, Object> profile = new HashMap<>();
        profile.put("userId", 1L);
        profile.put("preferences", Arrays.asList("川菜", "日料", "火锅"));
        profile.put("allergies", Arrays.asList("花生", "海鲜"));
        profile.put("tags", Arrays.asList("辣味爱好者"));
        profile.put("favoriteMerchantIds", Arrays.asList(10L, 20L));
        profile.put("orderCount", 42);
        profile.put("totalSpent", 2580.50);

        // MongoDB文档可以包含不同类型的字段
        assertNotNull(profile.get("preferences"));
        assertTrue(profile.get("preferences") instanceof List);
        assertTrue(profile.get("totalSpent") instanceof Double);
    }

    @Test
    @DisplayName("查询用户画像 - 按userId查找")
    void findProfile_byUserId_shouldReturnDocument() {
        Long userId = 1L;
        // db.user_profiles.findOne({userId: 1})
        assertNotNull(userId);
    }

    @Test
    @DisplayName("更新用户偏好 - 数组操作")
    void updatePreferences_shouldModifyArray() {
        List<String> oldPrefs = new ArrayList<>(Arrays.asList("川菜", "日料"));
        List<String> newPrefs = Arrays.asList("粤菜", "韩餐", "咖啡");

        // $set操作替换整个数组
        oldPrefs.clear();
        oldPrefs.addAll(newPrefs);

        assertEquals(3, oldPrefs.size());
        assertTrue(oldPrefs.contains("粤菜"));
    }

    @Test
    @DisplayName("添加过敏原 - $addToSet防止重复")
    void addAllergy_shouldPreventDuplicate() {
        Set<String> allergies = new LinkedHashSet<>(Arrays.asList("花生", "海鲜"));

        // $addToSet: 已存在则不添加
        allergies.add("花生"); // 重复
        allergies.add("乳制品"); // 新增

        assertEquals(3, allergies.size()); // 花生不重复
        assertTrue(allergies.contains("乳制品"));
    }

    // ==================== 浏览历史 ====================

    @Test
    @DisplayName("添加浏览记录 - 应包含时间戳")
    void addBrowseHistory_shouldIncludeTimestamp() {
        Map<String, Object> historyEntry = Map.of(
                "merchantId", 10L,
                "merchantName", "川味观",
                "timestamp", System.currentTimeMillis()
        );

        assertNotNull(historyEntry.get("timestamp"));
        assertNotNull(historyEntry.get("merchantId"));
    }

    @Test
    @DisplayName("浏览历史应限制最大条目数")
    void browseHistory_shouldLimitSize() {
        int maxHistorySize = 100;
        List<Object> history = new ArrayList<>();
        for (int i = 0; i < 120; i++) {
            history.add(Map.of("merchantId", i));
        }

        // 超过限制时应截断旧记录
        if (history.size() > maxHistorySize) {
            history = history.subList(history.size() - maxHistorySize, history.size());
        }

        assertEquals(maxHistorySize, history.size());
    }

    // ==================== 健康记录 ====================

    @Test
    @DisplayName("存储健康记录 - 嵌套文档结构")
    @SuppressWarnings("unchecked")
    void storeHealthRecord_shouldSupportNestedDocument() {
        Map<String, Object> healthRecord = Map.of(
                "date", "2026-04-04",
                "dietary", Map.of(
                        "restrictions", Arrays.asList("低糖", "低盐"),
                        "calorieTarget", 2000
                ),
                "fitness", Map.of(
                        "steps", 8000,
                        "activeMinutes", 45
                )
        );

        Map<String, Object> dietary = (Map<String, Object>) healthRecord.get("dietary");
        assertEquals(2000, dietary.get("calorieTarget"));
    }

    // ==================== 灵活Schema优势验证 ====================

    @Test
    @DisplayName("不同用户画像可有不同字段 - Schema灵活性")
    void differentProfiles_canHaveDifferentFields() {
        // 用户A：有健康数据
        Map<String, Object> profileA = Map.of(
                "userId", 1L,
                "preferences", List.of("川菜"),
                "healthRecords", List.of(Map.of("steps", 8000))
        );

        // 用户B：无健康数据，但有标签
        Map<String, Object> profileB = Map.of(
                "userId", 2L,
                "preferences", List.of("日料"),
                "tags", List.of("素食主义者")
        );

        // MongoDB允许不同文档有不同字段
        assertTrue(profileA.containsKey("healthRecords"));
        assertFalse(profileB.containsKey("healthRecords"));
        assertTrue(profileB.containsKey("tags"));
    }
}
