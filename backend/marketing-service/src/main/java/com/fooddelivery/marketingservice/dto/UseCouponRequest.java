package com.fooddelivery.marketingservice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 优惠券使用/核销请求
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "优惠券使用/核销请求")
public class UseCouponRequest {

    @Schema(description = "用户优惠券ID", example = "5")
    private Long couponId;

    @Schema(description = "订单ID", example = "100")
    private Long orderId;

    @Schema(description = "核销备注", example = "订单支付成功")
    private String remark;
}
