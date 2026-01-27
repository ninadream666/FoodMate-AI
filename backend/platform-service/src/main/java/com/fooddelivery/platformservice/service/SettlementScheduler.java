package com.fooddelivery.platformservice.service;

import com.fooddelivery.platformservice.dto.GenerateSettlementRequest;
import com.fooddelivery.platformservice.entity.SettlementType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * 结算单定时任务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementScheduler {

    private final SettlementService settlementService;

    @Value("${settlement.scheduler.enabled:true}")
    private boolean schedulerEnabled;

    @Value("${settlement.default-type:MONTHLY}")
    private String defaultSettlementType;

    /**
     * 每月1日凌晨2点生成上月结算单
     */
    @Scheduled(cron = "${settlement.scheduler.monthly-cron:0 0 2 1 * *}")
    public void generateMonthlySettlements() {
        if (!schedulerEnabled) {
            log.debug("Settlement scheduler is disabled");
            return;
        }

        log.info("Starting monthly settlement generation...");
        try {
            GenerateSettlementRequest request = GenerateSettlementRequest.builder()
                    .settlementType(SettlementType.MONTHLY)
                    .build();

            var results = settlementService.generateSettlements(request);
            log.info("Generated {} monthly settlements", results.size());
        } catch (Exception e) {
            log.error("Error generating monthly settlements", e);
        }
    }

    /**
     * 每周一凌晨2点生成上周结算单
     */
    @Scheduled(cron = "${settlement.scheduler.weekly-cron:0 0 2 * * MON}")
    public void generateWeeklySettlements() {
        if (!schedulerEnabled) {
            log.debug("Settlement scheduler is disabled");
            return;
        }

        // 只有配置为周结算时才执行
        if (!"WEEKLY".equalsIgnoreCase(defaultSettlementType)) {
            log.debug("Weekly settlement is not enabled");
            return;
        }

        log.info("Starting weekly settlement generation...");
        try {
            GenerateSettlementRequest request = GenerateSettlementRequest.builder()
                    .settlementType(SettlementType.WEEKLY)
                    .build();

            var results = settlementService.generateSettlements(request);
            log.info("Generated {} weekly settlements", results.size());
        } catch (Exception e) {
            log.error("Error generating weekly settlements", e);
        }
    }

    /**
     * 每天早上8点自动确认超时的结算单
     */
    @Scheduled(cron = "${settlement.scheduler.auto-confirm-cron:0 0 8 * * *}")
    public void autoConfirmExpiredSettlements() {
        if (!schedulerEnabled) {
            log.debug("Settlement scheduler is disabled");
            return;
        }

        log.info("Starting auto-confirm for expired settlements...");
        try {
            int count = settlementService.autoConfirmExpiredSettlements();
            log.info("Auto-confirmed {} expired settlements", count);
        } catch (Exception e) {
            log.error("Error auto-confirming settlements", e);
        }
    }

    /**
     * 手动触发生成结算单（测试用）
     */
    public void triggerSettlementGeneration(SettlementType type) {
        log.info("Manually triggering {} settlement generation...", type);
        GenerateSettlementRequest request = GenerateSettlementRequest.builder()
                .settlementType(type)
                .build();
        settlementService.generateSettlements(request);
    }

    /**
     * 手动触发自动确认（测试用）
     */
    public void triggerAutoConfirm() {
        log.info("Manually triggering auto-confirm...");
        settlementService.autoConfirmExpiredSettlements();
    }
}
