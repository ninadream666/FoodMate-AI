package com.fooddelivery.platformservice.dto;

import com.fooddelivery.platformservice.entity.MerchantServiceSubscription;
import com.fooddelivery.platformservice.entity.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 订阅信息DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionDTO {

    private Long id;
    private Long merchantId;
    private Long serviceId;
    private String serviceCode;
    private String serviceName;
    private String feeDisplay;
    private Boolean isMandatory;
    private SubscriptionStatus status;
    private String statusName;
    private LocalDateTime subscribedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime cancelledAt;
    private String cancelReason;

    /**
     * 从实体转换
     */
    public static SubscriptionDTO fromEntity(MerchantServiceSubscription entity) {
        return SubscriptionDTO.builder()
                .id(entity.getId())
                .merchantId(entity.getMerchantId())
                .serviceId(entity.getService().getId())
                .serviceCode(entity.getService().getServiceCode())
                .serviceName(entity.getService().getServiceName())
                .feeDisplay(formatFeeDisplay(entity))
                .isMandatory(entity.getService().getIsMandatory())
                .status(entity.getStatus())
                .statusName(getStatusName(entity.getStatus()))
                .subscribedAt(entity.getSubscribedAt())
                .expiresAt(entity.getExpiresAt())
                .cancelledAt(entity.getCancelledAt())
                .cancelReason(entity.getCancelReason())
                .build();
    }

    private static String formatFeeDisplay(MerchantServiceSubscription entity) {
        var service = entity.getService();
        var feeValue = service.getFeeValue();
        return switch (service.getFeeType()) {
            case PERCENTAGE -> feeValue.multiply(java.math.BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString() + "%";
            case FIXED_PER_ORDER -> "¥" + feeValue.stripTrailingZeros().toPlainString() + "/单";
            case FIXED_MONTHLY -> "¥" + feeValue.stripTrailingZeros().toPlainString() + "/月";
        };
    }

    private static String getStatusName(SubscriptionStatus status) {
        return switch (status) {
            case ACTIVE -> "生效中";
            case CANCELLED -> "已取消";
            case EXPIRED -> "已过期";
        };
    }
}
