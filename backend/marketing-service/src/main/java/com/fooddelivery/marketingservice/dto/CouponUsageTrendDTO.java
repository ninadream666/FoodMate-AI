package com.fooddelivery.marketingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 优惠券使用趋势DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponUsageTrendDTO {

    /**
     * 日期
     */
    private LocalDate date;

    /**
     * 日期标签
     */
    private String dateLabel;

    /**
     * 发放数量
     */
    private Long issuedCount;

    /**
     * 使用数量
     */
    private Long usedCount;

    /**
     * 使用率 (%)
     */
    private BigDecimal usageRate;

    /**
     * 优惠金额
     */
    private BigDecimal discountAmount;

    /**
     * 参与用户数
     */
    private Long userCount;
}