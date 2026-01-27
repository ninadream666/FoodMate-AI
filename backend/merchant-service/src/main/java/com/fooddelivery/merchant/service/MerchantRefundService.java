package com.fooddelivery.merchant.service;

import com.fooddelivery.merchant.client.OrderServiceClient;
import com.fooddelivery.merchant.client.UserServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MerchantRefundService {

    private final OrderServiceClient orderServiceClient;
    private final UserServiceClient userServiceClient;

    /**
     * 商家批准取消/退款
     * 
     * @param merchantId 商家ID
     * @param orderId 订单ID
     * @param approved 是否同意
     * @param rejectReason 拒绝原因（可选）
     * @return 操作结果
     */
    @Transactional
    public ResponseEntity<?> approveCancellation(
            Long merchantId,
            Long orderId,
            Boolean approved,
            String rejectReason) {
        
        try {
            // 1. 调用订单服务的内部接口，获取订单信息并验证订单是否属于该商家
            ResponseEntity<?> orderResponse = orderServiceClient.getOrderInternal(orderId);
            if (!orderResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "订单不存在或无法访问"));
            }

            // 解析订单信息
            @SuppressWarnings("unchecked")
            Map<String, Object> orderData = (Map<String, Object>) orderResponse.getBody();
            if (orderData == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "无法获取订单信息"));
            }

            // 验证订单是否属于该商家
            Long orderMerchantId = ((Number) orderData.get("merchantId")).longValue();
            if (!orderMerchantId.equals(merchantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "该订单不属于当前商家"));
            }

            // 验证订单状态，确保在 PENDING_CANCEL 状态
            String orderStatus = (String) orderData.get("status");
            if (!"PENDING_CANCEL".equals(orderStatus)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "订单不在待审批状态", "currentStatus", orderStatus));
            }

            Long userId = ((Number) orderData.get("userId")).longValue();
            
            if (approved) {
                // 2. 计算退款金额
                BigDecimal refundAmount = calculateRefundAmount(orderData);
                
                // 3. 同意退款 - 调用订单服务的内部接口
                ResponseEntity<?> updateResponse = orderServiceClient.updateOrderCancelStatusToApproved(orderId, refundAmount);
                if (!updateResponse.getStatusCode().is2xxSuccessful()) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "更新订单状态失败"));
                }
                
                // 4. 触发用户服务更新信用等级
                try {
                    Map<String, Object> cancellationData = new HashMap<>();
                    cancellationData.put("orderId", orderId);
                    cancellationData.put("cancelReason", "商家已批准退款");
                    userServiceClient.recordCancellation(userId, cancellationData);
                    log.info("已通知用户服务记录取消：userId={}, orderId={}", userId, orderId);
                } catch (Exception e) {
                    log.error("调用用户服务失败：{}", e.getMessage());
                    // 不影响主流程
                }
                
                // TODO: 5. 触发支付服务（未来实现）
                // PaymentServiceClient.refund(orderId, refundAmount)
                
                return ResponseEntity.ok(Map.of(
                        "message", "退款已批准",
                        "orderId", orderId,
                        "status", "APPROVED",
                        "refundAmount", refundAmount
                ));
            } else {
                // 拒绝退款 - 调用订单服务的内部接口
                ResponseEntity<?> updateResponse = orderServiceClient.updateOrderCancelStatusToRejected(orderId);
                if (!updateResponse.getStatusCode().is2xxSuccessful()) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "更新订单状态失败"));
                }
                
                return ResponseEntity.ok(Map.of(
                        "message", "退款申请已拒绝",
                        "orderId", orderId,
                        "status", "REJECTED",
                        "reason", rejectReason != null ? rejectReason : "商家拒绝"
                ));
            }
        } catch (Exception e) {
            log.error("处理退款审批失败：orderId={}, error={}", orderId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "处理失败: " + e.getMessage()));
        }
    }

    /**
     * 计算退款金额
     * 从订单数据中提取金额信息
     */
    private BigDecimal calculateRefundAmount(Map<String, Object> orderData) {
        try {
            // 从订单数据中获取总金额
            Object totalAmountObj = orderData.get("totalAmount");
            if (totalAmountObj instanceof Number) {
                return BigDecimal.valueOf(((Number) totalAmountObj).doubleValue());
            } else if (totalAmountObj instanceof BigDecimal) {
                return (BigDecimal) totalAmountObj;
            } else if (totalAmountObj instanceof String) {
                return new BigDecimal((String) totalAmountObj);
            }
            
            log.warn("无法解析订单金额，使用默认值0");
            return BigDecimal.ZERO;
        } catch (Exception e) {
            log.error("计算退款金额失败：{}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }
}
