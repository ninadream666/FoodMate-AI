package com.fooddelivery.platformservice.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 批量标记已打款请求（管理员）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchPayRequest {

    /**
     * 结算单ID列表
     */
    @NotEmpty(message = "结算单ID列表不能为空")
    private List<Long> settlementIds;
}
