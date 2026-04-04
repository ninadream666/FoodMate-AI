package com.fooddelivery.platformservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 商家结算单实体
 */
@Entity
@Table(name = "merchant_settlements",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_merchant_settlement_period",
           columnNames = {"merchant_id", "settlement_type", "period_label"}
       ))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 结算单号，如 ST202401M001001
     */
    @Column(name = "settlement_no", unique = true, nullable = false, length = 32)
    private String settlementNo;

    /**
     * 商家ID
     */
    @Column(name = "merchant_id", nullable = false)
    private Long merchantId;

    /**
     * 结算类型：WEEKLY / MONTHLY
     */
    @Column(name = "settlement_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private SettlementType settlementType;

    /**
     * 周期开始日期
     */
    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    /**
     * 周期结束日期
     */
    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    /**
     * 周期标签，如2024-01或2024-W03
     */
    @Column(name = "period_label", nullable = false, length = 20)
    private String periodLabel;

    // ==================== 金额字段 ====================

    /**
     * 订单总数
     */
    @Column(name = "total_order_count", nullable = false)
    private Integer totalOrderCount;

    /**
     * 订单总金额（GMV）
     */
    @Column(name = "total_order_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalOrderAmount;

    /**
     * 平台总分成
     */
    @Column(name = "total_commission", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCommission;

    /**
     * 调整金额（可正可负）
     */
    @Column(name = "adjustment_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal adjustmentAmount;

    /**
     * 调整原因
     */
    @Column(name = "adjustment_reason", length = 500)
    private String adjustmentReason;

    /**
     * 商家净收入=订单金额-分成+调整
     */
    @Column(name = "net_income", nullable = false, precision = 12, scale = 2)
    private BigDecimal netIncome;

    // ==================== 状态字段 ====================

    /**
     * 结算单状态
     */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private SettlementStatus status;

    /**
     * 确认截止时间（超时自动确认）
     */
    @Column(name = "confirm_deadline")
    private LocalDateTime confirmDeadline;

    /**
     * 确认时间
     */
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    /**
     * 打款时间
     */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // ==================== 异议字段 ====================

    /**
     * 异议原因
     */
    @Column(name = "dispute_reason", length = 500)
    private String disputeReason;

    /**
     * 异议时间
     */
    @Column(name = "dispute_at")
    private LocalDateTime disputeAt;

    // ==================== 时间戳 ====================

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = SettlementStatus.PENDING_CONFIRM;
        }
        if (adjustmentAmount == null) {
            adjustmentAmount = BigDecimal.ZERO;
        }
        if (totalOrderCount == null) {
            totalOrderCount = 0;
        }
        if (totalOrderAmount == null) {
            totalOrderAmount = BigDecimal.ZERO;
        }
        if (totalCommission == null) {
            totalCommission = BigDecimal.ZERO;
        }
        if (netIncome == null) {
            netIncome = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 重新计算净收入
     */
    public void recalculateNetIncome() {
        this.netIncome = this.totalOrderAmount
                .subtract(this.totalCommission)
                .add(this.adjustmentAmount);
    }
}
