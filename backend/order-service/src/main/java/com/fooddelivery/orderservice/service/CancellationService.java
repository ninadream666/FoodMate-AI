package com.fooddelivery.orderservice.service;

import com.fooddelivery.orderservice.entity.CancellationRecord;
import com.fooddelivery.orderservice.repository.CancellationRecordRepository;
import com.fooddelivery.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CancellationService {

    private final CancellationRecordRepository cancellationRecordRepository;
    private final OrderRepository orderRepository;

    /**
     * 记录取消事件
     */
    public void recordCancellation(Long userId, Long orderId) {
        CancellationRecord record = new CancellationRecord();
        record.setUserId(userId);
        record.setOrderId(orderId);
        record.setCancelledAt(LocalDateTime.now());
        cancellationRecordRepository.save(record);
    }

    /**
     * 获取用户7天内取消次数
     */
    public int getRecentCancellationCount(Long userId) {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        return cancellationRecordRepository.countByUserIdAndCancelledAtAfter(userId, sevenDaysAgo);
    }

    /**
     * 检查是否能升级信用等级
     * 规则：7天内无取消记录 && 最近30天有3+订单
     */
    public boolean canUpgradeCredit(Long userId) {
        // 检查7天内是否有取消
        if (getRecentCancellationCount(userId) > 0) {
            return false;
        }

        // 检查最近30天是否有3+订单
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long orderCount = orderRepository.findByUserIdAndCreatedAtAfter(userId, thirtyDaysAgo).size();

        return orderCount >= 3;
    }

    /**
     * 检查是否需要降级信用等级
     * 规则：7天内取消3+次
     */
    public boolean shouldDowngradeCredit(Long userId) {
        return getRecentCancellationCount(userId) >= 3;
    }
}
