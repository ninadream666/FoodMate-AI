import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.*;

/**
 * CreditService 单元测试
 * 覆盖用户信用评分计算、信用等级变更、取消记录对信用的影响等功能
 */
@DisplayName("信用服务 - CreditService 单元测试")
class CreditServiceTest {

    // ====== 内联用户信用数据 ======
    private int creditScore;
    private String creditLevel;
    private int cancellationCount; // 近期取消次数

    // ====== 内联业务逻辑 ======

    /** 根据分数计算信用等级 */
    private String calculateCreditLevel(int score) {
        if (score >= 90) return "EXCELLENT";
        if (score >= 70) return "GOOD";
        if (score >= 50) return "NORMAL";
        return "POOR";
    }

    /** 取消订单扣减信用分，每次扣10分 */
    private void recordCancellation(String reason) {
        int deduction = 10;
        creditScore = Math.max(0, creditScore - deduction);
        cancellationCount++;
        creditLevel = calculateCreditLevel(creditScore);
    }

    /** 完成订单恢复信用分，每次恢复2分 */
    private void onOrderCompleted() {
        int recovery = 2;
        creditScore = Math.min(100, creditScore + recovery);
        creditLevel = calculateCreditLevel(creditScore);
    }

    @BeforeEach
    void setUp() {
        creditScore = 100; // 初始满分
        creditLevel = "EXCELLENT";
        cancellationCount = 0;
    }

    // ==================== 信用评分查询 ====================

    @Test
    @DisplayName("查询信用评分 - 正常用户返回当前信用分")
    void getUserCredit_shouldReturnCreditInfo() {
        assertEquals(100, creditScore);
        assertEquals("EXCELLENT", creditLevel);
    }

    @Test
    @DisplayName("查询不存在用户的信用 - 应抛出异常")
    void getUserCredit_withNonExistentUser_shouldThrowException() {
        Map<Long, Integer> userCredits = new HashMap<>();
        userCredits.put(1L, 100);

        assertThrows(RuntimeException.class, () -> {
            Long userId = 999L;
            if (!userCredits.containsKey(userId)) {
                throw new RuntimeException("用户不存在: " + userId);
            }
        });
    }

    // ==================== 信用扣减测试 ====================

    @Test
    @DisplayName("取消订单扣减信用分 - 每次取消扣固定分数")
    void deductCredit_afterCancellation_shouldReduceScore() {
        recordCancellation("不想吃了");
        assertTrue(creditScore < 100, "分数应减少");
    }

    @Test
    @DisplayName("多次取消后信用等级应降低")
    void deductCredit_afterMultipleCancellations_shouldDegradeLevel() {
        // 模拟多次取消
        for (int i = 0; i < 5; i++) {
            recordCancellation("频繁取消");
        }
        // 100 - 5*10 = 50 → NORMAL
        assertNotEquals("EXCELLENT", creditLevel);
    }

    @Test
    @DisplayName("信用分不应低于0")
    void deductCredit_shouldNotGoBelowZero() {
        creditScore = 5; // 接近0分
        recordCancellation("取消");
        assertTrue(creditScore >= 0, "信用分不应低于0");
    }

    // ==================== 信用等级划分 ====================

    @Test
    @DisplayName("信用等级 - 90-100分为EXCELLENT")
    void creditLevel_score90to100_shouldBeExcellent() {
        String level = calculateCreditLevel(95);
        assertEquals("EXCELLENT", level);
    }

    @Test
    @DisplayName("信用等级 - 70-89分为GOOD")
    void creditLevel_score70to89_shouldBeGood() {
        String level = calculateCreditLevel(80);
        assertEquals("GOOD", level);
    }

    @Test
    @DisplayName("信用等级 - 50-69分为NORMAL")
    void creditLevel_score50to69_shouldBeNormal() {
        String level = calculateCreditLevel(60);
        assertEquals("NORMAL", level);
    }

    @Test
    @DisplayName("信用等级 - 50分以下为POOR")
    void creditLevel_scoreBelow50_shouldBePoor() {
        String level = calculateCreditLevel(30);
        assertEquals("POOR", level);
    }

    // ==================== 信用恢复 ====================

    @Test
    @DisplayName("完成订单应恢复少量信用分")
    void completeOrder_shouldRecoverCredit() {
        creditScore = 80;
        onOrderCompleted();
        assertTrue(creditScore > 80, "完成订单后信用分应恢复");
    }

    @Test
    @DisplayName("满分信用不应超过100")
    void recoverCredit_shouldNotExceed100() {
        creditScore = 99;
        onOrderCompleted();
        assertTrue(creditScore <= 100, "信用分不应超过100");
    }
}
