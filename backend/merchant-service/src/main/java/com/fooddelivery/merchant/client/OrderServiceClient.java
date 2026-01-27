package com.fooddelivery.merchant.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 订单服务 Feign 客户端
 * 用于 merchant-service 调用 order-service 的内部 API
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
    ResponseEntity<?> getPendingRefundsByMerchant(@PathVariable("merchantId") Long merchantId);
}
