package com.fooddelivery.marketingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 优惠券类型统计DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponTypeStatsDTO {

    /**
     * 优惠券类型
     */
    private String couponType;

    /**
     * 类型名称
     */
    private String typeName;

    /**
     * 模板数量
     */
    private Long templateCount;

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
     * 总优惠金额
     */
    private BigDecimal totalDiscountAmount;

    /**
     * 平均优惠金额
     */
    private BigDecimal averageDiscountAmount;
}