package com.fooddelivery.platformservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 计算分成响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculateCommissionResponse {

    private Long orderId;
    private Long merchantId;
    private BigDecimal orderAmount;

    /**
     * 总分成金额
     */
    private BigDecimal totalCommission;

    /**
     * 净收入（订单金额 - 总分成）
     */
    private BigDecimal netIncome;

    /**
     * 分成明细
     */
    private List<CommissionDetail> details;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommissionDetail {
        private Long serviceId;
        private String serviceName;
        private String feeDisplay;
        private BigDecimal commissionAmount;
    }
}
