package com.fooddelivery.marketingservice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 平台发放优惠券请求
 * 用于管理员通过平台接口发放优惠券给指定用户
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "平台管理员发放优惠券请求")
public class AdminIssueCouponRequest {

    @Schema(description = "优惠券模板ID", example = "1")
    private Long couponTemplateId;

    @Schema(description = "接收优惠券的用户ID", example = "1")
    private Long userId;

    @Schema(description = "发放备注", example = "新用户首单优惠")
    private String remark;
}
