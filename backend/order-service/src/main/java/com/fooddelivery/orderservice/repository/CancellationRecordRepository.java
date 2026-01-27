package com.fooddelivery.orderservice.repository;

import com.fooddelivery.orderservice.entity.CancellationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface CancellationRecordRepository extends JpaRepository<CancellationRecord, Long> {
    List<CancellationRecord> findByUserIdAndCancelledAtAfter(Long userId, LocalDateTime startTime);
    
    int countByUserIdAndCancelledAtAfter(Long userId, LocalDateTime startTime);
}
