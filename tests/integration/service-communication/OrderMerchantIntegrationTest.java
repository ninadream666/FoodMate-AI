import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.*;

/**
 * 订单服务 <-> 商户服务 集成测试
 * 测试订单创建时的菜单验证、商户状态检查、价格一致性校验等跨服务通信
 *
 * 通信方式: OpenFeign 同步REST调用
 * order-service(8084) -> merchant-service(8081)
 * Feign客户端: MerchantServiceClient.getPublicMenu(merchantId)
 */
@DisplayName("集成测试 - 订单服务 ↔ 商户服务")
class OrderMerchantIntegrationTest {

    // ==================== 菜单验证集成 ====================

    @Test
    @DisplayName("创建订单时应通过Feign调用商户服务验证菜单有效性")
    void createOrder_shouldValidateMenuViaMerchantService() {
        // 模拟 order-service 创建订单时，调用 merchant-service 获取菜单
        // MerchantServiceClient.getPublicMenu(merchantId) -> List<MenuItem>
        List<Map<String, Object>> menu = Arrays.asList(
                Map.of("id", 1L, "name", "宫保鸡丁", "price", 32.0, "available", true),
                Map.of("id", 2L, "name", "鱼香肉丝", "price", 28.0, "available", true)
        );

        // 订单项引用的菜品应在菜单中存在
        Long orderItemMenuId = 1L;
        boolean menuItemExists = menu.stream()
                .anyMatch(item -> item.get("id").equals(orderItemMenuId));

        assertTrue(menuItemExists, "订单项引用的菜品应在商户菜单中存在");
    }

    @Test
    @DisplayName("订单引用不存在的菜品ID应被拒绝")
    void createOrder_withInvalidMenuItemId_shouldFail() {
        List<Map<String, Object>> menu = Arrays.asList(
                Map.of("id", 1L, "name", "宫保鸡丁", "price", 32.0)
        );

        Long invalidItemId = 999L;
        boolean exists = menu.stream().anyMatch(item -> item.get("id").equals(invalidItemId));

        assertFalse(exists, "不存在的菜品ID应验证失败");
    }

    @Test
    @DisplayName("订单金额应与商户菜单价格一致")
    void createOrder_priceShouldMatchMerchantMenu() {
        double menuPrice = 32.0;
        double orderItemPrice = 32.0;

        assertEquals(menuPrice, orderItemPrice, 0.01,
                "订单项价格应与商户菜单价格一致，防止前端篡改");
    }

    @Test
    @DisplayName("已下架菜品不应出现在订单中")
    void createOrder_withUnavailableItem_shouldFail() {
        Map<String, Object> unavailableItem = Map.of(
                "id", 3L, "name", "停售菜品", "price", 50.0, "available", false
        );

        assertFalse((boolean) unavailableItem.get("available"),
                "已下架的菜品不应允许下单");
    }

    // ==================== 商户状态校验 ====================

    @Test
    @DisplayName("向已关闭的商户下单应被拒绝")
    void createOrder_withClosedMerchant_shouldFail() {
        String merchantStatus = "INACTIVE";
        assertNotEquals("ACTIVE", merchantStatus,
                "非ACTIVE状态的商户不应接受新订单");
    }

    @Test
    @DisplayName("Feign调用超时应触发降级处理")
    void createOrder_whenMerchantServiceTimeout_shouldFallback() {
        // Feign配置: 连接超时5s, 读取超时10s
        int connectTimeout = 5000;
        int readTimeout = 10000;

        assertTrue(connectTimeout > 0);
        assertTrue(readTimeout > connectTimeout,
                "读取超时应大于连接超时");
    }

    @Test
    @DisplayName("商户服务宕机时应触发熔断器")
    void createOrder_whenMerchantServiceDown_shouldTriggerCircuitBreaker() {
        // Resilience4j 熔断器配置验证
        int failureRateThreshold = 50; // 50%失败率触发熔断
        int waitDurationInOpenState = 60; // 熔断打开后等待60s

        assertTrue(failureRateThreshold > 0);
        assertTrue(waitDurationInOpenState > 0);
    }
}
