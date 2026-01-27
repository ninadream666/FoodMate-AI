package com.fooddelivery.userservice.repository;

import com.fooddelivery.userservice.entity.CancellationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface CancellationHistoryRepository extends JpaRepository<CancellationHistory, Long> {
    int countByUserIdAndCancelledAtAfter(Long userId, LocalDateTime startTime);
}
