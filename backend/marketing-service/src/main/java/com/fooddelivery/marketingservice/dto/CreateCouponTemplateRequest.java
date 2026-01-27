package com.fooddelivery.marketingservice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 优惠券模板创建请求
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "优惠券模板创建请求")
public class CreateCouponTemplateRequest {

    @Schema(description = "优惠券名称", example = "新用户首单优惠")
    private String name;

    @Schema(description = "优惠券类型", example = "DISCOUNT")
    private String type;

    @Schema(description = "折扣值（折扣券为0.9表示9折，满减券为5表示减5元）", example = "10")
    private BigDecimal discountValue;

    @Schema(description = "最高优惠金额限制", example = "50")
    private BigDecimal maxDiscount;

    @Schema(description = "最低订单金额要求", example = "30")
    private BigDecimal minOrderAmount;

    @Schema(description = "发放总量", example = "1000")
    private Long totalQuantity;

    @Schema(description = "是否启用", example = "true")
    private Boolean enabled;

    @Schema(description = "是否可叠加", example = "true")
    private Boolean stackable;

    @Schema(description = "有效期开始时间（ISO-8601格式）", example = "2025-01-01T00:00:00")
    private String validFrom;

    @Schema(description = "有效期结束时间（ISO-8601格式）", example = "2025-12-31T23:59:59")
    private String validUntil;

    @Schema(description = "互斥优惠券ID列表（JSON字符串）", example = "[1,2,3]")
    private String exclusiveIds;

    @Schema(description = "适用商户ID列表（JSON字符串，null表示全部商户）", example = "[1,2,3]")
    private String applicableMerchantIds;
}
