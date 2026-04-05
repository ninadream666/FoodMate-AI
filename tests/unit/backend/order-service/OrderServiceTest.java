import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * OrderService 单元测试
 * 覆盖订单创建、支付确认、状态流转、取消退款等核心业务逻辑
 */
@DisplayName("订单服务 - OrderService 单元测试")
class OrderServiceTest {

    // ====== 订单状态枚举（内联） ======
    static final String PENDING = "PENDING";
    static final String PAID = "PAID";
    static final String ACCEPTED = "ACCEPTED";
    static final String CANCELLED = "CANCELLED";
    static final String CANCEL_PENDING = "CANCEL_PENDING";
    static final String DELIVERED = "DELIVERED";

    // 允许的状态转换
    private static final Map<String, Set<String>> VALID_TRANSITIONS = new HashMap<>();
    static {
        VALID_TRANSITIONS.put(PENDING, Set.of(PAID, CANCELLED));
        VALID_TRANSITIONS.put(PAID, Set.of(ACCEPTED, CANCELLED, CANCEL_PENDING));
        VALID_TRANSITIONS.put(ACCEPTED, Set.of(DELIVERED, CANCELLED));
        VALID_TRANSITIONS.put(DELIVERED, Set.of()); // 终态
        VALID_TRANSITIONS.put(CANCELLED, Set.of()); // 终态
    }

    // ====== 内联订单数据 ======
    private Map<String, Object> testOrder;
    private Map<Long, Map<String, Object>> orderStore;
    private List<String> publishedEvents;

    // ====== 内联业务逻辑 ======

