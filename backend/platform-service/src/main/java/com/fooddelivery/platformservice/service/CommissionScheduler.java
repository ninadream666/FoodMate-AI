package com.fooddelivery.platformservice.service;

import com.fooddelivery.platformservice.dto.CalculateCommissionRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 分成计算定时任务
 * Mock场景：轮询已完成但未计算分成的订单
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CommissionScheduler {

    private final CommissionService commissionService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${commission.scheduler.enabled:true}")
    private boolean schedulerEnabled;

    /**
     * 定时扫描已完成订单，计算分成
     * 默认每5分钟执行一次
     */
    @Scheduled(cron = "${commission.scheduler.cron:0 */5 * * * *}")
    public void processCompletedOrders() {
        if (!schedulerEnabled) {
            log.debug("Commission scheduler is disabled");
            return;
        }

        log.info("Starting commission calculation for completed orders...");

        try {
            // 查找已支付但未计算分成的订单
            // 状态'PAID', 'COMPLETED'或'DELIVERED'表示订单已支付，可以计算商家收入
            String sql = """
                        SELECT o.id, o.merchant_id, o.total_amount
                        FROM orders o
                        WHERE o.status IN ('PAID', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED')
                        AND o.paid_at IS NOT NULL
                        AND NOT EXISTS (
                            SELECT 1 FROM commission_records cr WHERE cr.order_id = o.id
                        )
                        ORDER BY o.created_at
                        LIMIT 100
                    """;

            List<Map<String, Object>> orders = jdbcTemplate.queryForList(sql);

            if (orders.isEmpty()) {
                log.debug("No pending orders to process");
                return;
            }

            log.info("Found {} orders to process", orders.size());

            int successCount = 0;
            int failCount = 0;

            for (Map<String, Object> order : orders) {
                try {
                    Long orderId = ((Number) order.get("id")).longValue();
                    Long merchantId = ((Number) order.get("merchant_id")).longValue();
                    BigDecimal totalAmount = (BigDecimal) order.get("total_amount");

                    CalculateCommissionRequest request = CalculateCommissionRequest.builder()
                            .orderId(orderId)
                            .merchantId(merchantId)
                            .orderAmount(totalAmount)
                            .build();

                    commissionService.calculateCommission(request);
                    successCount++;

                } catch (Exception e) {
                    failCount++;
                    log.error("Failed to calculate commission for order: {}", order.get("id"), e);
                }
            }

            log.info("Commission calculation completed: success={}, failed={}", successCount, failCount);

        } catch (Exception e) {
            log.error("Error in commission scheduler", e);
        }
    }

    /**
     * 手动触发分成计算（供测试使用）
     */
    public void triggerManually() {
        log.info("Manually triggering commission calculation...");
        processCompletedOrders();
    }
}
