package com.fooddelivery.orderservice.repository;

import com.fooddelivery.orderservice.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {
    List<OrderStatusHistory> findByOrderIdOrderByStatusChangedAtDesc(Long orderId);
}
