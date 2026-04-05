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
public class DashboardOverviewDTO {

    // 订单统计
    private Long todayOrderCount;
    private Long totalOrderCount;
    private BigDecimal todayRevenue;
    private BigDecimal totalRevenue;
    private Double orderGrowthRate; // 相比昨日增长率

    // 用户统计
    private Long totalUserCount;
    private Long todayNewUserCount;
    private Long activeUserCount; // 最近7天活跃用户
    private Double userGrowthRate;

    // 商家统计
    private Long totalMerchantCount;
    private Long activeMerchantCount;
    private Long pendingMerchantCount; // 待审核商家
    private Double merchantGrowthRate;

    // 平台收入
    private BigDecimal todayCommission; // 今日佣金收入
    private BigDecimal monthCommission; // 本月佣金收入
    private BigDecimal pendingSettlement; // 待结算金额

    // 趋势数据（最近7天）
    private List<DailyStats> orderTrends;
    private List<DailyStats> revenueTrends;

    // 热门商家（TOP5）
    private List<MerchantRanking> topMerchants;

    // 系统状态
    private String systemStatus; // HEALTHY, WARNING, ERROR
    private Integer serviceHealthCount;
    private Integer totalServiceCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyStats {
        private String date;
        private Long count;
        private BigDecimal amount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MerchantRanking {
        private Long merchantId;
        private String merchantName;
        private Long orderCount;
        private BigDecimal revenue;
    }
}
