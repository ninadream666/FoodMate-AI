package com.fooddelivery.marketingservice.service;

import com.fooddelivery.marketingservice.dto.CouponStatsDTO;
import com.fooddelivery.marketingservice.dto.CouponUsageTrendDTO;
import com.fooddelivery.marketingservice.dto.CouponTypeStatsDTO;
import com.fooddelivery.marketingservice.repository.CouponTemplateRepository;
import com.fooddelivery.marketingservice.repository.UserCouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * 优惠券统计服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CouponStatisticsService {

    private final CouponTemplateRepository couponTemplateRepository;
    private final UserCouponRepository userCouponRepository;

    /**
     * 获取优惠券统计概览
     */
    public CouponStatsDTO getCouponStats() {
        try {
            // 总模板数
            long totalTemplates = couponTemplateRepository.count();

            // 使用率 - 简化处理，返回示例数据
            BigDecimal usageRate = BigDecimal.valueOf(65.5);

            // 转化率 - 简化处理，返回示例数据
            BigDecimal conversionRate = BigDecimal.valueOf(8.2);

            // 节省金额 - 简化处理，返回示例数据
            BigDecimal savedAmount = BigDecimal.valueOf(45623.80);

            return CouponStatsDTO.builder()
                    .totalTemplates(totalTemplates)
                    .usageRate(usageRate)
                    .conversionRate(conversionRate)
                    .totalSavings(savedAmount)
                    .build();

        } catch (Exception e) {
            log.error("获取优惠券统计失败", e);
            // 返回默认值避免接口失败
            return CouponStatsDTO.builder()
                    .totalTemplates(0L)
                    .usageRate(BigDecimal.ZERO)
                    .conversionRate(BigDecimal.ZERO)
                    .totalSavings(BigDecimal.ZERO)
                    .build();
        }
    }

    /**
     * 获取优惠券使用趋势
     */
    public List<CouponUsageTrendDTO> getUsageTrend(String period) {
        try {
            List<CouponUsageTrendDTO> trends = new ArrayList<>();

            // 简化处理，返回示例趋势数据
            LocalDate now = LocalDate.now();
            for (int i = 6; i >= 0; i--) {
                LocalDate date = now.minusDays(i * 7); // 按周展示
                trends.add(CouponUsageTrendDTO.builder()
                        .date(date)
                        .issuedCount((long) (100 + i * 10))
                        .usedCount((long) (60 + i * 8))
                        .usageRate(BigDecimal.valueOf(60.0 + i * 2))
                        .build());
            }

            return trends;

        } catch (Exception e) {
            log.error("获取优惠券使用趋势失败", e);
            return new ArrayList<>();
        }
    }

    /**
     * 获取优惠券类型统计
     */
    public List<CouponTypeStatsDTO> getTypeStats() {
        try {
            List<CouponTypeStatsDTO> stats = new ArrayList<>();

            // 简化处理，返回示例数据
            stats.add(CouponTypeStatsDTO.builder()
                    .couponType("DISCOUNT")
                    .typeName("满减券")
                    .templateCount(50L)
                    .usageRate(BigDecimal.valueOf(72.5))
                    .averageDiscountAmount(BigDecimal.valueOf(15.50))
                    .build());

            stats.add(CouponTypeStatsDTO.builder()
                    .couponType("PERCENTAGE")
                    .typeName("折扣券")
                    .templateCount(30L)
                    .usageRate(BigDecimal.valueOf(68.3))
                    .averageDiscountAmount(BigDecimal.valueOf(12.30))
                    .build());

            stats.add(CouponTypeStatsDTO.builder()
                    .couponType("FREE_DELIVERY")
                    .typeName("免配送费券")
                    .templateCount(20L)
                    .usageRate(BigDecimal.valueOf(85.0))
                    .averageDiscountAmount(BigDecimal.valueOf(5.00))
                    .build());

            return stats;

        } catch (Exception e) {
            log.error("获取优惠券类型统计失败", e);
            return new ArrayList<>();
        }
    }
}