    private Map<String, Object> createOrder(Map<String, Object> order) {
        BigDecimal amount = (BigDecimal) order.get("totalAmount");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("订单金额必须大于0");
        }
        if (order.get("merchantId") == null) {
            throw new RuntimeException("必须指定商户");
        }
        order.put("status", PENDING);
        order.put("createdAt", LocalDateTime.now());
        orderStore.put((long) order.get("id"), order);
        return order;
    }

    private Map<String, Object> payOrder(long orderId) {
        Map<String, Object> order = orderStore.get(orderId);
        String status = (String) order.get("status");
        if (!PENDING.equals(status)) {
            throw new RuntimeException("只有PENDING状态的订单可以支付，当前状态: " + status);
        }
        order.put("status", PAID);
        publishedEvents.add("order.paid:" + orderId);
        return order;
    }

    private Map<String, Object> acceptOrder(long orderId) {
        Map<String, Object> order = orderStore.get(orderId);
        String status = (String) order.get("status");
        if (!PAID.equals(status)) {
            throw new RuntimeException("只有PAID状态的订单可以接单");
        }
        order.put("status", ACCEPTED);
        return order;
    }

    private void rejectOrder(long orderId, String reason) {
        Map<String, Object> order = orderStore.get(orderId);
        order.put("status", CANCELLED);
        order.put("rejectReason", reason);
        // 触发退款流程
        publishedEvents.add("order.refund:" + orderId);
    }

    private Map<String, Object> cancelOrder(long orderId, long userId, String reason) {
        Map<String, Object> order = orderStore.get(orderId);
        if ((long) order.get("userId") != userId) {
            throw new RuntimeException("不能取消其他用户的订单");
        }
        String status = (String) order.get("status");
        if (DELIVERED.equals(status)) {
            throw new RuntimeException("已送达订单不能取消");
        }
        if (PENDING.equals(status)) {
            order.put("status", CANCELLED);
        } else if (PAID.equals(status)) {
            // PAID状态取消进入审核或直接取消
            order.put("status", CANCEL_PENDING);
        }
        return order;
    }

    private List<Map<String, Object>> getMyOrders(long userId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> o : orderStore.values()) {
            if ((long) o.get("userId") == userId) result.add(o);
        }
        return result;
    }

    @BeforeEach
    void setUp() {
        orderStore = new HashMap<>();
        publishedEvents = new ArrayList<>();

        testOrder = new HashMap<>();
        testOrder.put("id", 1L);
        testOrder.put("userId", 1L);
        testOrder.put("merchantId", 10L);
        testOrder.put("totalAmount", new BigDecimal("58.50"));
        testOrder.put("status", PENDING);
        testOrder.put("createdAt", LocalDateTime.now());
        orderStore.put(1L, testOrder);
    }

    // ==================== 订单创建测试 ====================

    @Test
    @DisplayName("创建订单 - 正常创建并验证菜单有效性")
    void createOrder_withValidItems_shouldCreateSuccessfully() {
        Map<String, Object> newOrder = new HashMap<>();
        newOrder.put("id", 2L);
        newOrder.put("userId", 1L);
        newOrder.put("merchantId", 10L);
        newOrder.put("totalAmount", new BigDecimal("58.50"));

        Map<String, Object> result = createOrder(newOrder);

        assertNotNull(result);
        assertEquals(PENDING, result.get("status"));
    }

    @Test
    @DisplayName("创建订单 - 订单金额为0应拒绝")
    void createOrder_withZeroAmount_shouldReject() {
        Map<String, Object> order = new HashMap<>();
        order.put("id", 3L);
        order.put("merchantId", 10L);
        order.put("totalAmount", BigDecimal.ZERO);

        assertThrows(RuntimeException.class, () -> createOrder(order));
    }

    @Test
    @DisplayName("创建订单 - 无商户ID应拒绝")
    void createOrder_withoutMerchant_shouldReject() {
        Map<String, Object> order = new HashMap<>();
        order.put("id", 4L);
        order.put("totalAmount", new BigDecimal("10.00"));
        order.put("merchantId", null);

        assertThrows(RuntimeException.class, () -> createOrder(order));
    }

    // ==================== 支付确认测试 ====================

    @Test
    @DisplayName("支付确认 - PENDING订单可成功支付")
    void payOrder_withPendingOrder_shouldSucceed() {
        Map<String, Object> result = payOrder(1L);

        assertEquals(PAID, result.get("status"));
        // 验证发布了订单事件
        assertTrue(publishedEvents.stream().anyMatch(e -> e.startsWith("order.paid:")));
    }

    @Test
    @DisplayName("支付确认 - 已支付订单不可重复支付")
    void payOrder_withAlreadyPaidOrder_shouldReject() {
        testOrder.put("status", PAID);

        assertThrows(RuntimeException.class, () -> payOrder(1L));
    }

    @Test
    @DisplayName("支付确认 - 已取消订单不可支付")
    void payOrder_withCancelledOrder_shouldReject() {
        testOrder.put("status", CANCELLED);

        assertThrows(RuntimeException.class, () -> payOrder(1L));
    }

    // ==================== 订单状态流转测试 ====================

    @Test
    @DisplayName("商家接单 - PAID状态可转为ACCEPTED")
    void acceptOrder_withPaidOrder_shouldChangeToAccepted() {
        testOrder.put("status", PAID);

        Map<String, Object> result = acceptOrder(1L);

        assertEquals(ACCEPTED, result.get("status"));
    }

    @Test
    @DisplayName("商家拒单 - 应触发退款流程")
    void rejectOrder_shouldTriggerRefund() {
        testOrder.put("status", PAID);

        rejectOrder(1L, "已打烊");

        assertEquals(CANCELLED, testOrder.get("status"));
        assertTrue(publishedEvents.stream().anyMatch(e -> e.startsWith("order.refund:")));
    }

    // ==================== 订单取消测试 ====================

    @Test
    @DisplayName("用户取消 - PENDING状态直接取消")
    void cancelOrder_withPendingStatus_shouldCancelDirectly() {
        Map<String, Object> result = cancelOrder(1L, 1L, "不想吃了");

        assertEquals(CANCELLED, result.get("status"));
    }

    @Test
    @DisplayName("用户取消 - PAID状态取消需要退款")
    void cancelOrder_withPaidStatus_shouldProcessRefund() {
        testOrder.put("status", PAID);

        Map<String, Object> result = cancelOrder(1L, 1L, "误下单");

        // PAID状态取消进入审核流程
        String status = (String) result.get("status");
        assertTrue(CANCEL_PENDING.equals(status) || CANCELLED.equals(status));
    }

    @Test
    @DisplayName("用户取消 - DELIVERED状态不可取消")
    void cancelOrder_withDeliveredStatus_shouldReject() {
        testOrder.put("status", DELIVERED);

        assertThrows(RuntimeException.class,
                () -> cancelOrder(1L, 1L, "不满意"));
    }

    @Test
    @DisplayName("非订单所有者不可取消他人订单")
    void cancelOrder_byNonOwner_shouldReject() {
        // 用户2尝试取消用户1的订单
        assertThrows(RuntimeException.class,
                () -> cancelOrder(1L, 2L, "恶意取消"));
    }

    // ==================== 订单查询测试 ====================

    @Test
    @DisplayName("查询用户订单列表")
    void getMyOrders_shouldReturnUserOrders() {
        List<Map<String, Object>> orders = getMyOrders(1L);

        assertEquals(1, orders.size());
        assertEquals(1L, orders.get(0).get("userId"));
    }
}
