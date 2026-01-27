package com.fooddelivery.platformservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 分成汇总DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionSummaryDTO {

    /**
     * 总分成金额
     */
    private BigDecimal totalCommission;

    /**
     * 待结算金额
     */
    private BigDecimal pendingCommission;

    /**
     * 已结算金额
     */
    private BigDecimal settledCommission;

    /**
     * 订单总数
     */
    private Long orderCount;

    /**
     * 订单总金额
     */
    private BigDecimal totalOrderAmount;

    /**
     * 净收入（订单金额 - 分成）
     */
    private BigDecimal netIncome;

    /**
     * 分成率（分成/订单金额）
     */
    private BigDecimal commissionRate;

    /**
     * 按服务类别的分成明细
     */
    private List<CategoryCommissionDTO> categoryDetails;

    /**
     * 按服务类别的分成DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryCommissionDTO {
        private String category;
        private String categoryName;
        private BigDecimal commissionAmount;
        private Long recordCount;
    }
}
