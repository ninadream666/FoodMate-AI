package com.fooddelivery.marketingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 优惠券统计概览DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponStatsDTO {

    /**
     * 总优惠券模板数
     */
    private Long totalTemplates;

    /**
     * 活跃模板数
     */
    private Long activeTemplates;

    /**
     * 总发放数量
     */
    private Long totalIssued;

    /**
     * 总使用数量
     */
    private Long totalUsed;

    /**
     * 使用率（%）
     */
    private BigDecimal usageRate;

    /**
     * 总优惠金额
     */
    private BigDecimal totalSavings;

    /**
     * 本月发放数
     */
    private Long monthlyIssuance;

    /**
     * 本月使用数
     */
    private Long monthlyUsage;

    /**
     * 转化率（%）
     */
    private BigDecimal conversionRate;

    /**
     * 平均优惠金额
     */
    private BigDecimal averageDiscountAmount;
}