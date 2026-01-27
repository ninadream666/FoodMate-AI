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
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final MerchantServiceClient merchantServiceClient;

    // 下单
    @PostMapping
    public ResponseEntity<Order> createOrder(
            @RequestBody CreateOrderDto dto,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal(); // 从Token中提取userId

        // 调用商家服务获取最新菜单信息（获取真实价格）
        // 这一步解决了前端不传 price 导致的空指针问题，同时也防止了价格篡改
        List<MenuItemDto> menuItems = merchantServiceClient.getPublicMenu(dto.getMerchantId());

        // 将菜单列表转为 Map 方便查找: itemId -> MenuItemDto
        Map<Long, MenuItemDto> menuMap = menuItems.stream()
                .collect(Collectors.toMap(MenuItemDto::getId, Function.identity()));

        Order order = new Order();
        order.setUserId(userId);
        order.setMerchantId(dto.getMerchantId());
        order.setStatus(OrderStatus.PENDING); // 使用枚举

        // 构建子项并计算总价
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = dto.getItems().stream().map(itemDto -> {
            // 查找对应的真实菜品信息
            MenuItemDto realItem = menuMap.get(itemDto.getMenuItemId());
            if (realItem == null) {
                throw new IllegalArgumentException("菜品 ID " + itemDto.getMenuItemId() + " 不存在或已下架");
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setMenuItemId(itemDto.getMenuItemId());
            // 使用从商家服务查询到的真实价格，忽略前端传入的 price (即使为空也没关系)
            item.setPrice(realItem.getPrice());
            item.setQuantity(itemDto.getQuantity());
            return item;
        }).collect(Collectors.toList());

        for (OrderItem item : items) {
            total = total.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        order.setItems(items);
        order.setTotalAmount(total);
        // 设置原价（初始状态无优惠）
        order.setOriginalAmount(total);
        order.setDiscountAmount(BigDecimal.ZERO);

        return ResponseEntity.ok(orderRepository.save(order));
    }

    // 查我的订单 (给前端/APP用)
    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(orderRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    // 查指定用户的订单 (给微服务内部调用用) ---
    // 实际生产中这里应该加上 @PreAuthorize("hasRole('ADMIN') or
    // hasAuthority('SCOPE_INTERNAL')") 这里的安全暂且简化
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(orderRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    // 取消订单
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id, @RequestBody CancelOrderDto dto) {
        return orderService.cancelOrder(id, dto.getCancelReason());
    }

    // 获取订单详情（含优惠、原价等）
    @GetMapping("/{id}/detail")
    public ResponseEntity<?> getOrderDetail(@PathVariable Long id) {
        return orderService.getOrderDetail(id);
    }

    // 分页查询待审批的退款列表
    @GetMapping("/merchant/{merchantId}/pending-refunds")
    public ResponseEntity<?> getPendingRefunds(@PathVariable String merchantId) {
        List<OrderDetailDto> orders = orderService.getPendingRefundOrders(merchantId);
        return ResponseEntity.ok(orders);
    }

    // 用户支付订单
    @PostMapping("/{id}/pay")
    public ResponseEntity<?> payOrder(@PathVariable Long id, Authentication authentication) {
        final Long userId;

        // 如果有认证信息，则验证用户身份
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            userId = (Long) authentication.getPrincipal();
        } else {
            userId = null;
        }

        // 查找订单
        return orderRepository.findById(id)
                .filter(order -> {
                    // 如果有用户认证，验证订单是否属于该用户；否则允许任何人支付（测试模式）
                    return userId == null || order.getUserId().equals(userId);
                })
                .map(order -> {
                    // 创建模拟支付信息
                    PaymentConfirmDto paymentDto = new PaymentConfirmDto();
                    paymentDto.setPaymentMethod("WECHAT");
                    paymentDto.setPaymentTransactionId("USER_PAY_" + System.currentTimeMillis() + "_" + id);
                    paymentDto.setPaymentChannel("APP");
                    paymentDto.setPaidAmount(order.getTotalAmount());

                    return orderService.confirmPayment(id, paymentDto);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}