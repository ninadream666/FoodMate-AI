package com.fooddelivery.platformservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 分成记录实体
 * 记录每笔订单产生的各项分成明细
 */
@Entity
@Table(name = "commission_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 订单ID（逻辑外键，不强制关联）
     */
    @Column(name = "order_id", nullable = false)
    private Long orderId;

    /**
     * 商家ID
     */
    @Column(name = "merchant_id", nullable = false)
    private Long merchantId;

    /**
     * 关联的平台服务
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private PlatformService service;

    /**
     * 关联的结算单（可空，未结算时为空）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id")
    private MerchantSettlement settlement;

    /**
     * 服务名称（冗余存储，便于历史查询）
     */
    @Column(name = "service_name", nullable = false, length = 100)
    private String serviceName;

    /**
     * 订单金额
     */
    @Column(name = "order_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal orderAmount;

    /**
     * 收费类型（冗余存储）
     */
    @Column(name = "fee_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private FeeType feeType;

    /**
     * 费率/固定值（冗余存储）
     */
    @Column(name = "fee_value", nullable = false, precision = 10, scale = 4)
    private BigDecimal feeValue;

    /**
     * 计算出的分成金额
     */
    @Column(name = "commission_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal commissionAmount;

    /**
     * 分成状态
     */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private CommissionStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 结算时间
     */
    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = CommissionStatus.PENDING;
        }
    }
}
