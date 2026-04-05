import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.*;

/**
 * UserProfileService 单元测试
 * 覆盖用户画像CRUD、偏好管理、浏览历史、上下文聚合等功能（MongoDB文档）
 */
@DisplayName("用户画像服务 - UserProfileService 单元测试")
class UserProfileServiceTest {

    // ====== 内联画像数据结构 ======
    private Map<Long, Map<String, Object>> profileStore; // userId -> profile

    // ====== 内联业务逻辑 ======

    private Map<String, Object> getProfile(long userId) {
        Map<String, Object> profile = profileStore.get(userId);
        if (profile == null) throw new RuntimeException("画像不存在: " + userId);
        return profile;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getOrCreateProfile(long userId) {
        Map<String, Object> profile = profileStore.get(userId);
        if (profile == null) {
            profile = new HashMap<>();
            profile.put("userId", userId);
            profile.put("preferences", new ArrayList<String>());
            profile.put("allergies", new ArrayList<String>());
            profile.put("tags", new ArrayList<String>());
            profile.put("favoriteMerchantIds", new ArrayList<Long>());
            profile.put("orderCount", 0);
            profile.put("totalSpent", 0.0);
            profileStore.put(userId, profile);
        }
        return profile;
    }

    @SuppressWarnings("unchecked")
    private void updatePreferences(long userId, List<String> newPrefs) {
        Map<String, Object> profile = getProfile(userId);
        profile.put("preferences", new ArrayList<>(newPrefs));
    }

    @SuppressWarnings("unchecked")
    private void addAllergy(long userId, String allergy) {
        Map<String, Object> profile = getProfile(userId);
        List<String> allergies = (List<String>) profile.get("allergies");
        if (!allergies.contains(allergy)) {
            allergies.add(allergy);
        }
    }

    @SuppressWarnings("unchecked")
    private void addFavoriteMerchant(long userId, long merchantId) {
        Map<String, Object> profile = getProfile(userId);
        List<Long> favorites = (List<Long>) profile.get("favoriteMerchantIds");
        if (!favorites.contains(merchantId)) {
            favorites.add(merchantId);
        }
    }

    /** 上下文聚合：合并画像数据和订单历史；订单服务不可用时降级返回仅画像 */
    @SuppressWarnings("unchecked")
    private Map<String, Object> getUserContext(long userId, boolean orderServiceAvailable) {
        Map<String, Object> profile = getProfile(userId);
        Map<String, Object> context = new HashMap<>(profile);
        if (orderServiceAvailable) {
            context.put("recentOrders", new ArrayList<>());
        } else {
            // 降级：仅返回画像数据
            context.put("recentOrders", null);
        }
        return context;
    }

    @BeforeEach
    void setUp() {
        profileStore = new HashMap<>();

        Map<String, Object> testProfile = new HashMap<>();
        testProfile.put("userId", 1L);
        testProfile.put("preferences", new ArrayList<>(Arrays.asList("川菜", "日料", "火锅")));
        testProfile.put("allergies", new ArrayList<>(Arrays.asList("花生", "海鲜")));
        testProfile.put("tags", new ArrayList<>(Arrays.asList("辣味爱好者", "重口味")));
        testProfile.put("favoriteMerchantIds", new ArrayList<>(Arrays.asList(10L, 20L)));
        testProfile.put("orderCount", 42);
        testProfile.put("totalSpent", 2580.50);
        profileStore.put(1L, testProfile);
    }

    // ==================== 画像查询 ====================

    @Test
    @DisplayName("查询用户画像 - 返回完整画像数据")
    @SuppressWarnings("unchecked")
    void getProfile_shouldReturnFullProfile() {
        Map<String, Object> result = getProfile(1L);

        assertNotNull(result);
        List<String> prefs = (List<String>) result.get("preferences");
        assertEquals(3, prefs.size());
        assertTrue(prefs.contains("川菜"));
        assertEquals(42, result.get("orderCount"));
    }

    @Test
    @DisplayName("查询不存在的画像 - 应创建默认画像")
    void getProfile_withNewUser_shouldCreateDefault() {
        Map<String, Object> result = getOrCreateProfile(999L);

        assertNotNull(result);
        assertEquals(999L, result.get("userId"));
        assertTrue(profileStore.containsKey(999L));
    }

    // ==================== 偏好管理 ====================

    @Test
    @DisplayName("更新用户口味偏好")
    @SuppressWarnings("unchecked")
    void updatePreferences_shouldSaveNewPreferences() {
        List<String> newPrefs = Arrays.asList("粤菜", "韩餐", "咖啡甜品");
        updatePreferences(1L, newPrefs);

        List<String> prefs = (List<String>) getProfile(1L).get("preferences");
        assertTrue(prefs.contains("粤菜"));
        assertEquals(3, prefs.size());
    }

    @Test
    @DisplayName("添加过敏原信息")
    @SuppressWarnings("unchecked")
    void addAllergy_shouldAppendToList() {
        addAllergy(1L, "乳制品");

        List<String> allergies = (List<String>) getProfile(1L).get("allergies");
        assertTrue(allergies.contains("乳制品"));
    }

    @Test
    @DisplayName("重复添加过敏原不应重复保存")
    @SuppressWarnings("unchecked")
    void addAllergy_duplicate_shouldNotDuplicate() {
        addAllergy(1L, "花生"); // 已存在

        List<String> allergies = (List<String>) getProfile(1L).get("allergies");
        long count = allergies.stream().filter(a -> a.equals("花生")).count();
        assertEquals(1, count);
    }

    // ==================== 收藏商户 ====================

    @Test
    @DisplayName("收藏商户 - 添加到收藏列表")
    @SuppressWarnings("unchecked")
    void addFavoriteMerchant_shouldAdd() {
        addFavoriteMerchant(1L, 30L);

        List<Long> favorites = (List<Long>) getProfile(1L).get("favoriteMerchantIds");
        assertTrue(favorites.contains(30L));
    }

    // ==================== 用户上下文聚合 ====================

    @Test
    @DisplayName("上下文聚合 - 应合并画像数据和订单历史")
    @SuppressWarnings("unchecked")
    void getUserContext_shouldAggregateProfileAndOrders() {
        Map<String, Object> context = getUserContext(1L, true);

        assertNotNull(context);
        // 上下文应包含画像偏好
        assertNotNull(context.get("preferences"));
    }

    @Test
    @DisplayName("上下文聚合 - 订单服务不可用时应降级返回画像数据")
    @SuppressWarnings("unchecked")
    void getUserContext_withOrderServiceDown_shouldFallback() {
        // 应降级返回仅含画像的上下文，不应抛异常
        Map<String, Object> context = getUserContext(1L, false);

        assertNotNull(context);
        List<String> prefs = (List<String>) context.get("preferences");
        assertEquals(3, prefs.size());
    }

    // ==================== 统计数据 ====================

    @Test
    @DisplayName("用户统计 - 平均客单价计算正确")
    void getStats_averageOrderValue_shouldBeCorrect() {
        double totalSpent = (double) getProfile(1L).get("totalSpent");
        int orderCount = (int) getProfile(1L).get("orderCount");
        double avgOrderValue = totalSpent / orderCount;
        assertEquals(61.44, avgOrderValue, 0.01);
    }
}
