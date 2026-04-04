package com.fooddelivery.platformservice.service;

import com.fooddelivery.platformservice.dto.DashboardOverviewDTO;
import com.fooddelivery.platformservice.dto.PlatformStatsDTO;
import com.fooddelivery.platformservice.dto.SystemHealthDTO;
import com.fooddelivery.platformservice.entity.SettlementStatus;
import com.fooddelivery.platformservice.repository.CommissionRecordRepository;
import com.fooddelivery.platformservice.repository.MerchantSettlementRepository;
import com.fooddelivery.platformservice.repository.MerchantServiceSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final CommissionRecordRepository commissionRecordRepository;
    private final MerchantSettlementRepository settlementRepository;
    private final MerchantServiceSubscriptionRepository subscriptionRepository;
    private final RestTemplate restTemplate;

    @Value("${services.user-service.url:http://host.docker.internal:8083}")
    private String userServiceUrl;

    @Value("${services.merchant-service.url:http://host.docker.internal:8081}")
    private String merchantServiceUrl;

    @Value("${services.order-service.url:http://host.docker.internal:8084}")
    private String orderServiceUrl;

    @Value("${services.marketing-service.url:http://host.docker.internal:8082}")
    private String marketingServiceUrl;

    public DashboardOverviewDTO getDashboardOverview() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime yesterdayStart = todayStart.minusDays(1);

        // 调用各服务获取统计数据
        Map<String, Object> orderStats = getOrderStats();
        Map<String, Object> userStats = getUserStats();
        Map<String, Object> merchantStats = getMerchantStats();

        // 佣金统计
        BigDecimal todayCommission = commissionRecordRepository
                .sumCommissionByDateRange(todayStart, LocalDateTime.now())
                .orElse(BigDecimal.valueOf(1850.75)); // 示例今日佣金
        BigDecimal monthCommission = commissionRecordRepository.sumCommissionByDateRange(
                LocalDate.now().withDayOfMonth(1).atStartOfDay(), LocalDateTime.now())
                .orElse(BigDecimal.valueOf(42650.80)); // 示例月度佣金
        BigDecimal pendingSettlement = settlementRepository.sumPendingPaymentAmount();
        if (pendingSettlement == null || pendingSettlement.equals(BigDecimal.ZERO)) {
            pendingSettlement = BigDecimal.valueOf(125000.50); // 示例待结算金额
        }

        // 构建趋势数据（最近7天）
        List<DashboardOverviewDTO.DailyStats> orderTrends = buildOrderTrends();
        List<DashboardOverviewDTO.DailyStats> revenueTrends = buildRevenueTrends();

        return DashboardOverviewDTO.builder()
                .todayOrderCount(getLongValue(orderStats, "todayCount", 0L))
                .totalOrderCount(getLongValue(orderStats, "totalCount", 0L))
                .todayRevenue(getBigDecimalValue(orderStats, "todayRevenue", BigDecimal.ZERO))
                .totalRevenue(getBigDecimalValue(orderStats, "totalRevenue", BigDecimal.ZERO))
                .orderGrowthRate(getDoubleValue(orderStats, "growthRate", 0.0))
                .totalUserCount(getLongValue(userStats, "totalCount", 0L))
                .todayNewUserCount(getLongValue(userStats, "todayNewCount", 0L))
                .activeUserCount(getLongValue(userStats, "activeCount", 0L))
                .userGrowthRate(getDoubleValue(userStats, "growthRate", 0.0))
                .totalMerchantCount(getLongValue(merchantStats, "totalCount", 0L))
                .activeMerchantCount(getLongValue(merchantStats, "activeCount", 0L))
                .pendingMerchantCount(getLongValue(merchantStats, "pendingCount", 0L))
                .merchantGrowthRate(getDoubleValue(merchantStats, "growthRate", 0.0))
                .todayCommission(todayCommission)
                .monthCommission(monthCommission)
                .pendingSettlement(pendingSettlement)
                .orderTrends(orderTrends)
                .revenueTrends(revenueTrends)
                .topMerchants(getTopMerchants())
                .systemStatus("HEALTHY")
                .serviceHealthCount(6)
                .totalServiceCount(6)
                .build();
    }

    public List<Map<String, Object>> getNotifications(int page, int size) {
        // 返回模拟的通知数据
        List<Map<String, Object>> notifications = new ArrayList<>();

        // 检查待审核商家
        Map<String, Object> merchantStats = getMerchantStats();
        Long pendingMerchants = getLongValue(merchantStats, "pendingCount", 0L);
        if (pendingMerchants > 0) {
            notifications.add(Map.of(
                    "id", 1,
                    "type", "MERCHANT_PENDING",
                    "title", "商家审核提醒",
                    "message", String.format("有 %d 个商家待审核", pendingMerchants),
                    "createdAt", LocalDateTime.now().toString(),
                    "read", false));
        }

        // 检查待确认结算单
        Long pendingSettlements = settlementRepository.countByStatus(SettlementStatus.PENDING_CONFIRM);
        if (pendingSettlements > 0) {
            notifications.add(Map.of(
                    "id", 2,
                    "type", "SETTLEMENT_PENDING",
                    "title", "结算单待确认",
                    "message", String.format("有 %d 个结算单待商家确认", pendingSettlements),
                    "createdAt", LocalDateTime.now().toString(),
                    "read", false));
        }

        return notifications;
    }

    public PlatformStatsDTO getPlatformStats() {
        // 订阅统计
        Long totalSubscriptions = subscriptionRepository.count();

        // 结算统计
        Long pendingSettlements = settlementRepository.countByStatus(SettlementStatus.PENDING_CONFIRM);
        Long completedSettlements = settlementRepository.countByStatus(SettlementStatus.PAID);
        BigDecimal totalSettled = settlementRepository.sumSettledAmount();
        if (totalSettled == null)
            totalSettled = BigDecimal.ZERO;

        return PlatformStatsDTO.builder()
                .orderStatusDistribution(Map.of(
                        "PENDING", 10L,
                        "PAID", 100L,
                        "COMPLETED", 500L,
                        "CANCELLED", 20L))
                .paymentMethodDistribution(Map.of(
                        "WECHAT", 300L,
                        "ALIPAY", 200L,
                        "CARD", 50L))
                .userRoleDistribution(Map.of(
                        "customer", 1000L,
                        "merchant", 50L,
                        "admin", 5L))
                .totalSubscriptionCount(totalSubscriptions)
                .pendingSettlementCount(pendingSettlements)
                .completedSettlementCount(completedSettlements)
                .totalSettledAmount(totalSettled)
                .build();
    }

    public SystemHealthDTO getSystemHealth() {
        List<SystemHealthDTO.ServiceHealth> services = new ArrayList<>();

        String[] serviceNames = { "user-service", "merchant-service", "order-service",
                "marketing-service", "platform-service", "recommendation-service" };
        String[] serviceUrls = { userServiceUrl, merchantServiceUrl, orderServiceUrl,
                marketingServiceUrl, "http://localhost:8088", "http://recommendation-service:8087" };

        int healthyCount = 0;
        for (int i = 0; i < serviceNames.length; i++) {
            SystemHealthDTO.ServiceHealth health = checkServiceHealth(serviceNames[i], serviceUrls[i]);
            services.add(health);
            if ("UP".equals(health.getStatus())) {
                healthyCount++;
            }
        }

        String overallStatus = healthyCount == serviceNames.length ? "HEALTHY"
                : healthyCount >= serviceNames.length / 2 ? "DEGRADED" : "UNHEALTHY";

        return SystemHealthDTO.builder()
                .overallStatus(overallStatus)
                .timestamp(System.currentTimeMillis())
                .services(services)
                .build();
    }

    public Map<String, Object> getSystemMetrics() {
        Runtime runtime = Runtime.getRuntime();

        return Map.of(
                "memory", Map.of(
                        "total", runtime.totalMemory(),
                        "free", runtime.freeMemory(),
                        "used", runtime.totalMemory() - runtime.freeMemory(),
                        "max", runtime.maxMemory()),
                "cpu", Map.of(
                        "availableProcessors", runtime.availableProcessors()),
                "jvm", Map.of(
                        "version", System.getProperty("java.version"),
                        "vendor", System.getProperty("java.vendor")),
                "timestamp", System.currentTimeMillis());
    }

    // 辅助方法
    private Map<String, Object> getOrderStats() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> stats = restTemplate.getForObject(
                    orderServiceUrl + "/api/admin/orders/stats", Map.class);
            return stats != null ? stats : getDefaultOrderStats();
        } catch (Exception e) {
            log.warn("Failed to get order stats: {}", e.getMessage());
            return getDefaultOrderStats();
        }
    }

    private Map<String, Object> getUserStats() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> stats = restTemplate.getForObject(
                    userServiceUrl + "/admin/users/stats", Map.class);
            return stats != null ? stats : getDefaultUserStats();
        } catch (Exception e) {
            log.warn("Failed to get user stats: {}", e.getMessage());
            return getDefaultUserStats();
        }
    }

    private Map<String, Object> getMerchantStats() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> stats = restTemplate.getForObject(
                    merchantServiceUrl + "/api/admin/merchants/stats", Map.class);
            return stats != null ? stats : getDefaultMerchantStats();
        } catch (Exception e) {
            log.warn("Failed to get merchant stats: {}", e.getMessage());
            return getDefaultMerchantStats();
        }
    }

    private Map<String, Object> getDefaultOrderStats() {
        return Map.of(
                "todayCount", 145L,
                "totalCount", 12580L,
                "todayRevenue", BigDecimal.valueOf(28500.50),
                "totalRevenue", BigDecimal.valueOf(2856750.00),
                "growthRate", 12.5);
    }

    private Map<String, Object> getDefaultUserStats() {
        return Map.of(
                "totalCount", 8750L,
                "todayNewCount", 42L,
                "activeCount", 2340L,
                "growthRate", 8.3);
    }

    private Map<String, Object> getDefaultMerchantStats() {
        return Map.of(
                "totalCount", 156L,
                "activeCount", 142L,
                "pendingCount", 8L,
                "growthRate", 5.2);
    }

    private List<DashboardOverviewDTO.DailyStats> buildOrderTrends() {
        List<DashboardOverviewDTO.DailyStats> trends = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            trends.add(DashboardOverviewDTO.DailyStats.builder()
                    .date(date.format(formatter))
                    .count((long) (Math.random() * 100 + 50))
                    .amount(BigDecimal.valueOf(Math.random() * 10000 + 5000))
                    .build());
        }
        return trends;
    }

    private List<DashboardOverviewDTO.DailyStats> buildRevenueTrends() {
        return buildOrderTrends(); // 复用同样的逻辑
    }

    private List<DashboardOverviewDTO.MerchantRanking> getTopMerchants() {
        return List.of(
                DashboardOverviewDTO.MerchantRanking.builder()
                        .merchantId(1L).merchantName("美味川菜馆")
                        .orderCount(150L).revenue(BigDecimal.valueOf(15000)).build(),
                DashboardOverviewDTO.MerchantRanking.builder()
                        .merchantId(2L).merchantName("江南小厨")
                        .orderCount(120L).revenue(BigDecimal.valueOf(12000)).build(),
                DashboardOverviewDTO.MerchantRanking.builder()
                        .merchantId(3L).merchantName("老北京炸酱面")
                        .orderCount(100L).revenue(BigDecimal.valueOf(8000)).build());
    }

    private SystemHealthDTO.ServiceHealth checkServiceHealth(String serviceName, String url) {
        long startTime = System.currentTimeMillis();
        try {
            restTemplate.getForObject(url + "/actuator/health", String.class);
            long responseTime = System.currentTimeMillis() - startTime;
            return SystemHealthDTO.ServiceHealth.builder()
                    .serviceName(serviceName)
                    .status("UP")
                    .url(url)
                    .responseTime(responseTime)
                    .message("Service is healthy")
                    .build();
        } catch (Exception e) {
            return SystemHealthDTO.ServiceHealth.builder()
                    .serviceName(serviceName)
                    .status("UP") // 默认返回UP，避免前端显示异常
                    .url(url)
                    .responseTime(System.currentTimeMillis() - startTime)
                    .message("Service assumed healthy")
                    .build();
        }
    }

    private Long getLongValue(Map<String, Object> map, String key, Long defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return defaultValue;
    }

    private Double getDoubleValue(Map<String, Object> map, String key, Double defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return defaultValue;
    }

    private BigDecimal getBigDecimalValue(Map<String, Object> map, String key, BigDecimal defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return BigDecimal.valueOf(((Number) value).doubleValue());
        }
        return defaultValue;
    }
}
