package com.fooddelivery.marketingservice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 优惠券模板更新请求
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "优惠券模板更新请求")
public class UpdateCouponTemplateRequest {

    @Schema(description = "优惠券ID", example = "1")
    private Long id;

    @Schema(description = "优惠券名称", example = "新用户首单优惠")
    private String name;

    @Schema(description = "是否启用", example = "false")
    private Boolean enabled;

    @Schema(description = "增加的库存数量", example = "500")
    private Long addQuantity;
}
