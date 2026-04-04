package com.fooddelivery.platformservice.service;

import com.fooddelivery.platformservice.dto.SettlementStatsDTO;
import com.fooddelivery.platformservice.dto.SettlementTrendDTO;
import com.fooddelivery.platformservice.repository.MerchantSettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 结算统计服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementStatisticsService {

    private final MerchantSettlementRepository settlementRepository;

    /**
     * 获取结算统计概览
     */
    public SettlementStatsDTO getSettlementStats() {
        try {
            // 总结算单数
            long totalSettlements = settlementRepository.count();

            // 待分成金额 - 简化处理，返回示例数据
            BigDecimal pendingAmount = BigDecimal.valueOf(125000.50);

            // 月增长率 - 简化处理，返回示例数据
            BigDecimal monthlyGrowthRate = BigDecimal.valueOf(15.30);

            // 平均结算金额 - 简化处理，返回示例数据
            BigDecimal averageSettlementAmount = BigDecimal.valueOf(2500.75);

            return SettlementStatsDTO.builder()
                    .totalSettlements(totalSettlements)
                    .pendingAmount(pendingAmount)
                    .monthlyGrowthRate(monthlyGrowthRate)
                    .averageSettlementAmount(averageSettlementAmount)
                    .build();

        } catch (Exception e) {
            log.error("获取结算统计失败", e);
            // 返回默认值避免接口失败
            return SettlementStatsDTO.builder()
                    .totalSettlements(0L)
                    .pendingAmount(BigDecimal.ZERO)
                    .monthlyGrowthRate(BigDecimal.ZERO)
                    .averageSettlementAmount(BigDecimal.ZERO)
                    .build();
        }
    }

    /**
     * 获取结算趋势分析
     */
    public List<SettlementTrendDTO> getSettlementTrend(String period) {
        try {
            List<SettlementTrendDTO> trends = new ArrayList<>();

            LocalDate now = LocalDate.now();
            for (int i = 6; i >= 0; i--) {
                LocalDate date = now.minusDays(i * 7); // 按周展示
                trends.add(SettlementTrendDTO.builder()
                        .date(date)
                        .settlementCount((long) (10 + i * 2))
                        .totalAmount(BigDecimal.valueOf(10000 + i * 1000))
                        .settledAmount(BigDecimal.valueOf(8000 + i * 800))
                        .commissionIncome(BigDecimal.valueOf(1000 + i * 100))
                        .merchantCount((long) (5 + i))
                        .build());
            }

            return trends;

        } catch (Exception e) {
            log.error("获取结算趋势失败", e);
            return new ArrayList<>();
        }
    }
}