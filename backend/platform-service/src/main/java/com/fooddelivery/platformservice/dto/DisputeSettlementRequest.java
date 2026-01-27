package com.fooddelivery.platformservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 提交异议请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeSettlementRequest {

    @NotBlank(message = "异议原因不能为空")
    @Size(max = 500, message = "异议原因最多500个字符")
    private String reason;
}
