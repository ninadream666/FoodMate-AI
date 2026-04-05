package com.fooddelivery.platformservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 结算统计DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementStatsDTO {

    /**
     * 总结算单数
     */
    private Long totalSettlements;

    /**
     * 待处理结算单
     */
    private Long pendingSettlements;

    /**
     * 已完成结算单
     */
    private Long completedSettlements;

    /**
     * 争议结算单
     */
    private Long disputedSettlements;

    /**
     * 总结算金额
     */
    private BigDecimal totalAmount;

    /**
     * 待结算金额
     */
    private BigDecimal pendingAmount;

    /**
     * 已打款金额
     */
    private BigDecimal paidAmount;

    /**
     * 月增长率（%）
     */
    private BigDecimal monthlyGrowthRate;

    /**
     * 平均结算金额
     */
    private BigDecimal averageSettlementAmount;

    // 兼容原有字段
    /**
     * 待确认数量
     */
    private Long pendingConfirmCount;

    /**
     * 已确认待打款数量
     */
    private Long pendingPaymentCount;

    /**
     * 待打款总金额
     */
    private BigDecimal pendingPaymentAmount;

    /**
     * 有异议数量
     */
    private Long disputedCount;

    /**
     * 本月已打款总额
     */
    private BigDecimal thisMonthPaidAmount;

    /**
     * 本月已打款数量
     */
    private Long thisMonthPaidCount;

    /**
     * 今日佣金收入
     */
    private BigDecimal todayCommission;

    /**
     * 本月佣金收入
     */
    private BigDecimal monthlyCommission;
}
