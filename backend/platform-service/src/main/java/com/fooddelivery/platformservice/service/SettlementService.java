package com.fooddelivery.platformservice.service;

import com.fooddelivery.platformservice.dto.*;
import com.fooddelivery.platformservice.entity.*;
import com.fooddelivery.platformservice.exception.BusinessException;
import com.fooddelivery.platformservice.repository.CommissionRecordRepository;
import com.fooddelivery.platformservice.repository.MerchantSettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementService {

    private final MerchantSettlementRepository settlementRepository;
    private final CommissionRecordRepository commissionRecordRepository;

    @Value("${settlement.confirm-days:3}")
    private int confirmDays; // 确认期限天数，默认3天

    // ==================== 商家端接口 ====================

    /**
     * 获取商家的结算单列表
     */
    public Page<MerchantSettlementDTO> getMerchantSettlements(Long merchantId, Pageable pageable) {
        return settlementRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId, pageable)
                .map(MerchantSettlementDTO::fromEntity);
    }

    /**
     * 按状态获取商家的结算单
     */
    public Page<MerchantSettlementDTO> getMerchantSettlementsByStatus(
            Long merchantId, SettlementStatus status, Pageable pageable) {
        return settlementRepository.findByMerchantIdAndStatusOrderByCreatedAtDesc(merchantId, status, pageable)
                .map(MerchantSettlementDTO::fromEntity);
    }

    /**
     * 获取结算单详情
     */
    public MerchantSettlementDTO getSettlementDetail(Long settlementId, Long merchantId) {
        MerchantSettlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new BusinessException("结算单不存在"));

        // 验证归属
        if (merchantId != null && !settlement.getMerchantId().equals(merchantId)) {
            throw new BusinessException("无权查看此结算单");
        }

        MerchantSettlementDTO dto = MerchantSettlementDTO.fromEntity(settlement);

        // 加载分成明细（按服务分组）
        List<Object[]> serviceStats = commissionRecordRepository
                .sumCommissionBySettlementGroupByService(settlementId);

        List<MerchantSettlementDTO.ServiceCommissionSummary> serviceCommissions = serviceStats.stream()
                .map(row -> MerchantSettlementDTO.ServiceCommissionSummary.builder()
                        .serviceName((String) row[0])
                        .category(((ServiceCategory) row[1]).name())
                        .categoryName(getCategoryName((ServiceCategory) row[1]))
                        .commissionAmount((BigDecimal) row[2])
                        .recordCount((Long) row[3])
                        .build())
                .collect(Collectors.toList());

        dto.setServiceCommissions(serviceCommissions);
        return dto;
    }

    /**
     * 获取结算单内的分成记录
     */
    public Page<CommissionRecordDTO> getSettlementCommissions(
            Long settlementId, Long merchantId, Pageable pageable) {
        MerchantSettlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new BusinessException("结算单不存在"));

        if (merchantId != null && !settlement.getMerchantId().equals(merchantId)) {
            throw new BusinessException("无权查看此结算单");
        }

        return commissionRecordRepository.findBySettlementIdOrderByCreatedAtDesc(settlementId, pageable)
                .map(CommissionRecordDTO::fromEntity);
    }

    /**
     * 商家确认结算单
     */
    @Transactional
    public MerchantSettlementDTO confirmSettlement(Long settlementId, Long merchantId) {
        MerchantSettlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new BusinessException("结算单不存在"));

        if (!settlement.getMerchantId().equals(merchantId)) {
            throw new BusinessException("无权操作此结算单");
        }

        if (settlement.getStatus() != SettlementStatus.PENDING_CONFIRM) {
            throw new BusinessException("当前状态不允许确认");
        }

        settlement.setStatus(SettlementStatus.CONFIRMED);
        settlement.setConfirmedAt(LocalDateTime.now());
        settlementRepository.save(settlement);

        log.info("Merchant {} confirmed settlement {}", merchantId, settlement.getSettlementNo());
        return MerchantSettlementDTO.fromEntity(settlement);
    }

    /**
     * 商家提交异议
     */
    @Transactional
    public MerchantSettlementDTO disputeSettlement(Long settlementId, Long merchantId,
            DisputeSettlementRequest request) {
        MerchantSettlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new BusinessException("结算单不存在"));

        if (!settlement.getMerchantId().equals(merchantId)) {
            throw new BusinessException("无权操作此结算单");
        }

        if (settlement.getStatus() != SettlementStatus.PENDING_CONFIRM) {
            throw new BusinessException("当前状态不允许提交异议");
        }

        settlement.setStatus(SettlementStatus.DISPUTED);
        settlement.setDisputeReason(request.getReason());
        settlement.setDisputeAt(LocalDateTime.now());
        settlementRepository.save(settlement);

        log.info("Merchant {} disputed settlement {}: {}", merchantId, settlement.getSettlementNo(),
                request.getReason());
        return MerchantSettlementDTO.fromEntity(settlement);
    }

    /**
     * 获取商家结算汇总统计
     */
    public CommissionSummaryDTO getMerchantSettlementSummary(Long merchantId) {
        long pendingConfirm = settlementRepository.countByMerchantIdAndStatus(merchantId,
                SettlementStatus.PENDING_CONFIRM);
        long confirmed = settlementRepository.countByMerchantIdAndStatus(merchantId, SettlementStatus.CONFIRMED);
        long disputed = settlementRepository.countByMerchantIdAndStatus(merchantId, SettlementStatus.DISPUTED);

        // 这里可以扩展更多统计
        return CommissionSummaryDTO.builder()
                .orderCount(pendingConfirm + confirmed + disputed)
                .build();
    }

    // ==================== 管理员接口 ====================

    /**
     * 获取所有结算单（管理员）
     */
    public Page<MerchantSettlementDTO> getAllSettlements(Pageable pageable) {
        return settlementRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(MerchantSettlementDTO::fromEntity);
    }

    /**
     * 按状态获取结算单（管理员）
     */
    public Page<MerchantSettlementDTO> getSettlementsByStatus(SettlementStatus status, Pageable pageable) {
        return settlementRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(MerchantSettlementDTO::fromEntity);
    }

    /**
     * 生成结算单
     */
    @Transactional
    public List<MerchantSettlementDTO> generateSettlements(GenerateSettlementRequest request) {
        SettlementType type = request.getSettlementType();
        LocalDate periodStart = request.getPeriodStart();
        LocalDate periodEnd = request.getPeriodEnd();

        // 如果未指定周期，自动计算上一周期
        if (periodStart == null || periodEnd == null) {
            LocalDate[] period = calculatePreviousPeriod(type);
            periodStart = period[0];
            periodEnd = period[1];
        }

        String periodLabel = generatePeriodLabel(type, periodStart);
        LocalDateTime startTime = periodStart.atStartOfDay();
        LocalDateTime endTime = periodEnd.plusDays(1).atStartOfDay();

        log.info("Generating {} settlements for period {} to {} (startTime: {}, endTime: {})",
                type, periodStart, periodEnd, startTime, endTime);

        List<MerchantSettlementDTO> results = new ArrayList<>();

        // 获取需要生成结算单的商家列表
        List<Long> merchantIds;
        if (request.getMerchantId() != null) {
            merchantIds = List.of(request.getMerchantId());
            log.info("Using specified merchant ID: {}", request.getMerchantId());
        } else {
            merchantIds = settlementRepository.findMerchantsWithUnsettledCommissions(startTime, endTime);
            log.info("Found {} merchants with unsettled commissions: {}", merchantIds.size(), merchantIds);
        }

        if (merchantIds.isEmpty()) {
            log.warn("No merchants with unsettled commissions for period {} to {} (startTime: {}, endTime: {})",
                    periodStart, periodEnd, startTime, endTime);
            return results;
        }

        AtomicInteger sequence = new AtomicInteger(1);
        for (Long merchantId : merchantIds) {
            try {
                // 检查是否已存在结算单
                if (settlementRepository.existsByMerchantIdAndSettlementTypeAndPeriodLabel(
                        merchantId, type, periodLabel)) {
                    log.warn("Settlement already exists for merchant {} period {}", merchantId, periodLabel);
                    continue;
                }

                MerchantSettlementDTO settlement = generateSettlementForMerchant(
                        merchantId, type, periodStart, periodEnd, periodLabel, startTime, endTime,
                        sequence.getAndIncrement());
                if (settlement != null) {
                    results.add(settlement);
                }
            } catch (Exception e) {
                log.error("Failed to generate settlement for merchant {}", merchantId, e);
            }
        }

        log.info("Generated {} settlements", results.size());
        return results;
    }

    /**
     * 为单个商家生成结算单
     */
    private MerchantSettlementDTO generateSettlementForMerchant(
            Long merchantId, SettlementType type, LocalDate periodStart, LocalDate periodEnd,
            String periodLabel, LocalDateTime startTime, LocalDateTime endTime, int sequence) {

        log.info("Generating settlement for merchant {} (startTime: {}, endTime: {})",
                merchantId, startTime, endTime);

        // 统计未结算分成
        Object[] stats = commissionRecordRepository.sumUnsettledByMerchantAndTimeRange(merchantId, startTime, endTime);

        log.debug("Commission stats for merchant {}: {}", merchantId, java.util.Arrays.toString(stats));

        // 处理嵌套的Object数组结构
        Object[] actualStats;
        if (stats != null && stats.length > 0 && stats[0] instanceof Object[]) {
            actualStats = (Object[]) stats[0];
        } else {
            actualStats = stats;
        }

        log.debug("Actual stats array for merchant {}: {}", merchantId,
                actualStats != null ? java.util.Arrays.toString(actualStats) : "null");

        // 安全的类型转换
        BigDecimal totalCommission = BigDecimal.ZERO;
        Long orderCount = 0L;
        BigDecimal totalOrderAmount = BigDecimal.ZERO;

        if (actualStats != null && actualStats.length >= 3) {
            totalCommission = actualStats[0] != null ? new BigDecimal(actualStats[0].toString()) : BigDecimal.ZERO;
            orderCount = actualStats[1] != null ? Long.valueOf(actualStats[1].toString()) : 0L;
            totalOrderAmount = actualStats[2] != null ? new BigDecimal(actualStats[2].toString()) : BigDecimal.ZERO;
        }

        log.info("Merchant {} stats - Orders: {}, Commission: {}, Order Amount: {}",
                merchantId, orderCount, totalCommission, totalOrderAmount);

        if (orderCount == 0 || totalCommission.compareTo(BigDecimal.ZERO) == 0) {
            log.warn("No unsettled commissions for merchant {} in period {} to {} - Orders: {}, Commission: {}",
                    merchantId, startTime, endTime, orderCount, totalCommission);
            return null;
        }

        // 生成结算单号
        String settlementNo = generateSettlementNo(type, periodStart, merchantId, sequence);

        // 创建结算单
        MerchantSettlement settlement = MerchantSettlement.builder()
                .settlementNo(settlementNo)
                .merchantId(merchantId)
                .settlementType(type)
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .periodLabel(periodLabel)
                .totalOrderCount(orderCount.intValue())
                .totalOrderAmount(totalOrderAmount)
                .totalCommission(totalCommission)
                .adjustmentAmount(BigDecimal.ZERO)
                .netIncome(totalOrderAmount.subtract(totalCommission))
                .status(SettlementStatus.PENDING_CONFIRM)
                .confirmDeadline(LocalDateTime.now().plusDays(confirmDays))
                .build();

        settlement = settlementRepository.save(settlement);

        // 关联分成记录到结算单
        int linkedCount = commissionRecordRepository.linkToSettlement(
                merchantId, settlement.getId(), startTime, endTime, LocalDateTime.now());

        log.info("Created settlement {} for merchant {}, linked {} commission records",
                settlementNo, merchantId, linkedCount);

        return MerchantSettlementDTO.fromEntity(settlement);
    }

    /**
     * 调整结算单金额（管理员）
     */
    @Transactional
    public MerchantSettlementDTO adjustSettlement(Long settlementId, AdjustSettlementRequest request) {
        MerchantSettlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new BusinessException("结算单不存在"));

        if (settlement.getStatus() == SettlementStatus.PAID) {
            throw new BusinessException("已打款的结算单不能调整");
        }

        settlement.setAdjustmentAmount(request.getAdjustmentAmount());
        settlement.setAdjustmentReason(request.getReason());
        settlement.recalculateNetIncome();

        // 如果是异议状态，调整后变为待确认
        if (settlement.getStatus() == SettlementStatus.DISPUTED) {
            settlement.setStatus(SettlementStatus.PENDING_CONFIRM);
            settlement.setConfirmDeadline(LocalDateTime.now().plusDays(confirmDays));
        }

        settlementRepository.save(settlement);
        log.info("Adjusted settlement {}: amount={}, reason={}",
                settlement.getSettlementNo(), request.getAdjustmentAmount(), request.getReason());

        return MerchantSettlementDTO.fromEntity(settlement);
    }

    /**
     * 批量标记已打款（管理员）
     */
    @Transactional
    public int batchMarkAsPaid(BatchPayRequest request) {
        int count = settlementRepository.batchMarkAsPaid(request.getSettlementIds(), LocalDateTime.now());
        log.info("Marked {} settlements as paid", count);
        return count;
    }

    /**
     * 获取结算统计（管理员）
     */
    public SettlementStatsDTO getSettlementStats() {
        long pendingConfirm = settlementRepository.countByStatus(SettlementStatus.PENDING_CONFIRM);
        long confirmed = settlementRepository.countByStatus(SettlementStatus.CONFIRMED);
        long disputed = settlementRepository.countByStatus(SettlementStatus.DISPUTED);
        long paid = settlementRepository.countByStatus(SettlementStatus.PAID);
        BigDecimal pendingPaymentAmount = settlementRepository.sumPendingPaymentAmount();

        // 计算今日和本月佣金收入
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime lastMonthStart = LocalDate.now().minusMonths(1).withDayOfMonth(1).atStartOfDay();
        LocalDateTime lastMonthEnd = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        BigDecimal todayCommission = commissionRecordRepository
                .sumCommissionByDateRange(todayStart, now)
                .orElse(BigDecimal.ZERO);
        BigDecimal monthlyCommission = commissionRecordRepository
                .sumCommissionByDateRange(monthStart, now)
                .orElse(BigDecimal.ZERO);

        // 计算总结算金额和月增长率
        BigDecimal totalAmount = settlementRepository.sumTotalSettlementAmount().orElse(BigDecimal.ZERO);
        BigDecimal paidAmount = settlementRepository.sumPaidAmount().orElse(BigDecimal.ZERO);
        BigDecimal lastMonthCommission = commissionRecordRepository
                .sumCommissionByDateRange(lastMonthStart, lastMonthEnd)
                .orElse(BigDecimal.ZERO);

        BigDecimal monthlyGrowthRate = BigDecimal.ZERO;
        if (lastMonthCommission.compareTo(BigDecimal.ZERO) > 0) {
            monthlyGrowthRate = monthlyCommission.subtract(lastMonthCommission)
                    .divide(lastMonthCommission, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        long totalSettlements = pendingConfirm + confirmed + disputed + paid;
        BigDecimal averageSettlementAmount = totalSettlements > 0
                ? totalAmount.divide(BigDecimal.valueOf(totalSettlements), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return SettlementStatsDTO.builder()
                // 新格式字段
                .totalSettlements(totalSettlements)
                .pendingSettlements(pendingConfirm)
                .completedSettlements(paid)
                .disputedSettlements(disputed)
                .totalAmount(totalAmount)
                .pendingAmount(pendingPaymentAmount != null ? pendingPaymentAmount : BigDecimal.ZERO)
                .paidAmount(paidAmount)
                .monthlyGrowthRate(monthlyGrowthRate)
                .averageSettlementAmount(averageSettlementAmount)
                // 兼容原有字段
                .pendingConfirmCount(pendingConfirm)
                .pendingPaymentCount(confirmed)
                .pendingPaymentAmount(pendingPaymentAmount != null ? pendingPaymentAmount : BigDecimal.ZERO)
                .disputedCount(disputed)
                .todayCommission(todayCommission)
                .monthlyCommission(monthlyCommission)
                .build();
    }

    /**
     * 获取分成趋势分析
     */
    public List<SettlementTrendDTO> getSettlementTrend(String period) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;
        String dateFormat;

        switch (period.toLowerCase()) {
            case "day":
                startDate = endDate.minusDays(30);
                dateFormat = "yyyy-MM-dd";
                break;
            case "week":
                startDate = endDate.minusWeeks(12);
                dateFormat = "yyyy年第w周";
                break;
            case "year":
                startDate = endDate.minusYears(3);
                dateFormat = "yyyy年";
                break;
            default: // month
                startDate = endDate.minusMonths(12);
                dateFormat = "yyyy年MM月";
                break;
        }

        List<SettlementTrendDTO> trends = new ArrayList<>();
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
            Object[] stats = settlementRepository.getSettlementStatsByDateRange(periodStart, periodEnd);
            Object[] commissionStats = commissionRecordRepository.getCommissionStatsByDateRange(periodStart, periodEnd);

            Long settlementCount = stats != null && stats[0] != null ? (Long) stats[0] : 0L;
            BigDecimal totalAmount = stats != null && stats[1] != null ? (BigDecimal) stats[1] : BigDecimal.ZERO;
            BigDecimal settledAmount = stats != null && stats[2] != null ? (BigDecimal) stats[2] : BigDecimal.ZERO;
            Long merchantCount = stats != null && stats[3] != null ? (Long) stats[3] : 0L;

            BigDecimal commissionIncome = commissionStats != null && commissionStats[0] != null
                    ? (BigDecimal) commissionStats[0]
                    : BigDecimal.ZERO;

            SettlementTrendDTO trend = SettlementTrendDTO.builder()
                    .date(current)
                    .dateLabel(current.format(java.time.format.DateTimeFormatter.ofPattern(dateFormat)))
                    .settlementCount(settlementCount)
                    .totalAmount(totalAmount)
                    .settledAmount(settledAmount)
                    .commissionIncome(commissionIncome)
                    .merchantCount(merchantCount)
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
     * 作废结算单（管理员）
     */
    @Transactional
    public void cancelSettlement(Long settlementId) {
        MerchantSettlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new BusinessException("结算单不存在"));

        if (settlement.getStatus() == SettlementStatus.PAID) {
            throw new BusinessException("已打款的结算单不能作废");
        }

        // 解除分成记录关联
        commissionRecordRepository.unlinkFromSettlement(settlementId);

        settlement.setStatus(SettlementStatus.CANCELLED);
        settlementRepository.save(settlement);

        log.info("Cancelled settlement {}", settlement.getSettlementNo());
    }

    // ==================== 定时任务接口 ====================

    /**
     * 自动确认超时的结算单
     */
    @Transactional
    public int autoConfirmExpiredSettlements() {
        List<MerchantSettlement> expired = settlementRepository.findExpiredPendingSettlements(LocalDateTime.now());

        for (MerchantSettlement settlement : expired) {
            settlement.setStatus(SettlementStatus.CONFIRMED);
            settlement.setConfirmedAt(LocalDateTime.now());
        }

        if (!expired.isEmpty()) {
            settlementRepository.saveAll(expired);
            log.info("Auto-confirmed {} expired settlements", expired.size());
        }

        return expired.size();
    }

    // ==================== 辅助方法 ====================

    /**
     * 计算上一周期的起止日期
     */
    private LocalDate[] calculatePreviousPeriod(SettlementType type) {
        LocalDate today = LocalDate.now();
        LocalDate start, end;

        if (type == SettlementType.MONTHLY) {
            // 上个月
            LocalDate lastMonth = today.minusMonths(1);
            start = lastMonth.withDayOfMonth(1);
            end = lastMonth.with(TemporalAdjusters.lastDayOfMonth());
        } else {
            // 上周（周一到周日）
            WeekFields weekFields = WeekFields.of(Locale.CHINA);
            LocalDate lastWeek = today.minusWeeks(1);
            start = lastWeek.with(DayOfWeek.MONDAY);
            end = lastWeek.with(DayOfWeek.SUNDAY);
        }

        return new LocalDate[] { start, end };
    }

    /**
     * 生成周期标签
     */
    private String generatePeriodLabel(SettlementType type, LocalDate periodStart) {
        if (type == SettlementType.MONTHLY) {
            return periodStart.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        } else {
            WeekFields weekFields = WeekFields.of(Locale.CHINA);
            int weekNumber = periodStart.get(weekFields.weekOfWeekBasedYear());
            return periodStart.getYear() + "-W" + String.format("%02d", weekNumber);
        }
    }

    /**
     * 生成结算单号
     * 格式：ST{年}{月}{类型}{商家ID后3位}{序号}
     */
    private String generateSettlementNo(SettlementType type, LocalDate periodStart, Long merchantId, int sequence) {
        String typeCode = type == SettlementType.MONTHLY ? "M" : "W";
        String merchantSuffix = String.format("%03d", merchantId % 1000);
        String seqStr = String.format("%03d", sequence);

        if (type == SettlementType.MONTHLY) {
            return String.format("ST%s%s%s%s",
                    periodStart.format(DateTimeFormatter.ofPattern("yyyyMM")),
                    typeCode, merchantSuffix, seqStr);
        } else {
            WeekFields weekFields = WeekFields.of(Locale.CHINA);
            int weekNumber = periodStart.get(weekFields.weekOfWeekBasedYear());
            return String.format("ST%dW%02d%s%s%s",
                    periodStart.getYear(), weekNumber, typeCode, merchantSuffix, seqStr);
        }
    }

    private String getCategoryName(ServiceCategory category) {
        return switch (category) {
            case BASIC -> "基础服务";
            case TRAFFIC -> "流量服务";
            case DELIVERY -> "配送服务";
            case OPERATION -> "运营服务";
        };
    }

    /**
     * 获取佣金贡献TOP商家
     * 
     * @param limit  返回数量
     * @param period 时间范围 (week/month/all)
     */
    public java.util.Map<String, Object> getTopCommissionMerchants(int limit, String period) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, limit);
        List<Object[]> results;

        LocalDateTime startTime = null;
        LocalDateTime endTime = LocalDateTime.now();

        if ("week".equalsIgnoreCase(period)) {
            startTime = LocalDate.now().minusDays(7).atStartOfDay();
            results = commissionRecordRepository.findTopMerchantsByCommissionInRange(startTime, endTime, pageable);
        } else if ("month".equalsIgnoreCase(period)) {
            startTime = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            results = commissionRecordRepository.findTopMerchantsByCommissionInRange(startTime, endTime, pageable);
        } else {
            results = commissionRecordRepository.findTopMerchantsByCommission(pageable);
        }

        List<java.util.Map<String, Object>> merchants = new ArrayList<>();
        int rank = 1;
        for (Object[] row : results) {
            Long merchantId = (Long) row[0];
            BigDecimal totalCommission = (BigDecimal) row[1];
            Long orderCount = (Long) row[2];
            BigDecimal avgCommission = orderCount > 0
                    ? totalCommission.divide(BigDecimal.valueOf(orderCount), 2, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            java.util.Map<String, Object> merchant = new java.util.HashMap<>();
            merchant.put("merchantId", merchantId);
            merchant.put("merchantName", "商家#" + merchantId); // TODO: 调用 merchant-service 获取真实名称
            merchant.put("totalCommission", totalCommission);
            merchant.put("orderCount", orderCount);
            merchant.put("avgCommission", avgCommission);
            merchant.put("rank", rank++);
            merchants.add(merchant);
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("merchants", merchants);
        result.put("period", period != null ? period : "all");
        result.put("generatedAt", LocalDateTime.now().toString());

        return result;
    }
}
