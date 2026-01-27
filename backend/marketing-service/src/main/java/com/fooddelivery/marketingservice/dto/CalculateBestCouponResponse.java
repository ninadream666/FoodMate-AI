package com.fooddelivery.marketingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 优惠券计算结果DTO
 * 返回最优的优惠券组合方案
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculateBestCouponResponse {
    /**
     * 推荐的优惠券ID列表
     */
    private List<Long> selectedCouponIds;

    /**
     * 总优惠金额
     */
    private BigDecimal totalDiscount;

    /**
     * 优惠后的价格
     */
    private BigDecimal finalPrice;

    /**
     * 原始价格
     */
    private BigDecimal originalPrice;

    /**
     * 优惠方案说明
     */
    private String description;

    /**
     * 是否成功找到最优方案
     */
    private Boolean success;
}
