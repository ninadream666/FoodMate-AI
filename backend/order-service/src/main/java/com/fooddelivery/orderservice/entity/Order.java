package com.fooddelivery.orderservice.entity;

import com.fooddelivery.common.enums.OrderStatus;
import com.fooddelivery.common.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(name = "merchant_id")
    private String merchantId; // 支持数字ID或外部ID

    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status; // 使用枚举类型

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> items;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // 取消/退款流程字段
    @Column(name = "cancel_reason")
    private String cancelReason;

    @Column(name = "cancel_status")
    private String cancelStatus; // PENDING_APPROVAL, APPROVED, REJECTED

    @Column(name = "refund_amount")
    private BigDecimal refundAmount;

    @Column(name = "refund_approved_at")
    private LocalDateTime refundApprovedAt;

    // 价格追踪字段
    @Column(name = "discount_amount")
    private BigDecimal discountAmount;

    @Column(name = "original_amount")
    private BigDecimal originalAmount;

    @Column(name = "original_item_price")
    private BigDecimal originalItemPrice;

    @Column(name = "applied_pricing_strategy_id")
    private Long appliedPricingStrategyId;

    @Column(name = "ai_discount_reason")
    private String aiDiscountReason;

    // 支付相关字段
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "payment_method", length = 20)
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod; // 使用枚举类型

    @Column(name = "payment_transaction_id", length = 100)
    private String paymentTransactionId; // 第三方支付交易号

    @Column(name = "payment_channel", length = 50)
    private String paymentChannel; // APP, MINI_PROGRAM, H5, WEB
}