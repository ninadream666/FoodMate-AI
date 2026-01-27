package com.fooddelivery.platformservice.service;

import com.fooddelivery.platformservice.dto.*;
import com.fooddelivery.platformservice.entity.*;
import com.fooddelivery.platformservice.exception.BusinessException;
import com.fooddelivery.platformservice.repository.CommissionRecordRepository;
import com.fooddelivery.platformservice.repository.MerchantServiceSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommissionService {

    private final CommissionRecordRepository commissionRecordRepository;
    private final MerchantServiceSubscriptionRepository subscriptionRepository;

    /**
     * 计算订单分成（内部接口）
     */
    @Transactional
    public CalculateCommissionResponse calculateCommission(CalculateCommissionRequest request) {
        Long orderId = request.getOrderId();
        Long merchantId = request.getMerchantId();
        BigDecimal orderAmount = request.getOrderAmount();

        // 检查是否已计算过
        if (commissionRecordRepository.existsByOrderId(orderId)) {
            log.warn("Commission already calculated for order: {}", orderId);
            throw new BusinessException("该订单已计算过分成");
        }

        // 获取商家的有效按单计费订阅
        List<MerchantServiceSubscription> subscriptions = subscriptionRepository
                .findActivePerOrderSubscriptions(merchantId, BillingCycle.PER_ORDER);

        if (subscriptions.isEmpty()) {
            log.warn("No active per-order subscriptions for merchant: {}", merchantId);
            return buildEmptyResponse(orderId, merchantId, orderAmount);
        }

        List<CommissionRecord> records = new ArrayList<>();
        List<CalculateCommissionResponse.CommissionDetail> details = new ArrayList<>();
        BigDecimal totalCommission = BigDecimal.ZERO;

        for (MerchantServiceSubscription subscription : subscriptions) {
            PlatformService service = subscription.getService();

            // 检查最低订单金额
            if (service.getMinOrderAmount() != null &&
                    orderAmount.compareTo(service.getMinOrderAmount()) < 0) {
                continue;
            }

            // 计算分成金额
            BigDecimal commissionAmount = calculateCommissionAmount(service, orderAmount);

            // 创建分成记录
            CommissionRecord record = CommissionRecord.builder()
                    .orderId(orderId)
                    .merchantId(merchantId)
                    .service(service)
                    .serviceName(service.getServiceName())
                    .orderAmount(orderAmount)
                    .feeType(service.getFeeType())
                    .feeValue(service.getFeeValue())
                    .commissionAmount(commissionAmount)
                    .status(CommissionStatus.PENDING)
                    .build();

            records.add(record);
            totalCommission = totalCommission.add(commissionAmount);

            details.add(CalculateCommissionResponse.CommissionDetail.builder()
                    .serviceId(service.getId())
                    .serviceName(service.getServiceName())
                    .feeDisplay(formatFeeDisplay(service))
                    .commissionAmount(commissionAmount)
                    .build());
        }

        // 批量保存
        commissionRecordRepository.saveAll(records);
        log.info("Calculated commission for order {}: total={}", orderId, totalCommission);

        return CalculateCommissionResponse.builder()
                .orderId(orderId)
                .merchantId(merchantId)
                .orderAmount(orderAmount)
                .totalCommission(totalCommission)
                .netIncome(orderAmount.subtract(totalCommission))
                .details(details)
                .build();
    }

    private CalculateCommissionResponse buildEmptyResponse(Long orderId, Long merchantId, BigDecimal orderAmount) {
        return CalculateCommissionResponse.builder()
                .orderId(orderId)
                .merchantId(merchantId)
                .orderAmount(orderAmount)
                .totalCommission(BigDecimal.ZERO)
                .netIncome(orderAmount)
                .details(new ArrayList<>())
                .build();
    }

    private BigDecimal calculateCommissionAmount(PlatformService service, BigDecimal orderAmount) {
        return switch (service.getFeeType()) {
            case PERCENTAGE -> orderAmount.multiply(service.getFeeValue())
                    .setScale(2, RoundingMode.HALF_UP);
            case FIXED_PER_ORDER -> service.getFeeValue();
            case FIXED_MONTHLY -> BigDecimal.ZERO;
        };
    }

    private String formatFeeDisplay(PlatformService service) {
        var feeValue = service.getFeeValue();
        return switch (service.getFeeType()) {
            case PERCENTAGE -> feeValue.multiply(BigDecimal.valueOf(100))
                    .stripTrailingZeros().toPlainString() + "%";
            case FIXED_PER_ORDER -> "¥" + feeValue.stripTrailingZeros().toPlainString() + "/单";
            case FIXED_MONTHLY -> "¥" + feeValue.stripTrailingZeros().toPlainString() + "/月";
        };
    }

    /**
     * 退款时回滚分成
     */
    @Transactional
    public void refundCommission(Long orderId) {
        List<CommissionRecord> records = commissionRecordRepository.findByOrderId(orderId);
        for (CommissionRecord record : records) {
            if (record.getStatus() == CommissionStatus.PENDING) {
                record.setStatus(CommissionStatus.REFUNDED);
            }
        }
        commissionRecordRepository.saveAll(records);
        log.info("Refunded commission for order: {}", orderId);
    }

    /**
     * 获取商家的分成记录（分页）
     */
    public Page<CommissionRecordDTO> getMerchantCommissions(Long merchantId, Pageable pageable) {
        return commissionRecordRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId, pageable)
                .map(CommissionRecordDTO::fromEntity);
    }

    /**
     * 按状态获取商家的分成记录
     */
    public Page<CommissionRecordDTO> getMerchantCommissionsByStatus(
            Long merchantId, CommissionStatus status, Pageable pageable) {
        return commissionRecordRepository
                .findByMerchantIdAndStatusOrderByCreatedAtDesc(merchantId, status, pageable)
                .map(CommissionRecordDTO::fromEntity);
    }

    /**
     * 获取商家分成汇总
     */
    public CommissionSummaryDTO getMerchantCommissionSummary(
            Long merchantId, LocalDateTime startTime, LocalDateTime endTime) {

        // 总体统计
        Object[] total = commissionRecordRepository
                .sumCommissionByMerchantAndTimeRange(merchantId, startTime, endTime);

        // 处理嵌套的Object数组结构
        Object[] actualTotal;
        if (total != null && total.length > 0 && total[0] instanceof Object[]) {
            actualTotal = (Object[]) total[0];
        } else {
            actualTotal = total;
        }

        BigDecimal totalCommission = actualTotal != null && actualTotal[0] != null ? (BigDecimal) actualTotal[0]
                : BigDecimal.ZERO;
        Long orderCount = actualTotal != null && actualTotal[1] != null ? (Long) actualTotal[1] : 0L;
        BigDecimal totalOrderAmount = actualTotal != null && actualTotal[2] != null ? (BigDecimal) actualTotal[2]
                : BigDecimal.ZERO;

        // 待结算统计
        Object[] pending = commissionRecordRepository
                .sumCommissionByMerchantAndStatus(merchantId, CommissionStatus.PENDING);

        // 处理嵌套的Object数组结构
        Object[] actualPending;
        if (pending != null && pending.length > 0 && pending[0] instanceof Object[]) {
            actualPending = (Object[]) pending[0];
        } else {
            actualPending = pending;
        }
        BigDecimal pendingCommission = actualPending != null && actualPending[0] != null ? (BigDecimal) actualPending[0]
                : BigDecimal.ZERO;

        // 已结算统计
        Object[] settled = commissionRecordRepository
                .sumCommissionByMerchantAndStatus(merchantId, CommissionStatus.SETTLED);

        // 处理嵌套的Object数组结构
        Object[] actualSettled;
        if (settled != null && settled.length > 0 && settled[0] instanceof Object[]) {
            actualSettled = (Object[]) settled[0];
        } else {
            actualSettled = settled;
        }
        BigDecimal settledCommission = actualSettled != null && actualSettled[0] != null ? (BigDecimal) actualSettled[0]
                : BigDecimal.ZERO;

        // 按类别统计
        List<Object[]> categoryStats = commissionRecordRepository
                .sumCommissionByMerchantGroupByCategory(merchantId, startTime, endTime);

        List<CommissionSummaryDTO.CategoryCommissionDTO> categoryDetails = categoryStats.stream()
                .map(row -> CommissionSummaryDTO.CategoryCommissionDTO.builder()
                        .category(((ServiceCategory) row[0]).name())
                        .categoryName(getCategoryName((ServiceCategory) row[0]))
                        .commissionAmount((BigDecimal) row[1])
                        .recordCount((Long) row[2])
                        .build())
                .collect(Collectors.toList());

        // 计算净收入和分成率
        BigDecimal netIncome = totalOrderAmount.subtract(totalCommission);
        BigDecimal commissionRate = BigDecimal.ZERO;
        if (totalOrderAmount.compareTo(BigDecimal.ZERO) > 0) {
            commissionRate = totalCommission.divide(totalOrderAmount, 4, RoundingMode.HALF_UP);
        }

        return CommissionSummaryDTO.builder()
                .totalCommission(totalCommission)
                .pendingCommission(pendingCommission)
                .settledCommission(settledCommission)
                .orderCount(orderCount)
                .totalOrderAmount(totalOrderAmount)
                .netIncome(netIncome)
                .commissionRate(commissionRate)
                .categoryDetails(categoryDetails)
                .build();
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
     * 获取订单的分成详情
     */
    public List<CommissionRecordDTO> getOrderCommissions(Long orderId) {
        return commissionRecordRepository.findByOrderId(orderId).stream()
                .map(CommissionRecordDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 获取所有分成记录（管理员用）
     * 
     * @param pageable 分页参数
     * @param status   状态筛选（可选）
     */
    public Page<CommissionRecordDTO> getAllCommissions(Pageable pageable, String status) {
        Page<CommissionRecord> records;

        if (status != null && !status.isEmpty()) {
            try {
                CommissionStatus commissionStatus = CommissionStatus.valueOf(status.toUpperCase());
                records = commissionRecordRepository.findByStatusOrderByCreatedAtDesc(commissionStatus, pageable);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid commission status: {}, returning all records", status);
                records = commissionRecordRepository.findAllByOrderByCreatedAtDesc(pageable);
            }
        } else {
            records = commissionRecordRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return records.map(CommissionRecordDTO::fromEntity);
    }
}
