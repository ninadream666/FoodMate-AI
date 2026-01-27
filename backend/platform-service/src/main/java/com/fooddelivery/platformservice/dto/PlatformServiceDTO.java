package com.fooddelivery.platformservice.dto;

import com.fooddelivery.platformservice.entity.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 平台服务DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformServiceDTO {

    private Long id;
    private String serviceCode;
    private String serviceName;
    private ServiceCategory category;
    private String categoryName;
    private String description;
    private FeeType feeType;
    private String feeTypeDescription;
    private BigDecimal feeValue;
    private String feeDisplay;  // 格式化显示，如"3%"或"¥2.00/单"
    private BillingCycle billingCycle;
    private BigDecimal minOrderAmount;
    private Boolean isMandatory;
    private ServiceStatus status;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 商家视角的额外字段
    private Boolean isSubscribed;  // 当前商家是否已订阅
    private Long subscriptionId;   // 订阅ID（如已订阅）

    /**
     * 从实体转换
     */
    public static PlatformServiceDTO fromEntity(PlatformService entity) {
        return fromEntity(entity, null, null);
    }

    /**
     * 从实体转换（含订阅信息）
     */
    public static PlatformServiceDTO fromEntity(PlatformService entity, Boolean isSubscribed, Long subscriptionId) {
        PlatformServiceDTO dto = PlatformServiceDTO.builder()
                .id(entity.getId())
                .serviceCode(entity.getServiceCode())
                .serviceName(entity.getServiceName())
                .category(entity.getCategory())
                .categoryName(getCategoryName(entity.getCategory()))
                .description(entity.getDescription())
                .feeType(entity.getFeeType())
                .feeTypeDescription(getFeeTypeDescription(entity.getFeeType()))
                .feeValue(entity.getFeeValue())
                .feeDisplay(formatFeeDisplay(entity.getFeeType(), entity.getFeeValue(), entity.getBillingCycle()))
                .billingCycle(entity.getBillingCycle())
                .minOrderAmount(entity.getMinOrderAmount())
                .isMandatory(entity.getIsMandatory())
                .status(entity.getStatus())
                .sortOrder(entity.getSortOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .isSubscribed(isSubscribed)
                .subscriptionId(subscriptionId)
                .build();
        return dto;
    }

    private static String getCategoryName(ServiceCategory category) {
        return switch (category) {
            case BASIC -> "基础服务";
            case TRAFFIC -> "流量服务";
            case DELIVERY -> "配送服务";
            case OPERATION -> "运营服务";
        };
    }

    private static String getFeeTypeDescription(FeeType feeType) {
        return switch (feeType) {
            case PERCENTAGE -> "按比例收费";
            case FIXED_PER_ORDER -> "每单固定费用";
            case FIXED_MONTHLY -> "月度固定费用";
        };
    }

    private static String formatFeeDisplay(FeeType feeType, BigDecimal feeValue, BillingCycle billingCycle) {
        return switch (feeType) {
            case PERCENTAGE -> feeValue.multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString() + "%";
            case FIXED_PER_ORDER -> "¥" + feeValue.stripTrailingZeros().toPlainString() + "/单";
            case FIXED_MONTHLY -> "¥" + feeValue.stripTrailingZeros().toPlainString() + "/月";
        };
    }
}
