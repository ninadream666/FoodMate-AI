package com.fooddelivery.platformservice.dto;

import com.fooddelivery.platformservice.entity.SettlementType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 生成结算单请求（管理员手动触发）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateSettlementRequest {

    /**
     * 结算类型
     */
    @NotNull(message = "结算类型不能为空")
    private SettlementType settlementType;

    /**
     * 周期开始日期（可选，不填则自动计算上一周期）
     */
    private LocalDate periodStart;

    /**
     * 周期结束日期（可选，不填则自动计算上一周期）
     */
    private LocalDate periodEnd;

    /**
     * 指定商家ID（可选，不填则为所有有未结算分成的商家生成）
     */
    private Long merchantId;

    /**
     * 是否包含历史数据（补生成历史结算单）
     */
    private Boolean includeHistorical;
}
