package com.fooddelivery.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 管理员订单数据传输对象
 * 包含订单的完整信息以及状态的中文描述
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderDto {

    private Long id;
    private Long userId;
    private String merchantId;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal originalAmount;

    /**
     * 订单状态信息（包含状态码和中文描述）
     */
    private OrderStatusInfo status;

    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    /**
     * 支付方式信息（包含代码和中文描述）
     */
    private PaymentMethodInfo paymentMethod;

    private String paymentTransactionId;
    private String paymentChannel;
    private String cancelReason;
    private String cancelStatus;
    private BigDecimal refundAmount;
    private LocalDateTime refundApprovedAt;

    /**
     * 订单状态信息内部类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderStatusInfo {
        /**
         * 状态码：pending, paid, completed, cancelled
         */
        private String code;

        /**
         * 状态中文描述：待支付、已支付、已完成、已取消
         */
        private String description;
    }

    /**
     * 支付方式信息内部类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentMethodInfo {
        /**
         * 支付方式代码：WECHAT, ALIPAY, CASH, CARD）
         */
        private String code;

        /**
         * 支付方式中文描述：微信支付、支付宝、现金支付、银行卡支付
         */
        private String description;
    }
}
