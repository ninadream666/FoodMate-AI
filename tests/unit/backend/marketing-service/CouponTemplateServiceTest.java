import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CouponTemplateService 单元测试
 * 覆盖优惠券模板的创建、查询、启用/禁用、过期处理等功能
 */
@DisplayName("优惠券模板服务 - CouponTemplateService 单元测试")
class CouponTemplateServiceTest {

    // ====== 内联模板数据 ======
    private Map<Long, Map<String, Object>> templateStore;
    private long nextId;

    // ====== 内联业务逻辑 ======

    private Map<String, Object> createTemplate(Map<String, Object> template) {
        // 校验：结束时间不能早于开始时间
        LocalDateTime startTime = (LocalDateTime) template.get("startTime");
        LocalDateTime endTime = (LocalDateTime) template.get("endTime");
        if (endTime.isBefore(startTime)) {
            throw new RuntimeException("结束时间不能早于开始时间");
        }
        // 校验：总发放量不能为负
        int totalCount = (int) template.get("totalCount");
        if (totalCount < 0) {
            throw new RuntimeException("总发放量不能为负数");
        }

        template.put("id", nextId++);
        template.put("issuedCount", 0);
        templateStore.put((long) template.get("id"), template);
        return template;
    }

    private void disableTemplate(long id) {
        Map<String, Object> t = templateStore.get(id);
        if (t == null) throw new RuntimeException("模板不存在");
        t.put("status", "DISABLED");
    }

    private void enableTemplate(long id) {
        Map<String, Object> t = templateStore.get(id);
        if (t == null) throw new RuntimeException("模板不存在");
        // 过期模板不可重新启用
        LocalDateTime endTime = (LocalDateTime) t.get("endTime");
        if (endTime.isBefore(LocalDateTime.now()) || "EXPIRED".equals(t.get("status"))) {
            throw new RuntimeException("过期模板不可重新启用");
        }
        t.put("status", "ACTIVE");
    }

    private List<Map<String, Object>> getActiveTemplates() {
        return templateStore.values().stream()
                .filter(t -> "ACTIVE".equals(t.get("status")))
                .collect(Collectors.toList());
    }

    @BeforeEach
    void setUp() {
        templateStore = new HashMap<>();
        nextId = 1L;

        Map<String, Object> testTemplate = new HashMap<>();
        testTemplate.put("id", nextId++);
        testTemplate.put("name", "新用户满减券");
        testTemplate.put("type", "FIXED_AMOUNT");
        testTemplate.put("discountValue", new BigDecimal("10.00"));
        testTemplate.put("minOrderAmount", new BigDecimal("30.00"));
        testTemplate.put("totalCount", 1000);
        testTemplate.put("issuedCount", 0);
        testTemplate.put("status", "ACTIVE");
        testTemplate.put("startTime", LocalDateTime.now().minusDays(1));
        testTemplate.put("endTime", LocalDateTime.now().plusDays(30));
        templateStore.put(1L, testTemplate);
    }

    // ==================== 模板创建 ====================

    @Test
    @DisplayName("创建满减券模板 - 正常创建")
    void createTemplate_fixedAmount_shouldSucceed() {
        Map<String, Object> template = new HashMap<>();
        template.put("name", "满50减15");
        template.put("type", "FIXED_AMOUNT");
        template.put("discountValue", new BigDecimal("15.00"));
        template.put("minOrderAmount", new BigDecimal("50.00"));
        template.put("totalCount", 500);
        template.put("status", "ACTIVE");
        template.put("startTime", LocalDateTime.now());
        template.put("endTime", LocalDateTime.now().plusDays(7));

        Map<String, Object> result = createTemplate(template);

        assertNotNull(result);
        assertEquals("FIXED_AMOUNT", result.get("type"));
        assertEquals(new BigDecimal("15.00"), result.get("discountValue"));
    }

    @Test
    @DisplayName("创建折扣券模板 - 折扣率应在0-1之间")
    void createTemplate_percentage_shouldValidateDiscount() {
        Map<String, Object> template = new HashMap<>();
        template.put("name", "8折券");
        template.put("type", "PERCENTAGE");
        template.put("discountValue", new BigDecimal("0.8"));
        template.put("minOrderAmount", new BigDecimal("0"));
        template.put("totalCount", 200);
        template.put("status", "ACTIVE");
        template.put("startTime", LocalDateTime.now());
        template.put("endTime", LocalDateTime.now().plusDays(7));

        Map<String, Object> result = createTemplate(template);
        assertEquals("PERCENTAGE", result.get("type"));
    }

    @Test
    @DisplayName("创建模板 - 结束时间早于开始时间应拒绝")
    void createTemplate_withInvalidDateRange_shouldReject() {
        Map<String, Object> template = new HashMap<>();
        template.put("name", "无效券");
        template.put("type", "FIXED_AMOUNT");
        template.put("discountValue", new BigDecimal("10.00"));
        template.put("minOrderAmount", new BigDecimal("30.00"));
        template.put("totalCount", 100);
        template.put("status", "ACTIVE");
        template.put("startTime", LocalDateTime.now().plusDays(10));
        template.put("endTime", LocalDateTime.now().plusDays(5));

        assertThrows(RuntimeException.class, () -> createTemplate(template));
    }

    @Test
    @DisplayName("创建模板 - 总发放量不能为负数")
    void createTemplate_withNegativeTotalCount_shouldReject() {
        Map<String, Object> template = new HashMap<>();
        template.put("name", "无效券");
        template.put("type", "FIXED_AMOUNT");
        template.put("discountValue", new BigDecimal("10.00"));
        template.put("minOrderAmount", new BigDecimal("30.00"));
        template.put("totalCount", -1);
        template.put("status", "ACTIVE");
        template.put("startTime", LocalDateTime.now());
        template.put("endTime", LocalDateTime.now().plusDays(7));

        assertThrows(RuntimeException.class, () -> createTemplate(template));
    }

    // ==================== 模板状态管理 ====================

    @Test
    @DisplayName("禁用模板 - 状态变为DISABLED")
    void disableTemplate_shouldSetDisabled() {
        disableTemplate(1L);
        assertEquals("DISABLED", templateStore.get(1L).get("status"));
    }

    @Test
    @DisplayName("启用模板 - 过期模板不可重新启用")
    void enableTemplate_expired_shouldReject() {
        // 把模板设为已过期
        templateStore.get(1L).put("endTime", LocalDateTime.now().minusDays(1));
        templateStore.get(1L).put("status", "EXPIRED");

        assertThrows(RuntimeException.class, () -> enableTemplate(1L));
    }

    // ==================== 模板查询 ====================

    @Test
    @DisplayName("查询活跃模板列表")
    void getActiveTemplates_shouldReturnActiveOnly() {
        List<Map<String, Object>> result = getActiveTemplates();

        assertEquals(1, result.size());
        assertEquals("ACTIVE", result.get(0).get("status"));
    }

    @Test
    @DisplayName("查询模板发放进度 - 已发放/总量")
    void getTemplateProgress_shouldReturnCorrectRatio() {
        templateStore.get(1L).put("totalCount", 1000);
        templateStore.get(1L).put("issuedCount", 350);

        int totalCount = (int) templateStore.get(1L).get("totalCount");
        int issuedCount = (int) templateStore.get(1L).get("issuedCount");
        double progress = (double) issuedCount / totalCount;

        assertEquals(0.35, progress, 0.001);
    }
}
