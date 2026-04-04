package com.fooddelivery.merchant.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 订单服务Feign客户端
 * 用于merchant-service调用order-service 的内部API
 */
@FeignClient(name = "order-service", path = "/orders/internal")
public interface OrderServiceClient {

    /**
     * 获取订单详细信息（内部接口）
     * GET /orders/internal/{orderId}
     */
    @GetMapping("/{orderId}")
    ResponseEntity<?> getOrderInternal(@PathVariable("orderId") Long orderId);

    /**
     * 更新订单取消状态为"已批准"（内部接口）
     * POST /orders/internal/{orderId}/cancel-status/approve
     */
    @PostMapping("/{orderId}/cancel-status/approve")
    ResponseEntity<?> updateOrderCancelStatusToApproved(
            @PathVariable("orderId") Long orderId,
            @RequestParam("refundAmount") BigDecimal refundAmount);

    /**
     * 更新订单取消状态为"已拒绝"（内部接口）
     * POST /orders/internal/{orderId}/cancel-status/reject
     */
    @PostMapping("/{orderId}/cancel-status/reject")
    ResponseEntity<?> updateOrderCancelStatusToRejected(
            @PathVariable("orderId") Long orderId);

    /**
     * 获取商家的待审批退款订单列表（内部接口）
     * GET /orders/internal/merchant/{merchantId}/pending-refunds
     */
    @GetMapping("/merchant/{merchantId}/pending-refunds")
    ResponseEntity<?> getPendingRefundsByMerchant(
            @PathVariable("merchantId") Long merchantId,
            @RequestParam(value = "externalId", required = false) String externalId);

    /**
     * 商家接单
     */
    @PostMapping("/{orderId}/accept")
    ResponseEntity<?> acceptOrder(
            @PathVariable("orderId") Long orderId,
            @RequestParam("merchantId") String merchantId);

    /**
     * 商家拒单
     */
    @PostMapping("/{orderId}/reject")
    ResponseEntity<?> rejectOrder(
            @PathVariable("orderId") Long orderId,
            @RequestParam("merchantId") String merchantId,
            @RequestParam(value = "reason", required = false) String reason);

    /**
     * 商家更新订单进度
     */
    @PostMapping("/{orderId}/progress")
    ResponseEntity<?> updateOrderProgress(
            @PathVariable("orderId") Long orderId,
            @RequestParam("merchantId") String merchantId,
            @RequestParam("status") String status);

    /**
     * 获取商家的待处理订单列表
     */
    @GetMapping("/merchant/{merchantId}/pending-orders")
    ResponseEntity<?> getPendingOrdersByMerchant(
            @PathVariable("merchantId") Long merchantId,
            @RequestParam(value = "externalId", required = false) String externalId);
}
