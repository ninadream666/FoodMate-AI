package com.fooddelivery.platformservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 调整结算单金额请求（管理员）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustSettlementRequest {

    /**
     * 调整金额（可正可负）
     */
    @NotNull(message = "调整金额不能为空")
    private BigDecimal adjustmentAmount;

    /**
     * 调整原因
     */
    @NotBlank(message = "调整原因不能为空")
    @Size(max = 500, message = "调整原因最多500个字符")
    private String reason;
}
