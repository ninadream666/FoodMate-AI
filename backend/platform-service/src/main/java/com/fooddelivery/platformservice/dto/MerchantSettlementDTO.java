package com.fooddelivery.platformservice.dto;

import com.fooddelivery.platformservice.entity.MerchantSettlement;
import com.fooddelivery.platformservice.entity.SettlementStatus;
import com.fooddelivery.platformservice.entity.SettlementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 商家结算单DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantSettlementDTO {

    private Long id;
    private String settlementNo;
    private Long merchantId;
    private String merchantName;  // 管理员视角需要
    
    private SettlementType settlementType;
    private String settlementTypeName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String periodLabel;
    private String periodDisplay;
    
    // 金额
    private Integer totalOrderCount;
    private BigDecimal totalOrderAmount;
    private BigDecimal totalCommission;
    private BigDecimal adjustmentAmount;
    private String adjustmentReason;
    private BigDecimal netIncome;
    
    // 状态
    private SettlementStatus status;
    private String statusName;
    private LocalDateTime confirmDeadline;
    private LocalDateTime confirmedAt;
    private LocalDateTime paidAt;
    
    // 异议
    private String disputeReason;
    private LocalDateTime disputeAt;
    
    // 时间戳
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 分成明细（按服务分组）
    private List<ServiceCommissionSummary> serviceCommissions;

    /**
     * 从实体转换
     */
    public static MerchantSettlementDTO fromEntity(MerchantSettlement entity) {
        return fromEntity(entity, null);
    }

    public static MerchantSettlementDTO fromEntity(MerchantSettlement entity, String merchantName) {
        return MerchantSettlementDTO.builder()
                .id(entity.getId())
                .settlementNo(entity.getSettlementNo())
                .merchantId(entity.getMerchantId())
                .merchantName(merchantName)
                .settlementType(entity.getSettlementType())
                .settlementTypeName(getSettlementTypeName(entity.getSettlementType()))
                .periodStart(entity.getPeriodStart())
                .periodEnd(entity.getPeriodEnd())
                .periodLabel(entity.getPeriodLabel())
                .periodDisplay(formatPeriodDisplay(entity.getSettlementType(), entity.getPeriodLabel()))
                .totalOrderCount(entity.getTotalOrderCount())
                .totalOrderAmount(entity.getTotalOrderAmount())
                .totalCommission(entity.getTotalCommission())
                .adjustmentAmount(entity.getAdjustmentAmount())
                .adjustmentReason(entity.getAdjustmentReason())
                .netIncome(entity.getNetIncome())
                .status(entity.getStatus())
                .statusName(getStatusName(entity.getStatus()))
                .confirmDeadline(entity.getConfirmDeadline())
                .confirmedAt(entity.getConfirmedAt())
                .paidAt(entity.getPaidAt())
                .disputeReason(entity.getDisputeReason())
                .disputeAt(entity.getDisputeAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private static String getSettlementTypeName(SettlementType type) {
        return switch (type) {
            case WEEKLY -> "周结算";
            case MONTHLY -> "月结算";
        };
    }

    private static String getStatusName(SettlementStatus status) {
        return switch (status) {
            case PENDING_CONFIRM -> "待确认";
            case CONFIRMED -> "已确认";
            case DISPUTED -> "有异议";
            case PAID -> "已打款";
            case CANCELLED -> "已作废";
        };
    }

    private static String formatPeriodDisplay(SettlementType type, String periodLabel) {
        if (type == SettlementType.MONTHLY) {
            // periodLabel格式：2024-01
            String[] parts = periodLabel.split("-");
            if (parts.length == 2) {
                return parts[0] + "年" + Integer.parseInt(parts[1]) + "月";
            }
        } else {
            // periodLabel格式：2024-W03
            String[] parts = periodLabel.split("-W");
            if (parts.length == 2) {
                return parts[0] + "年第" + Integer.parseInt(parts[1]) + "周";
            }
        }
        return periodLabel;
    }

    /**
     * 按服务分组的分成汇总
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceCommissionSummary {
        private String serviceName;
        private String category;
        private String categoryName;
        private BigDecimal commissionAmount;
        private Long recordCount;
    }
}
