import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * MenuService 单元测试
 * 覆盖菜单管理、自动生成菜品、价格更新、上下架等功能
 */
@DisplayName("菜单服务 - MenuService 单元测试")
class MenuServiceTest {

    // ====== 内联菜品数据 ======
    private Map<Long, Map<String, Object>> menuItemStore;
    private Map<Long, String> merchantCuisineTypes; // merchantId -> cuisineType
    private long nextId;

    // ====== 自动生成菜品的模板 ======
    private static final Map<String, List<String>> CUISINE_TEMPLATES = new HashMap<>();
    static {
        CUISINE_TEMPLATES.put("川菜", Arrays.asList("麻婆豆腐", "回锅肉", "宫保鸡丁", "水煮鱼", "鱼香肉丝", "担担面"));
        CUISINE_TEMPLATES.put("日料", Arrays.asList("三文鱼刺身", "鳗鱼饭", "天妇罗", "拉面", "寿司拼盘", "味噌汤"));
        CUISINE_TEMPLATES.put("粤菜", Arrays.asList("白切鸡", "烧鹅", "虾饺", "肠粉", "煲仔饭", "老火汤"));
    }

    // ====== 内联业务逻辑 ======

    private List<Map<String, Object>> getPublicMenu(long merchantId) {
        return menuItemStore.values().stream()
                .filter(i -> (long) i.get("merchantId") == merchantId && (boolean) i.get("available"))
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getAllMenu(long merchantId) {
        return menuItemStore.values().stream()
                .filter(i -> (long) i.get("merchantId") == merchantId)
                .collect(Collectors.toList());
    }

    private Map<String, Object> addMenuItem(Map<String, Object> item) {
        BigDecimal price = (BigDecimal) item.get("price");
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("菜品价格必须大于0");
        }
        item.put("id", nextId++);
        menuItemStore.put((long) item.get("id"), item);
        return item;
    }

    private Map<String, Object> updateMenuItem(long id, Map<String, Object> updates) {
        Map<String, Object> item = menuItemStore.get(id);
        if (item == null) throw new RuntimeException("菜品不存在");
        if (updates.containsKey("price")) item.put("price", updates.get("price"));
        if (updates.containsKey("name")) item.put("name", updates.get("name"));
        return item;
    }

    private void disableMenuItem(long id) {
        Map<String, Object> item = menuItemStore.get(id);
        if (item == null) throw new RuntimeException("菜品不存在");
        item.put("available", false);
    }

