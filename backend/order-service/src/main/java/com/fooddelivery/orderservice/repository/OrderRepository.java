package com.fooddelivery.orderservice.repository;

import com.fooddelivery.orderservice.dto.ItemSalesStatsDto;
import com.fooddelivery.common.enums.OrderStatus;
import com.fooddelivery.orderservice.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, OrderStatus status);

    List<Order> findByMerchantIdAndCancelStatusOrderByCreatedAtDesc(String merchantId, String cancelStatus);

    List<Order> findByMerchantIdAndStatus(String merchantId, OrderStatus status);

    List<Order> findByUserIdAndCreatedAtAfter(Long userId, LocalDateTime startTime);

    // AI Pricing 专用聚合查询
    // 真实逻辑：利用数据库计算能力，避免应用层内存溢出
    @Query("""
        SELECT new com.fooddelivery.orderservice.dto.ItemSalesStatsDto(
            oi.menuItemId,
            'UNKNOWN', 
            SUM(oi.quantity),
            SUM(oi.price * oi.quantity)
        )
        FROM Order o
        JOIN o.items oi
        WHERE o.merchantId = :merchantId
        AND o.createdAt >= :startDate
        AND (o.status = 'COMPLETED' OR o.status = 'PAID' OR o.status = 'DELIVERED')
        GROUP BY oi.menuItemId
    """)
    List<ItemSalesStatsDto> findSalesStatsByMerchant(
            @Param("merchantId") Long merchantId,
            @Param("startDate") LocalDateTime startDate
    );

    // 管理员统计查询
    long countByCreatedAtAfter(LocalDateTime startTime);

    long countByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o")
    Optional<BigDecimal> sumTotalAmount();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt BETWEEN :startTime AND :endTime")
    Optional<BigDecimal> sumTotalAmountByDateRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    long countByStatus(OrderStatus status);
}
