package com.fooddelivery.platformservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStatsDTO {

    // 订单分布
    private Map<String, Long> orderStatusDistribution;
    private Map<String, Long> paymentMethodDistribution;

    // 用户分布
    private Map<String, Long> userRoleDistribution;
    private Map<String, Long> userCreditDistribution;

    // 商家分布
    private Map<String, Long> merchantCategoryDistribution;
    private Map<String, Long> merchantStatusDistribution;

    // 营销数据
    private Long activeCouponCount;
    private Long usedCouponCount;
    private BigDecimal totalCouponDiscount;

    // 服务订阅
    private Long totalSubscriptionCount;
    private Map<String, Long> subscriptionByService;

    // 结算统计
    private Long pendingSettlementCount;
    private Long completedSettlementCount;
    private BigDecimal totalSettledAmount;
}
