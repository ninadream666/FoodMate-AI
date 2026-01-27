package com.fooddelivery.platformservice.dto;

import com.fooddelivery.platformservice.entity.CommissionRecord;
import com.fooddelivery.platformservice.entity.CommissionStatus;
import com.fooddelivery.platformservice.entity.FeeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 分成记录DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionRecordDTO {

    private Long id;
    private Long orderId;
    private Long merchantId;
    private Long serviceId;
    private String serviceName;
    private BigDecimal orderAmount;
    private FeeType feeType;
    private String feeTypeDescription;
    private BigDecimal feeValue;
    private String feeDisplay;
    private BigDecimal commissionAmount;
    private CommissionStatus status;
    private String statusName;
    private LocalDateTime createdAt;
    private LocalDateTime settledAt;

    /**
     * 从实体转换
     */
    public static CommissionRecordDTO fromEntity(CommissionRecord entity) {
        return CommissionRecordDTO.builder()
                .id(entity.getId())
                .orderId(entity.getOrderId())
                .merchantId(entity.getMerchantId())
                .serviceId(entity.getService().getId())
                .serviceName(entity.getServiceName())
                .orderAmount(entity.getOrderAmount())
                .feeType(entity.getFeeType())
                .feeTypeDescription(getFeeTypeDescription(entity.getFeeType()))
                .feeValue(entity.getFeeValue())
                .feeDisplay(formatFeeDisplay(entity.getFeeType(), entity.getFeeValue()))
                .commissionAmount(entity.getCommissionAmount())
                .status(entity.getStatus())
                .statusName(getStatusName(entity.getStatus()))
                .createdAt(entity.getCreatedAt())
                .settledAt(entity.getSettledAt())
                .build();
    }

    private static String getFeeTypeDescription(FeeType feeType) {
        return switch (feeType) {
            case PERCENTAGE -> "按比例";
            case FIXED_PER_ORDER -> "固定/单";
            case FIXED_MONTHLY -> "固定/月";
        };
    }

    private static String formatFeeDisplay(FeeType feeType, BigDecimal feeValue) {
        return switch (feeType) {
            case PERCENTAGE -> feeValue.multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString() + "%";
            case FIXED_PER_ORDER, FIXED_MONTHLY -> "¥" + feeValue.stripTrailingZeros().toPlainString();
        };
    }

    private static String getStatusName(CommissionStatus status) {
        return switch (status) {
            case PENDING -> "待结算";
            case SETTLED -> "已结算";
            case REFUNDED -> "已退款";
        };
    }
}
