package com.fooddelivery.orderservice.controller;

import com.fooddelivery.common.enums.OrderStatus;
import com.fooddelivery.orderservice.client.MerchantServiceClient;
import com.fooddelivery.orderservice.dto.CreateOrderDto;
import com.fooddelivery.orderservice.dto.CancelOrderDto;
import com.fooddelivery.orderservice.dto.PaymentConfirmDto;
import com.fooddelivery.orderservice.dto.MenuItemDto;
import com.fooddelivery.orderservice.dto.OrderDetailDto;
import com.fooddelivery.orderservice.entity.Order;
import com.fooddelivery.orderservice.entity.OrderItem;
import com.fooddelivery.orderservice.repository.OrderRepository;
import com.fooddelivery.orderservice.service.OrderService;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final MerchantServiceClient merchantServiceClient;

    // 下单 — 限流 + 隔板保护（防止刷单 + 限制并发写入数据库）
    @PostMapping
    @RateLimiter(name = "createOrder", fallbackMethod = "createOrderFallback")
    @Bulkhead(name = "orderWrite", fallbackMethod = "createOrderFallback")
    public ResponseEntity<Order> createOrder(
            @RequestBody CreateOrderDto dto,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();

        List<MenuItemDto> menuItems = merchantServiceClient.getPublicMenu(dto.getMerchantId());

        Map<Long, MenuItemDto> menuMap = menuItems.stream()
                .collect(Collectors.toMap(MenuItemDto::getId, Function.identity()));

        Order order = new Order();
        order.setUserId(userId);
        order.setMerchantId(dto.getMerchantId());
        order.setStatus(OrderStatus.PENDING);

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = dto.getItems().stream().map(itemDto -> {
            MenuItemDto realItem = menuMap.get(itemDto.getMenuItemId());
            if (realItem == null) {
                throw new IllegalArgumentException("菜品 ID " + itemDto.getMenuItemId() + " 不存在或已下架");
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setMenuItemId(itemDto.getMenuItemId());
            item.setPrice(realItem.getPrice());
            item.setQuantity(itemDto.getQuantity());
            return item;
        }).collect(Collectors.toList());

        for (OrderItem item : items) {
            total = total.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        order.setItems(items);
        order.setTotalAmount(total);
        order.setOriginalAmount(total);
        order.setDiscountAmount(BigDecimal.ZERO);

        return ResponseEntity.ok(orderRepository.save(order));
    }

    // 查我的订单 — 断路器保护（下游数据库故障时快速失败）
    @GetMapping("/my-orders")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getMyOrdersFallback")
    public ResponseEntity<?> getMyOrders(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) authentication.getPrincipal();
        size = Math.min(size, 50);
        Page<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user/{userId}")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getOrdersByUserIdFallback")
    public ResponseEntity<List<Order>> getOrdersByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(orderRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id, @RequestBody CancelOrderDto dto) {
        return orderService.cancelOrder(id, dto.getCancelReason());
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<?> getOrderDetail(@PathVariable Long id) {
        return orderService.getOrderDetail(id);
    }

    @GetMapping("/merchant/{merchantId}/pending-refunds")
    public ResponseEntity<?> getPendingRefunds(@PathVariable String merchantId) {
        List<OrderDetailDto> orders = orderService.getPendingRefundOrders(merchantId);
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/{id}/pay")
    @RateLimiter(name = "createOrder", fallbackMethod = "payOrderFallback")
    public ResponseEntity<?> payOrder(@PathVariable Long id, Authentication authentication) {
        final Long userId;

        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            userId = (Long) authentication.getPrincipal();
        } else {
            userId = null;
        }

        return orderRepository.findById(id)
                .filter(order -> {
                    return userId == null || order.getUserId().equals(userId);
                })
                .map(order -> {
                    PaymentConfirmDto paymentDto = new PaymentConfirmDto();
                    paymentDto.setPaymentMethod("WECHAT");
                    paymentDto.setPaymentTransactionId("USER_PAY_" + System.currentTimeMillis() + "_" + id);
                    paymentDto.setPaymentChannel("APP");
                    paymentDto.setPaidAmount(order.getTotalAmount());

                    return orderService.confirmPayment(id, paymentDto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ============ 降级方法（大流量/故障时的兜底响应） ============

    public ResponseEntity<Order> createOrderFallback(CreateOrderDto dto, Authentication auth, Throwable t) {
        log.warn("[降级] 下单请求被限流或隔板拦截: {}", t.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(null);
    }

    public ResponseEntity<?> getMyOrdersFallback(Authentication auth, int page, int size, Throwable t) {
        log.warn("[降级] 查询订单熔断: {}", t.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", "订单服务暂时繁忙，请稍后重试", "fallback", true));
    }

    public ResponseEntity<List<Order>> getOrdersByUserIdFallback(Long userId, Throwable t) {
        log.warn("[降级] 内部查询用户订单熔断: userId={}, error={}", userId, t.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(List.of());
    }

    public ResponseEntity<?> payOrderFallback(Long id, Authentication auth, Throwable t) {
        log.warn("[降级] 支付请求被限流: orderId={}, error={}", id, t.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("message", "支付请求过于频繁，请稍后重试"));
    }
}
