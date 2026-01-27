package com.fooddelivery.marketingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 优惠券发放请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueCouponRequest {
    /**
     * 优惠券模板ID
     */
    private Long couponTemplateId;

    /**
     * 用户ID
     */
    private Long userId;
}