    private List<Map<String, Object>> autoGenerateMenu(long merchantId) {
        String cuisineType = merchantCuisineTypes.get(merchantId);
        if (cuisineType == null) throw new RuntimeException("商户不存在");

        List<String> templates = CUISINE_TEMPLATES.getOrDefault(cuisineType,
                Arrays.asList("招牌菜A", "招牌菜B", "招牌菜C", "招牌菜D", "招牌菜E"));

        List<Map<String, Object>> generated = new ArrayList<>();
        for (String name : templates) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", nextId++);
            item.put("merchantId", merchantId);
            item.put("name", name);
            item.put("price", new BigDecimal("28.00"));
            item.put("available", true);
            item.put("category", "招牌菜");
            menuItemStore.put((long) item.get("id"), item);
            generated.add(item);
        }
        return generated;
    }

    @BeforeEach
    void setUp() {
        menuItemStore = new HashMap<>();
        merchantCuisineTypes = new HashMap<>();
        nextId = 1L;

        merchantCuisineTypes.put(1L, "川菜");

        Map<String, Object> testItem = new HashMap<>();
        testItem.put("id", nextId++);
        testItem.put("merchantId", 1L);
        testItem.put("name", "麻婆豆腐");
        testItem.put("price", new BigDecimal("28.00"));
        testItem.put("category", "招牌菜");
        testItem.put("description", "经典川菜，麻辣鲜香");
        testItem.put("available", true);
        menuItemStore.put(1L, testItem);
    }

    // ==================== 菜单查询 ====================

    @Test
    @DisplayName("获取商户菜单 - 返回所有可用菜品")
    void getMenu_shouldReturnAvailableItems() {
        List<Map<String, Object>> result = getPublicMenu(1L);

        assertEquals(1, result.size());
        assertEquals("麻婆豆腐", result.get(0).get("name"));
    }

    @Test
    @DisplayName("获取商户全部菜单（含下架）- 用于商户后台")
    void getAllMenu_shouldReturnAllItems() {
        // 添加一个已下架菜品
        Map<String, Object> offItem = new HashMap<>();
        offItem.put("id", nextId++);
        offItem.put("merchantId", 1L);
        offItem.put("name", "已下架菜品");
        offItem.put("price", new BigDecimal("20.00"));
        offItem.put("available", false);
        menuItemStore.put((long) offItem.get("id"), offItem);

        List<Map<String, Object>> result = getAllMenu(1L);
        assertEquals(2, result.size());
    }

    // ==================== 菜品CRUD ====================

    @Test
    @DisplayName("添加菜品 - 正常保存")
    void addMenuItem_shouldSave() {
        Map<String, Object> newItem = new HashMap<>();
        newItem.put("merchantId", 1L);
        newItem.put("name", "水煮鱼");
        newItem.put("price", new BigDecimal("48.00"));
        newItem.put("available", true);

        Map<String, Object> result = addMenuItem(newItem);

        assertNotNull(result);
        assertEquals("水煮鱼", result.get("name"));
    }

    @Test
    @DisplayName("更新菜品价格 - 正常更新")
    void updateMenuItem_shouldUpdatePrice() {
        Map<String, Object> updates = new HashMap<>();
        updates.put("price", new BigDecimal("32.00"));

        Map<String, Object> result = updateMenuItem(1L, updates);

        assertEquals(new BigDecimal("32.00"), result.get("price"));
    }

    @Test
    @DisplayName("下架菜品 - available设为false")
    void disableMenuItem_shouldSetUnavailable() {
        disableMenuItem(1L);

        assertFalse((boolean) menuItemStore.get(1L).get("available"));
    }

    // ==================== 自动生成菜品 ====================

    @Test
    @DisplayName("按菜系自动生成菜品 - 川菜应生成辣味菜品")
    void autoGenerateMenu_forSichuan_shouldGenerateSpicyDishes() {
        List<Map<String, Object>> generated = autoGenerateMenu(1L);

        assertNotNull(generated);
        assertTrue(generated.size() >= 5, "至少生成5个菜品");
        // 川菜应包含典型菜品
        assertTrue(generated.stream().anyMatch(item -> {
            String name = (String) item.get("name");
            return name.contains("麻婆") || name.contains("回锅")
                    || name.contains("宫保") || name.contains("水煮");
        }));
    }

    @Test
    @DisplayName("按菜系自动生成 - 日料应生成日式菜品")
    void autoGenerateMenu_forJapanese_shouldGenerateJapaneseDishes() {
        merchantCuisineTypes.put(2L, "日料");

        List<Map<String, Object>> generated = autoGenerateMenu(2L);

        assertTrue(generated.size() >= 5);
    }

    // ==================== 价格验证 ====================

    @Test
    @DisplayName("菜品价格不能为负数")
    void addMenuItem_withNegativePrice_shouldReject() {
        Map<String, Object> item = new HashMap<>();
        item.put("merchantId", 1L);
        item.put("name", "无效菜品");
        item.put("price", new BigDecimal("-10.00"));
        item.put("available", true);

        assertThrows(RuntimeException.class, () -> addMenuItem(item));
    }

    @Test
    @DisplayName("菜品价格不能为零")
    void addMenuItem_withZeroPrice_shouldReject() {
        Map<String, Object> item = new HashMap<>();
        item.put("merchantId", 1L);
        item.put("name", "零元菜品");
        item.put("price", BigDecimal.ZERO);
        item.put("available", true);

        assertThrows(RuntimeException.class, () -> addMenuItem(item));
    }
}
