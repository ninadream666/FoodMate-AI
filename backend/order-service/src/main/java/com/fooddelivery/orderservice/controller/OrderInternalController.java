package com.fooddelivery.orderservice.controller;

import com.fooddelivery.common.enums.OrderStatus;
import com.fooddelivery.orderservice.dto.ItemSalesStatsDto;
import com.fooddelivery.orderservice.dto.OrderDetailDto;
import com.fooddelivery.orderservice.dto.PaymentConfirmDto;
import com.fooddelivery.orderservice.service.OrderService;
import com.fooddelivery.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 订单内部 API 控制器
 * 仅供其他微服务调用，不对外暴露
 */
@RestController
@RequestMapping("/orders/internal")
@RequiredArgsConstructor
public class OrderInternalController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    /**
     * AI Pricing专用接口：获取商家近期销量统计
     */
    @GetMapping("/stats/sales")
    public ResponseEntity<List<ItemSalesStatsDto>> getSalesStats(
            @RequestParam Long merchantId,
            @RequestParam(defaultValue = "7") int days) {
        
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<ItemSalesStatsDto> stats = orderRepository.findSalesStatsByMerchant(merchantId, startDate);
        return ResponseEntity.ok(stats);
    }

    /**
     * 获取订单详细信息（内部接口）
     * GET /orders/internal/{orderId}
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderInternal(@PathVariable Long orderId) {
        return orderService.getOrderDetail(orderId);
    }

    /**
     * 更新订单取消状态为"已批准"（内部接口）
     * POST /orders/internal/{orderId}/cancel-status/approve
     */
    @PostMapping("/{orderId}/cancel-status/approve")
    public ResponseEntity<?> updateOrderCancelStatusToApproved(
            @PathVariable Long orderId,
            @RequestParam BigDecimal refundAmount) {

        return orderService.updateOrderCancelStatusToApproved(orderId, refundAmount);
    }

    /**
     * 更新订单取消状态为"已拒绝"（内部接口）
     * POST /orders/internal/{orderId}/cancel-status/reject
     */
    @PostMapping("/{orderId}/cancel-status/reject")
    public ResponseEntity<?> updateOrderCancelStatusToRejected(@PathVariable Long orderId) {
        return orderService.updateOrderCancelStatusToRejected(orderId);
    }

    /**
     * 获取商家的待审批退款订单列表（内部接口）
     * GET /orders/internal/merchant/{merchantId}/pending-refunds
     * 支持同时传入externalId，兼容订单中merchant_id存的是数据库主键或外部ID
     */
    @GetMapping("/merchant/{merchantId}/pending-refunds")
    public ResponseEntity<?> getPendingRefundsByMerchant(
            @PathVariable String merchantId,
            @RequestParam(required = false) String externalId) {

        List<String> merchantIds = new java.util.ArrayList<>();
        merchantIds.add(merchantId);
        if (externalId != null && !externalId.isBlank() && !externalId.equals(merchantId)) {
            merchantIds.add(externalId);
        }

        List<OrderDetailDto> pendingOrders = merchantIds.size() > 1
                ? orderService.getPendingRefundOrdersByMultipleIds(merchantIds)
                : orderService.getPendingRefundOrders(merchantId);
        return ResponseEntity.ok(Map.of(
                "merchantId", merchantId,
                "count", pendingOrders.size(),
                "orders", pendingOrders));
    }

    /**
     * 确认支付成功（内部接口）
     * 模拟支付服务回调，将支付成功信息同步到订单
     * POST /orders/internal/{orderId}/payment/confirm
     */
    @PostMapping("/{orderId}/payment/confirm")
    public ResponseEntity<?> confirmPayment(
            @PathVariable Long orderId,
            @RequestBody PaymentConfirmDto paymentDto) {

        return orderService.confirmPayment(orderId, paymentDto);
    }

    /**
     * 快速模拟支付成功（内部接口）
     * 简化版接口，只需传入订单ID即可完成模拟支付
     * POST /orders/internal/{orderId}/payment/mock
     */
    @PostMapping("/{orderId}/payment/mock")
    public ResponseEntity<?> mockPayment(@PathVariable Long orderId) {
        // 创建模拟支付信息
        PaymentConfirmDto mockPayment = new PaymentConfirmDto();
        mockPayment.setPaymentMethod("WECHAT");
        mockPayment.setPaymentTransactionId("MOCK_" + System.currentTimeMillis() + "_" + orderId);
        mockPayment.setPaymentChannel("APP");

        return orderService.confirmPayment(orderId, mockPayment);
    }

    /**
     * 商家接单（内部接口）
     * POST /orders/internal/{orderId}/accept
     */
    @PostMapping("/{orderId}/accept")
    public ResponseEntity<?> acceptOrder(
            @PathVariable Long orderId,
            @RequestParam String merchantId) {
        return orderService.acceptOrder(orderId, merchantId);
    }

    /**
     * 商家拒单（内部接口）
     * POST /orders/internal/{orderId}/reject
     */
    @PostMapping("/{orderId}/reject")
    public ResponseEntity<?> rejectOrder(
            @PathVariable Long orderId,
            @RequestParam String merchantId,
            @RequestParam(required = false) String reason) {
        return orderService.rejectOrder(orderId, merchantId, reason);
    }

    /**
     * 商家更新订单进度（内部接口）
     * POST /orders/internal/{orderId}/progress
     */
    @PostMapping("/{orderId}/progress")
    public ResponseEntity<?> updateOrderProgress(
            @PathVariable Long orderId,
            @RequestParam String merchantId,
            @RequestParam String status) {
        OrderStatus newStatus = OrderStatus.fromCode(status);
        if (newStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "无效的订单状态: " + status));
        }
        return orderService.updateOrderProgress(orderId, merchantId, newStatus);
    }

    /**
     * 获取商家的待处理订单列表（内部接口）
     * GET /orders/internal/merchant/{merchantId}/pending-orders
     * 支持同时传入externalId，兼容订单中merchant_id存的是数据库主键或外部ID
     */
    @GetMapping("/merchant/{merchantId}/pending-orders")
    public ResponseEntity<?> getPendingOrdersByMerchant(
            @PathVariable String merchantId,
            @RequestParam(required = false) String externalId,
            @RequestParam(required = false, defaultValue = "false") boolean includeCompleted) {

        // 构建所有可能的merchantId（数据库主键 + 外部ID）
        List<String> merchantIds = new java.util.ArrayList<>();
        merchantIds.add(merchantId);
        if (externalId != null && !externalId.isBlank() && !externalId.equals(merchantId)) {
            merchantIds.add(externalId);
        }

        // includeCompleted=true 时返回包括已完成、已配送、已取消的所有订单
        List<OrderStatus> statuses = includeCompleted
                ? List.of(OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.PREPARING,
                          OrderStatus.READY, OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED)
                : List.of(OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY);

        List<OrderDetailDto> pendingOrders = orderService.getMerchantOrdersByMultipleIds(merchantIds, statuses);
        return ResponseEntity.ok(Map.of(
                "merchantId", merchantId,
                "count", pendingOrders.size(),
                "orders", pendingOrders));
    }
}