package com.fooddelivery.marketingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 优惠券计算请求DTO
 * 用户下单时提交订单信息，返回最优优惠方案
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculateBestCouponRequest {
    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 商家ID（如果跨商家，可能需要分别计算）
     */
    private Long merchantId;

    /**
     * 订单商品列表
     */
    private List<OrderItemDTO> items;

    /**
     * 订单总金额（不含优惠）
     */
    private BigDecimal orderTotal;
}
