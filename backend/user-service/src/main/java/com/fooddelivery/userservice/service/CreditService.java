package com.fooddelivery.userservice.service;

import com.fooddelivery.userservice.dto.UserCreditDto;
import com.fooddelivery.userservice.entity.CancellationHistory;
import com.fooddelivery.userservice.entity.User;
import com.fooddelivery.userservice.repository.CancellationHistoryRepository;
import com.fooddelivery.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CreditService {

    private final UserRepository userRepository;
    private final CancellationHistoryRepository cancellationHistoryRepository;

    /**
     * 获取用户信用信息
     */
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserCredit(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        UserCreditDto creditDto = new UserCreditDto();
        creditDto.setUserId(userId);
        creditDto.setCreditLevel(user.getCreditLevel() != null ? user.getCreditLevel() : 5);
        creditDto.setRecentCancellations(user.getRecentCancellations() != null ? user.getRecentCancellations() : 0);
        creditDto.setLastLevelChangeAt(user.getLastLevelChangeAt());

        return ResponseEntity.ok(creditDto);
    }

    /**
     * 记录取消事件并更新信用等级
     */
    @Transactional
    public void recordCancellationAndUpdateCredit(Long userId, Long orderId) {
        // 记录取消事件
        CancellationHistory history = new CancellationHistory();
        history.setUserId(userId);
        history.setOrderId(orderId);
        history.setCancelledAt(LocalDateTime.now());
        cancellationHistoryRepository.save(history);

        // 获取用户
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 更新最近取消次数
        int recentCount = getRecentCancellationCount(userId);
        user.setRecentCancellations(recentCount);

        // 检查是否需要降级信用等级（7天内3+次取消）
        if (recentCount >= 3) {
            if (user.getCreditLevel() == null || user.getCreditLevel() > 1) {
                int newLevel = (user.getCreditLevel() != null ? user.getCreditLevel() : 5) - 1;
                user.setCreditLevel(Math.max(newLevel, 1));
                user.setLastLevelChangeAt(LocalDateTime.now());
            }
        }

        userRepository.save(user);
    }

    /**
     * 尝试升级信用等级
     * 条件：7天内无取消 && 30天内有3+订单
     */
    @Transactional
    public void tryUpgradeCredit(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 检查7天内是否有取消
        if (getRecentCancellationCount(userId) > 0) {
            return;
        }

        // 如果满足升级条件
        if (user.getCreditLevel() == null || user.getCreditLevel() < 5) {
            int newLevel = (user.getCreditLevel() != null ? user.getCreditLevel() : 5) + 1;
            user.setCreditLevel(Math.min(newLevel, 5));
            user.setLastLevelChangeAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    /**
     * 获取最近7天的取消次数
     */
    private int getRecentCancellationCount(Long userId) {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        return cancellationHistoryRepository.countByUserIdAndCancelledAtAfter(userId, sevenDaysAgo);
    }
}
