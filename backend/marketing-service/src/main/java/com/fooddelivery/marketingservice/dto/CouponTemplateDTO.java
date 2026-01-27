package com.fooddelivery.marketingservice.dto;

import com.fooddelivery.marketingservice.entity.CouponType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 优惠券模板DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponTemplateDTO {
    private Long id;
    private String name;
    private String description;
    private CouponType type;
    private BigDecimal minOrderAmount;
    private BigDecimal discountValue;
    private BigDecimal maxDiscount;
    private Integer totalQuantity;
    private Integer issuedQuantity;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Boolean enabled;
    private Boolean stackable;
    private String exclusiveIds;
    private String applicableMerchantIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
