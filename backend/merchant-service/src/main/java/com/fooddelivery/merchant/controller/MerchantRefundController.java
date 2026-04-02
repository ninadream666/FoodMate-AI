package com.fooddelivery.merchant.controller;

import com.fooddelivery.merchant.client.OrderServiceClient;
import com.fooddelivery.merchant.entity.Merchant;
import com.fooddelivery.merchant.repository.MerchantRepository;
import com.fooddelivery.merchant.service.MerchantRefundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * 商家端 - 退款管理控制器
 */
@RestController
@RequestMapping("/merchants")
@RequiredArgsConstructor
@Slf4j
public class MerchantRefundController {

    private final MerchantRefundService refundService;
    private final OrderServiceClient orderServiceClient;
    private final MerchantRepository merchantRepository;

    /**
     * 商家批准或拒绝取消/退款
     */
    @PatchMapping("/{merchantId}/orders/{orderId}/approve-cancel")
    public ResponseEntity<?> approveCancellation(
            @PathVariable Long merchantId,
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        Boolean approved = (Boolean) request.get("approved");
        String rejectReason = (String) request.get("rejectReason");

        // 安全提取当前登录用户的userId
        Long currentUserId = getCurrentUserIdSafe(authentication);

        // 验证该userId是否拥有该merchantId的店铺（拥有店铺即为商家）
        Optional<Merchant> merchantOpt = merchantRepository.findByIdAndOwnerUserId(merchantId, currentUserId);
        if (merchantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "您无权操作该商家的订单"));
        }
        
        Merchant merchant = merchantOpt.get();
        log.info("商家用户 {} 处理店铺 {} (externalId={}) 的订单 {} 退款申请，决策={}", currentUserId, merchantId, merchant.getExternalId(), orderId, approved);

        return refundService.approveCancellation(merchantId, orderId, approved, rejectReason, merchant.getExternalId());
    }

    /**
     * 商家查看待审批的退款列表
     */
    @GetMapping("/{merchantId}/pending-refunds")
    public ResponseEntity<?> getPendingRefunds(
            @PathVariable Long merchantId,
            Authentication authentication) {
        
        // 安全提取当前登录用户的userId
        Long currentUserId = getCurrentUserIdSafe(authentication);

        // 验证该userId是否拥有该merchantId的店铺（拥有店铺即为商家）
        Optional<Merchant> merchantOpt = merchantRepository.findByIdAndOwnerUserId(merchantId, currentUserId);
        if (merchantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "您无权查看该商家的订单"));
        }
        
        Merchant merchant = merchantOpt.get();
        log.info("商家用户 {} 查询店铺 {} (externalId={}) 的待审批退款列表", currentUserId, merchantId, merchant.getExternalId());

        // 调用订单服务获取待审批订单列表（同时传入externalId，兼容订单中存的不同ID格式）
        try {
            return orderServiceClient.getPendingRefundsByMerchant(merchantId, merchant.getExternalId());
        } catch (Exception e) {
            log.error("获取待审批订单列表失败：merchantId={}, error={}", merchantId, e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "获取待审批订单列表失败：" + e.getMessage()));
        }
    }

    /**
     * 商家查看销售数据
     */
    @GetMapping("/{merchantId}/sales")
    public ResponseEntity<?> getSalesData(@PathVariable Long merchantId) {
        // TODO: 聚合订单服务的销售数据
        return ResponseEntity.ok(Map.of(
                "message", "销售数据统计功能即将实现",
                "merchantId", merchantId
        ));
    }
    
    /**
     * 辅助方法：检查用户是否有指定角色
     */
    private boolean hasRole(Authentication authentication, String role) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equalsIgnoreCase("ROLE_" + role));
    }

    /**
     * 辅助方法：安全提取当前登录用户的 userId，防止 String 与 Long 转换异常
     */
    private Long getCurrentUserIdSafe(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        return Long.parseLong(principal.toString());
    }
}