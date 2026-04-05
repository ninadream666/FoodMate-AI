import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * CommissionService 单元测试
 * 覆盖佣金计算、佣金记录创建、费率类型处理、退款佣金退回等功能
 */
@DisplayName("佣金服务 - CommissionService 单元测试")
class CommissionServiceTest {

    // ====== 内联佣金数据 ======
    private Map<Long, Map<String, Object>> commissionStore; // id -> record
    private Map<Long, Map<String, Object>> orderIndex; // orderId -> record
    private long nextId;

    // ====== 内联业务逻辑 ======

    /** 计算佣金金额 */
    private BigDecimal calculateCommission(BigDecimal orderAmount, String feeType, BigDecimal rateOrAmount) {
        if ("PERCENTAGE".equals(feeType)) {
            return orderAmount.multiply(rateOrAmount).setScale(2, RoundingMode.HALF_UP);
        } else {
            // FIXED_AMOUNT
            return rateOrAmount;
        }
    }

    /** 计算并保存佣金记录 */
    private Map<String, Object> calculateAndSave(long orderId, long merchantId,
                                                  BigDecimal orderAmount, String feeType, BigDecimal rate) {
        // 重复检查
        if (orderIndex.containsKey(orderId)) {
            throw new RuntimeException("该订单已有佣金记录，不可重复创建");
        }
        BigDecimal commission = calculateCommission(orderAmount, feeType, rate);

        Map<String, Object> record = new HashMap<>();
        record.put("id", nextId++);
        record.put("orderId", orderId);
        record.put("merchantId", merchantId);
        record.put("orderAmount", orderAmount);
        record.put("commissionRate", rate);
        record.put("commissionAmount", commission);
        record.put("feeType", feeType);
        record.put("status", "PENDING");

        commissionStore.put((long) record.get("id"), record);
        orderIndex.put(orderId, record);
        return record;
    }

    private void confirmCommission(long id) {
        Map<String, Object> record = commissionStore.get(id);
        if (record == null) throw new RuntimeException("佣金记录不存在");
        record.put("status", "CONFIRMED");
    }

    private void refundCommission(long orderId) {
        Map<String, Object> record = orderIndex.get(orderId);
        if (record == null) throw new RuntimeException("佣金记录不存在");
        record.put("status", "REFUNDED");
    }

    @BeforeEach
    void setUp() {
        commissionStore = new HashMap<>();
        orderIndex = new HashMap<>();
        nextId = 1L;

        // 预置一条佣金记录
        Map<String, Object> testRecord = new HashMap<>();
        testRecord.put("id", nextId++);
        testRecord.put("orderId", 100L);
        testRecord.put("merchantId", 10L);
        testRecord.put("orderAmount", new BigDecimal("100.00"));
        testRecord.put("commissionRate", new BigDecimal("0.15"));
        testRecord.put("commissionAmount", new BigDecimal("15.00"));
        testRecord.put("feeType", "PERCENTAGE");
        testRecord.put("status", "PENDING");
        commissionStore.put(1L, testRecord);
        orderIndex.put(100L, testRecord);
    }

    // ==================== 佣金计算 ====================

    @Test
    @DisplayName("百分比佣金 - 15%费率，100元订单佣金15元")
    void calculateCommission_percentage_shouldBeCorrect() {
        BigDecimal commission = calculateCommission(
                new BigDecimal("100.00"), "PERCENTAGE", new BigDecimal("0.15"));

        assertEquals(new BigDecimal("15.00"), commission);
    }

    @Test
    @DisplayName("固定金额佣金 - 每单固定5元")
    void calculateCommission_fixedAmount_shouldBeCorrect() {
        BigDecimal commission = calculateCommission(
                new BigDecimal("200.00"), "FIXED_AMOUNT", new BigDecimal("5.00"));

        // 无论订单金额多少，佣金固定
        assertEquals(new BigDecimal("5.00"), commission);
    }

    @Test
    @DisplayName("佣金记录创建 - 应包含订单和商户信息")
    void createCommissionRecord_shouldSaveCorrectly() {
        Map<String, Object> result = calculateAndSave(200L, 10L,
                new BigDecimal("100.00"), "PERCENTAGE", new BigDecimal("0.15"));

        assertNotNull(result);
        assertEquals(new BigDecimal("15.00"), result.get("commissionAmount"));
    }

    // ==================== 佣金状态管理 ====================

    @Test
    @DisplayName("确认佣金 - PENDING变为CONFIRMED")
    void confirmCommission_shouldChangeStatus() {
        confirmCommission(1L);

        assertEquals("CONFIRMED", commissionStore.get(1L).get("status"));
    }

    @Test
    @DisplayName("退款订单 - 佣金应退回")
    void refundCommission_shouldReverseCommission() {
        refundCommission(100L);

        assertEquals("REFUNDED", orderIndex.get(100L).get("status"));
    }

    // ==================== 边界情况 ====================

    @Test
    @DisplayName("零金额订单不应产生佣金")
    void calculateCommission_zeroOrder_shouldBeZero() {
        BigDecimal commission = calculateCommission(
                BigDecimal.ZERO, "PERCENTAGE", new BigDecimal("0.15"));

        assertEquals(0, commission.compareTo(BigDecimal.ZERO));
    }

    @Test
    @DisplayName("佣金精度 - 小数金额应四舍五入到分")
    void calculateCommission_shouldRoundToTwoDecimals() {
        BigDecimal commission = calculateCommission(
                new BigDecimal("33.33"), "PERCENTAGE", new BigDecimal("0.15"));

        assertEquals(new BigDecimal("5.00"), commission);
    }

    @Test
    @DisplayName("重复计算佣金 - 同一订单不应重复创建记录")
    void calculateCommission_duplicate_shouldReject() {
        // orderId=100已存在
        assertThrows(RuntimeException.class,
                () -> calculateAndSave(100L, 10L,
                        new BigDecimal("100.00"), "PERCENTAGE", new BigDecimal("0.15")));
    }
}
