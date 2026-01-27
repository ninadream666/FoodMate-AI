package com.fooddelivery.orderservice.dto;

import com.fooddelivery.common.enums.OrderStatus;
import com.fooddelivery.common.enums.PaymentMethod;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderDetailDto {
    private Long orderId;
    private String merchantId; // 支持数字 ID 或外部 ID
    private Long userId;
    private List<OrderItemDetailDto> orderItems;
    private BigDecimal originalAmount; // 原价（优惠前）
    private BigDecimal discountAmount; // 优惠金额
    private BigDecimal totalAmount; // 实付金额
    private OrderStatus status; // 使用枚举类型
    private String cancelStatus;
    private LocalDateTime createdAt;
    private Boolean canCancel; // 是否可以取消
    private String aiDiscountReason; // AI折扣原因

    // 支付相关字段
    private LocalDateTime paidAt; // 支付完成时间
    private PaymentMethod paymentMethod; // 使用枚举类型
    private String paymentTransactionId; // 第三方支付交易号
    private String paymentChannel; // 支付渠道：APP, MINI_PROGRAM, H5, WEB
    private Boolean isPaid; // 是否已支付
}
