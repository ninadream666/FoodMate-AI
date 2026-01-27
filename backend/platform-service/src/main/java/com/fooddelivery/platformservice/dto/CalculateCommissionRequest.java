package com.fooddelivery.platformservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 计算分成请求（内部接口）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculateCommissionRequest {

    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @NotNull(message = "商家ID不能为空")
    private Long merchantId;

    @NotNull(message = "订单金额不能为空")
    @DecimalMin(value = "0", inclusive = false, message = "订单金额必须大于0")
    private BigDecimal orderAmount;
}
