package com.fooddelivery.marketingservice.dto;

import com.fooddelivery.marketingservice.entity.CouponStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户优惠券DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCouponDTO {
    private Long id;
    private Long userId;
    private Long couponTemplateId;
    private CouponStatus status;
    private Long orderId;
    private LocalDateTime obtainedAt;
    private LocalDateTime usedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 关联的优惠券模板信息
    private CouponTemplateDTO couponTemplate;
}
