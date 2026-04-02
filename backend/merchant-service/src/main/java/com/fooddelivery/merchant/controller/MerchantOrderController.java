package com.fooddelivery.merchant.controller;

import com.fooddelivery.merchant.client.OrderServiceClient;
import com.fooddelivery.merchant.entity.Merchant;
import com.fooddelivery.merchant.repository.MerchantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * 商家端 - 订单管理控制器
 * 提供接单、拒单、订单进度更新等功能
 */
@RestController
@RequestMapping("/merchants")
@RequiredArgsConstructor
@Slf4j
public class MerchantOrderController {

    private final OrderServiceClient orderServiceClient;
    private final MerchantRepository merchantRepository;

    /**
     * 获取商家待处理订单列表
     * GET /merchants/{merchantId}/orders/pending
     */
    @GetMapping("/{merchantId}/orders/pending")
    public ResponseEntity<?> getPendingOrders(
            @PathVariable Long merchantId,
            Authentication authentication) {

        Long currentUserId = extractUserId(authentication);
        Optional<Merchant> merchantOpt = merchantRepository.findByIdAndOwnerUserId(merchantId, currentUserId);
        if (merchantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "您无权查看该商家的订单"));
        }

        Merchant merchant = merchantOpt.get();
        log.info("商家用户 {} 查询店铺 {} (externalId={}) 的待处理订单", currentUserId, merchantId, merchant.getExternalId());

        try {
            return orderServiceClient.getPendingOrdersByMerchant(merchantId, merchant.getExternalId());
        } catch (Exception e) {
            log.error("获取待处理订单失败：merchantId={}, error={}", merchantId, e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "获取待处理订单失败：" + e.getMessage()));
        }
    }

    /**
     * 商家接单
     * POST /merchants/{merchantId}/orders/{orderId}/accept
     */
    @PostMapping("/{merchantId}/orders/{orderId}/accept")
    public ResponseEntity<?> acceptOrder(
            @PathVariable Long merchantId,
            @PathVariable Long orderId,
            Authentication authentication) {

        Long currentUserId = extractUserId(authentication);
        Optional<Merchant> merchantOpt = merchantRepository.findByIdAndOwnerUserId(merchantId, currentUserId);
        if (merchantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "您无权操作该商家的订单"));
        }

        String effectiveId = resolveOrderMerchantId(merchantOpt.get());
        log.info("商家用户 {} 接单: merchantId={}, effectiveId={}, orderId={}", currentUserId, merchantId, effectiveId, orderId);

        try {
            return orderServiceClient.acceptOrder(orderId, effectiveId);
        } catch (Exception e) {
            log.error("接单失败：orderId={}, error={}", orderId, e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "接单失败：" + e.getMessage()));
        }
    }

    /**
     * 商家拒单
     * POST /merchants/{merchantId}/orders/{orderId}/reject
     */
    @PostMapping("/{merchantId}/orders/{orderId}/reject")
    public ResponseEntity<?> rejectOrder(
            @PathVariable Long merchantId,
            @PathVariable Long orderId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        Long currentUserId = extractUserId(authentication);
        Optional<Merchant> merchantOpt = merchantRepository.findByIdAndOwnerUserId(merchantId, currentUserId);
        if (merchantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "您无权操作该商家的订单"));
        }

        String reason = body != null ? body.get("reason") : null;
        String effectiveId = resolveOrderMerchantId(merchantOpt.get());
        log.info("商家用户 {} 拒单: merchantId={}, effectiveId={}, orderId={}, reason={}", currentUserId, merchantId, effectiveId, orderId, reason);

        try {
            return orderServiceClient.rejectOrder(orderId, effectiveId, reason);
        } catch (Exception e) {
            log.error("拒单失败：orderId={}, error={}", orderId, e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "拒单失败：" + e.getMessage()));
        }
    }

    /**
     * 商家更新订单进度
     * POST /merchants/{merchantId}/orders/{orderId}/progress
     */
    @PostMapping("/{merchantId}/orders/{orderId}/progress")
    public ResponseEntity<?> updateProgress(
            @PathVariable Long merchantId,
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        Long currentUserId = extractUserId(authentication);
        Optional<Merchant> merchantOpt = merchantRepository.findByIdAndOwnerUserId(merchantId, currentUserId);
        if (merchantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "您无权操作该商家的订单"));
        }

        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "缺少 status 参数"));
        }

        String effectiveId = resolveOrderMerchantId(merchantOpt.get());
        log.info("商家用户 {} 更新订单进度: orderId={}, effectiveId={}, targetStatus={}", currentUserId, orderId, effectiveId, status);

        try {
            return orderServiceClient.updateOrderProgress(orderId, effectiveId, status);
        } catch (Exception e) {
            log.error("更新订单进度失败：orderId={}, error={}", orderId, e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "更新进度失败：" + e.getMessage()));
        }
    }

    /**
     * 获取订单中实际使用的 merchantId
     * 订单表中的 merchant_id 可能是外部ID（如高德POI ID），优先使用外部ID
     */
    private String resolveOrderMerchantId(Merchant merchant) {
        if (merchant.getExternalId() != null && !merchant.getExternalId().isBlank()) {
            return merchant.getExternalId();
        }
        return String.valueOf(merchant.getId());
    }

    private Long extractUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        return Long.parseLong(principal.toString());
    }
}
