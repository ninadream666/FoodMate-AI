package com.fooddelivery.marketingservice.service;

import com.fooddelivery.marketingservice.dto.CouponStatsDTO;
import com.fooddelivery.marketingservice.dto.CouponUsageTrendDTO;
import com.fooddelivery.marketingservice.dto.CouponTypeStatsDTO;
import com.fooddelivery.marketingservice.entity.CouponStatus;
import com.fooddelivery.marketingservice.entity.CouponType;
import com.fooddelivery.marketingservice.repository.CouponTemplateRepository;
import com.fooddelivery.marketingservice.repository.UserCouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 优惠券统计服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CouponStatsService {

    private final CouponTemplateRepository couponTemplateRepository;
    private final UserCouponRepository userCouponRepository;

    /**
     * 获取优惠券统计概览
     */
    public CouponStatsDTO getCouponStats() {
        // 获取模板统计
        Long totalTemplates = couponTemplateRepository.count();
        Long activeTemplates = couponTemplateRepository.countByEnabledTrue();

        // 获取发放和使用统计
        Long totalIssued = userCouponRepository.count();
        Long totalUsed = userCouponRepository.countByStatus(CouponStatus.USED);

        // 计算使用率
        BigDecimal usageRate = totalIssued > 0
                ? BigDecimal.valueOf(totalUsed).divide(BigDecimal.valueOf(totalIssued), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        // 获取本月统计
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        Long monthlyIssuance = userCouponRepository.countByCreatedAtBetween(monthStart, now);
        Long monthlyUsage = userCouponRepository.countByStatusAndUsedAtBetween(
                CouponStatus.USED, monthStart, now);

        // 计算转化率（本月使用数/本月发放数）
        BigDecimal conversionRate = monthlyIssuance > 0
                ? BigDecimal.valueOf(monthlyUsage).divide(BigDecimal.valueOf(monthlyIssuance), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        // 计算总优惠金额和平均优惠金额（需要从订单系统获取实际使用金额，这里用估算）
        BigDecimal totalSavings = estimateTotalSavings();
        BigDecimal averageDiscountAmount = totalUsed > 0
                ? totalSavings.divide(BigDecimal.valueOf(totalUsed), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return CouponStatsDTO.builder()
                .totalTemplates(totalTemplates)
                .activeTemplates(activeTemplates)
                .totalIssued(totalIssued)
                .totalUsed(totalUsed)
                .usageRate(usageRate)
                .totalSavings(totalSavings)
                .monthlyIssuance(monthlyIssuance)
                .monthlyUsage(monthlyUsage)
                .conversionRate(conversionRate)
                .averageDiscountAmount(averageDiscountAmount)
                .build();
    }

    /**
     * 获取优惠券使用趋势
     */
    public List<CouponUsageTrendDTO> getUsageTrend(String period) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;
        String dateFormat;

        switch (period.toLowerCase()) {
            case "day":
                startDate = endDate.minusDays(30);
                dateFormat = "MM-dd";
                break;
            case "week":
                startDate = endDate.minusWeeks(12);
                dateFormat = "第w周";
                break;
            case "year":
                startDate = endDate.minusYears(3);
                dateFormat = "yyyy年";
                break;
            default: // month
                startDate = endDate.minusMonths(12);
                dateFormat = "yyyy-MM";
                break;
        }

        List<CouponUsageTrendDTO> trends = new ArrayList<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            LocalDateTime periodStart = current.atStartOfDay();
            LocalDateTime periodEnd = current.plusDays(1).atStartOfDay();

            // 根据period调整时间范围
            if ("week".equals(period)) {
                periodEnd = current.plusWeeks(1).atStartOfDay();
            } else if ("month".equals(period)) {
                periodEnd = current.plusMonths(1).atStartOfDay();
            } else if ("year".equals(period)) {
                periodEnd = current.plusYears(1).atStartOfDay();
            }

            // 获取该时间段的统计数据
            Long issuedCount = userCouponRepository.countByCreatedAtBetween(periodStart, periodEnd);
            Long usedCount = userCouponRepository.countByStatusAndUsedAtBetween(
                    CouponStatus.USED, periodStart, periodEnd);
            Long userCount = userCouponRepository.countDistinctUsersByDateRange(periodStart, periodEnd);

            BigDecimal usageRate = issuedCount > 0
                    ? BigDecimal.valueOf(usedCount).divide(BigDecimal.valueOf(issuedCount), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            // 估算优惠金额
            BigDecimal discountAmount = estimateDiscountAmountForPeriod(periodStart, periodEnd);

            CouponUsageTrendDTO trend = CouponUsageTrendDTO.builder()
                    .date(current)
                    .dateLabel(current.format(java.time.format.DateTimeFormatter.ofPattern(dateFormat)))
                    .issuedCount(issuedCount)
                    .usedCount(usedCount)
                    .usageRate(usageRate)
                    .discountAmount(discountAmount)
                    .userCount(userCount)
                    .build();

            trends.add(trend);

            // 移动到下一个时间段
            if ("week".equals(period)) {
                current = current.plusWeeks(1);
            } else if ("month".equals(period)) {
                current = current.plusMonths(1);
            } else if ("year".equals(period)) {
                current = current.plusYears(1);
            } else {
                current = current.plusDays(1);
            }
        }

        return trends;
    }

    /**
     * 获取优惠券类型统计
     */
    public List<CouponTypeStatsDTO> getTypeStats() {
        List<CouponTypeStatsDTO> typeStats = new ArrayList<>();

        for (CouponType type : CouponType.values()) {
            Object[] stats = userCouponRepository.getStatsByType(type);

            Long templateCount = couponTemplateRepository.countByType(type);
            Long issuedCount = stats != null && stats[0] != null ? (Long) stats[0] : 0L;
            Long usedCount = stats != null && stats[1] != null ? (Long) stats[1] : 0L;

            BigDecimal usageRate = issuedCount > 0
                    ? BigDecimal.valueOf(usedCount).divide(BigDecimal.valueOf(issuedCount), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            // 估算优惠金额
            BigDecimal totalDiscountAmount = estimateDiscountAmountByType(type);
            BigDecimal averageDiscountAmount = usedCount > 0
                    ? totalDiscountAmount.divide(BigDecimal.valueOf(usedCount), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            CouponTypeStatsDTO typeStatsDTO = CouponTypeStatsDTO.builder()
                    .couponType(type.name())
                    .typeName(getTypeName(type))
                    .templateCount(templateCount)
                    .issuedCount(issuedCount)
                    .usedCount(usedCount)
                    .usageRate(usageRate)
                    .totalDiscountAmount(totalDiscountAmount)
                    .averageDiscountAmount(averageDiscountAmount)
                    .build();

            typeStats.add(typeStatsDTO);
        }

        return typeStats;
    }

    /**
     * 估算总优惠金额
     */
    private BigDecimal estimateTotalSavings() {
        // 这里简化处理，实际应该从订单系统获取真实的优惠金额
        Object[] avgDiscount = userCouponRepository.getAverageDiscountValue();
        BigDecimal avgValue = avgDiscount != null && avgDiscount[0] != null ? (BigDecimal) avgDiscount[0]
                : BigDecimal.valueOf(10); // 默认10元

        Long totalUsed = userCouponRepository.countByStatus(CouponStatus.USED);
        return avgValue.multiply(BigDecimal.valueOf(totalUsed));
    }

    /**
     * 估算指定时间段的优惠金额
     */
    private BigDecimal estimateDiscountAmountForPeriod(LocalDateTime startTime, LocalDateTime endTime) {
        Long usedInPeriod = userCouponRepository.countByStatusAndUsedAtBetween(
                CouponStatus.USED, startTime, endTime);

        Object[] avgDiscount = userCouponRepository.getAverageDiscountValue();
        BigDecimal avgValue = avgDiscount != null && avgDiscount[0] != null ? (BigDecimal) avgDiscount[0]
                : BigDecimal.valueOf(10);

        return avgValue.multiply(BigDecimal.valueOf(usedInPeriod));
    }

    /**
     * 估算指定类型的优惠金额
     */
    private BigDecimal estimateDiscountAmountByType(CouponType type) {
        Object[] avgDiscountByType = userCouponRepository.getAverageDiscountValueByType(type);
        BigDecimal avgValue = avgDiscountByType != null && avgDiscountByType[0] != null
                ? (BigDecimal) avgDiscountByType[0]
                : BigDecimal.valueOf(10);

        Long usedByType = userCouponRepository.countByStatusAndCouponTemplateType(CouponStatus.USED, type);
        return avgValue.multiply(BigDecimal.valueOf(usedByType));
    }

    /**
     * 获取优惠券类型中文名称
     */
    private String getTypeName(CouponType type) {
        return switch (type) {
            case DISCOUNT -> "折扣券";
            case THRESHOLD_REDUCTION -> "满减券";
            case NO_THRESHOLD -> "无门槛券";
            case FREE_SHIPPING -> "免运费券";
        };
    }
}