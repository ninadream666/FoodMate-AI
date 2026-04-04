package com.fooddelivery.platformservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 分成趋势数据DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementTrendDTO {

    /**
     * 日期
     */
    private LocalDate date;

    /**
     * 日期标签，如：2024-01-15, 2024年1月, 2024年第3周
     */
    private String dateLabel;

    /**
     * 结算单数量
     */
    private Long settlementCount;

    /**
     * 结算总金额
     */
    private BigDecimal totalAmount;

    /**
     * 已结算金额
     */
    private BigDecimal settledAmount;

    /**
     * 佣金收入
     */
    private BigDecimal commissionIncome;

    /**
     * 参与商家数量
     */
    private Long merchantCount;
}