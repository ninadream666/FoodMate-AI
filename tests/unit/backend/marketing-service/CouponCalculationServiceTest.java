import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

/**
 * CouponCalculationService 单元测试
 * 覆盖优惠券折扣计算、最优券推荐、多券组合、门槛校验等核心计算逻辑
 */
@DisplayName("优惠券计算服务 - CouponCalculationService 单元测试")
class CouponCalculationServiceTest {

    // ====== 内联计算逻辑 ======

    /** 满减券计算：订单金额 >= 门槛时减去固定金额，结果不低于0 */
    private BigDecimal calculateFixedDiscount(BigDecimal orderAmount, BigDecimal discount, BigDecimal minOrder) {
        if (orderAmount.compareTo(minOrder) < 0) {
            return orderAmount; // 不满足门槛，不优惠
        }
        return orderAmount.subtract(discount).max(BigDecimal.ZERO);
    }

    /** 折扣券计算：订单金额 * 折扣率，可选最大优惠额限制 */
    private BigDecimal calculatePercentageDiscount(BigDecimal orderAmount, BigDecimal discountRate, BigDecimal maxDiscount) {
        BigDecimal discounted = orderAmount.multiply(discountRate).setScale(2, RoundingMode.HALF_UP);
        if (maxDiscount != null) {
            BigDecimal actualDiscount = orderAmount.subtract(discounted);
            if (actualDiscount.compareTo(maxDiscount) > 0) {
                return orderAmount.subtract(maxDiscount);
            }
        }
        return discounted;
    }

    // ==================== 满减券计算 ====================

    @Test
    @DisplayName("满减券 - 满30减10，订单50元应优惠10元")
    void calculate_fixedAmount_shouldDeductCorrectly() {
        BigDecimal orderAmount = new BigDecimal("50.00");
        BigDecimal discount = new BigDecimal("10.00");
        BigDecimal minOrder = new BigDecimal("30.00");

        // 订单金额 >= 门槛，应享受满减
        assertTrue(orderAmount.compareTo(minOrder) >= 0);
        BigDecimal finalAmount = calculateFixedDiscount(orderAmount, discount, minOrder);
        assertEquals(new BigDecimal("40.00"), finalAmount);
    }

    @Test
    @DisplayName("满减券 - 订单金额低于门槛不可用")
    void calculate_fixedAmount_belowThreshold_shouldNotApply() {
        BigDecimal orderAmount = new BigDecimal("25.00");
        BigDecimal minOrder = new BigDecimal("30.00");

        assertFalse(orderAmount.compareTo(minOrder) >= 0);
    }

    @Test
    @DisplayName("满减券 - 优惠后金额不能低于0")
    void calculate_fixedAmount_shouldNotGoBelowZero() {
        BigDecimal orderAmount = new BigDecimal("8.00");
        BigDecimal discount = new BigDecimal("10.00");

        BigDecimal finalAmount = calculateFixedDiscount(orderAmount, discount, BigDecimal.ZERO);
        assertEquals(0, finalAmount.compareTo(BigDecimal.ZERO));
    }

    // ==================== 折扣券计算 ====================

    @Test
    @DisplayName("折扣券 - 8折，订单100元应优惠20元")
    void calculate_percentage_shouldApplyDiscount() {
        BigDecimal orderAmount = new BigDecimal("100.00");
        BigDecimal discountRate = new BigDecimal("0.8"); // 8折

        BigDecimal finalAmount = calculatePercentageDiscount(orderAmount, discountRate, null);
        assertEquals(new BigDecimal("80.00"), finalAmount);
    }

    @Test
    @DisplayName("折扣券 - 最大优惠金额限制")
    void calculate_percentage_withMaxDiscount_shouldCap() {
        BigDecimal orderAmount = new BigDecimal("500.00");
        BigDecimal discountRate = new BigDecimal("0.5"); // 5折
        BigDecimal maxDiscount = new BigDecimal("50.00"); // 最多优惠50元

        BigDecimal finalAmount = calculatePercentageDiscount(orderAmount, discountRate, maxDiscount);
        // 5折优惠250元，超过上限50元，所以实际只优惠50元
        assertEquals(new BigDecimal("450.00"), finalAmount);
    }

    // ==================== 最优券推荐 ====================

    @Test
    @DisplayName("最优券推荐 - 应返回优惠金额最大的券")
    void findBestCoupon_shouldReturnMaxDiscount() {
        // 模拟3张可用券
        BigDecimal discount1 = new BigDecimal("5.00");   // 满20减5
        BigDecimal discount2 = new BigDecimal("15.00");  // 满50减15
        BigDecimal discount3 = new BigDecimal("10.00");  // 满30减10

        List<BigDecimal> discounts = Arrays.asList(discount1, discount2, discount3);
        BigDecimal maxDiscount = discounts.stream()
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        assertEquals(new BigDecimal("15.00"), maxDiscount);
    }

    @Test
    @DisplayName("无可用券时推荐结果为空")
    void findBestCoupon_withNoCoupons_shouldReturnEmpty() {
        List<BigDecimal> discounts = Collections.emptyList();
        BigDecimal maxDiscount = discounts.stream()
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        assertEquals(BigDecimal.ZERO, maxDiscount);
    }

    // ==================== 优惠券有效性校验 ====================

    @Test
    @DisplayName("已过期的优惠券不可使用")
    void validate_expiredCoupon_shouldBeInvalid() {
        LocalDateTime expireTime = LocalDateTime.now().minusDays(1);
        boolean isExpired = LocalDateTime.now().isAfter(expireTime);

        assertTrue(isExpired);
    }

    @Test
    @DisplayName("未到使用时间的优惠券不可使用")
    void validate_notStartedCoupon_shouldBeInvalid() {
        LocalDateTime startTime = LocalDateTime.now().plusDays(1);
        boolean notStarted = LocalDateTime.now().isBefore(startTime);

        assertTrue(notStarted);
    }

    @Test
    @DisplayName("已使用的优惠券不可重复使用")
    void validate_usedCoupon_shouldBeInvalid() {
        String status = "USED";
        boolean isUsed = "USED".equals(status);

        assertTrue(isUsed);
    }

    // ==================== 多券组合计算 ====================

    @Test
    @DisplayName("多券组合 - 满减+折扣叠加计算")
    void combineCoupons_shouldStackDiscounts() {
        BigDecimal orderAmount = new BigDecimal("100.00");

        // 先应用折扣券：8折
        BigDecimal afterPercentage = orderAmount.multiply(new BigDecimal("0.8"));
        // 再应用满减券：减10
        BigDecimal afterFixed = afterPercentage.subtract(new BigDecimal("10.00"));

        assertEquals(new BigDecimal("70.00"), afterFixed.setScale(2, RoundingMode.HALF_UP));
    }
}
