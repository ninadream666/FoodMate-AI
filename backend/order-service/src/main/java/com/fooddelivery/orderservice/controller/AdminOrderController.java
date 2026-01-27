package com.fooddelivery.orderservice.controller;

import com.fooddelivery.common.enums.OrderStatus;
import com.fooddelivery.orderservice.dto.AdminOrderDto;
import com.fooddelivery.orderservice.entity.Order;
import com.fooddelivery.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderRepository orderRepository;

    /**
     * 获取订单统计数据（带状态统计）
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOrderStats() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime yesterdayStart = todayStart.minusDays(1);

        long totalCount = orderRepository.count();
        long todayCount = orderRepository.countByCreatedAtAfter(todayStart);

        BigDecimal totalRevenue = orderRepository.sumTotalAmount().orElse(BigDecimal.ZERO);
        BigDecimal todayRevenue = orderRepository.sumTotalAmountByDateRange(todayStart, LocalDateTime.now())
                .orElse(BigDecimal.ZERO);

        // 计算增长率（简化计算）
        long yesterdayCount = orderRepository.countByCreatedAtBetween(yesterdayStart, todayStart);
        double growthRate = yesterdayCount > 0 ? ((double) (todayCount - yesterdayCount) / yesterdayCount) * 100 : 0.0;

        // 按状态统计
        long pendingCount = orderRepository.countByStatus(OrderStatus.PENDING);
        long paidCount = orderRepository.countByStatus(OrderStatus.PAID);
        long completedCount = orderRepository.countByStatus(OrderStatus.COMPLETED);
        long cancelledCount = orderRepository.countByStatus(OrderStatus.CANCELLED);

        Map<String, Object> stats = new HashMap<>();
        // 基础统计
        stats.put("totalCount", totalCount);
        stats.put("todayCount", todayCount);
        stats.put("totalRevenue", totalRevenue);
        stats.put("todayRevenue", todayRevenue);
        stats.put("growthRate", growthRate);
        // 前端兼容字段
        stats.put("total", totalCount);
        stats.put("pending", pendingCount);
        stats.put("paid", paidCount); // 修正为processing
        stats.put("completed", completedCount);
        stats.put("cancelled", cancelledCount);
        stats.put("todayOrders", todayCount);

        return ResponseEntity.ok(stats);
    }

    /**
     * 获取总销售额
     */
    @GetMapping("/total-sales")
    public ResponseEntity<Map<String, Object>> getTotalSales() {
        BigDecimal totalSales = orderRepository.sumTotalAmount().orElse(BigDecimal.ZERO);
        long orderCount = orderRepository.count();

        return ResponseEntity.ok(Map.of(
                "totalSales", totalSales,
                "orderCount", orderCount));
    }

    /**
     * 获取今日订单数
     */
    @GetMapping("/today-count")
    public ResponseEntity<Map<String, Object>> getTodayCount() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long count = orderRepository.countByCreatedAtAfter(todayStart);
        BigDecimal revenue = orderRepository.sumTotalAmountByDateRange(todayStart, LocalDateTime.now())
                .orElse(BigDecimal.ZERO);

        return ResponseEntity.ok(Map.of(
                "count", count,
                "revenue", revenue));
    }

    /**
     * 获取订单趋势（最近7天）
     * 返回包含 trends 数组和 summary 统计的完整数据
     */
    @GetMapping("/trends")
    public ResponseEntity<Map<String, Object>> getOrderTrends() {
        List<Map<String, Object>> trends = new java.util.ArrayList<>();
        long totalOrders = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

            long count = orderRepository.countByCreatedAtBetween(dayStart, dayEnd);
            BigDecimal revenue = orderRepository.sumTotalAmountByDateRange(dayStart, dayEnd)
                    .orElse(BigDecimal.ZERO);

            totalOrders += count;
            totalRevenue = totalRevenue.add(revenue);

            Map<String, Object> dayStats = new HashMap<>();
            dayStats.put("date", date.toString());
            dayStats.put("orderCount", count); // 前端期望的字段名
            dayStats.put("count", count); // 保持兼容
            dayStats.put("revenue", revenue);
            trends.add(dayStats);
        }

        // 计算平均订单金额和增长率
        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // 计算上周同期数据用于增长率
        LocalDateTime lastWeekStart = LocalDate.now().minusDays(14).atStartOfDay();
        LocalDateTime lastWeekEnd = LocalDate.now().minusDays(7).atStartOfDay();
        long lastWeekOrders = orderRepository.countByCreatedAtBetween(lastWeekStart, lastWeekEnd);
        double growthRate = lastWeekOrders > 0
                ? ((double) (totalOrders - lastWeekOrders) / lastWeekOrders) * 100
                : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalOrders", totalOrders);
        summary.put("totalRevenue", totalRevenue);
        summary.put("avgOrderValue", avgOrderValue);
        summary.put("growthRate", Math.round(growthRate * 100.0) / 100.0);

        Map<String, Object> result = new HashMap<>();
        result.put("trends", trends);
        result.put("summary", summary);

        return ResponseEntity.ok(result);
    }

    /**
     * 获取所有订单（分页）
     * 返回包含状态中文描述的DTO
     */
    @GetMapping("/all")
    public ResponseEntity<Page<AdminOrderDto>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders;

        if (status != null && !status.isEmpty()) {
            OrderStatus orderStatus = OrderStatus.fromCode(status);
            if (orderStatus != null) {
                orders = orderRepository.findByStatus(orderStatus, pageRequest);
            } else {
                orders = orderRepository.findAll(pageRequest); // 无效状态时返回全部
            }
        } else {
            orders = orderRepository.findAll(pageRequest);
        }

        // 转换为DTO，包含状态的完整信息
        Page<AdminOrderDto> orderDtos = orders.map(this::convertToAdminDto);
        return ResponseEntity.ok(orderDtos);
    }

    /**
     * 将Order实体转换为AdminOrderDto
     */
    private AdminOrderDto convertToAdminDto(Order order) {
        // 构建支付方式信息
        AdminOrderDto.PaymentMethodInfo paymentMethodInfo = null;
        if (order.getPaymentMethod() != null) {
            paymentMethodInfo = AdminOrderDto.PaymentMethodInfo.builder()
                    .code(order.getPaymentMethod().getCode())
                    .description(order.getPaymentMethod().getDescription())
                    .build();
        }

        return AdminOrderDto.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .merchantId(order.getMerchantId())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .originalAmount(order.getOriginalAmount())
                .status(AdminOrderDto.OrderStatusInfo.builder()
                        .code(order.getStatus().getCode())
                        .description(order.getStatus().getDescription())
                        .build())
                .createdAt(order.getCreatedAt())
                .paidAt(order.getPaidAt())
                .paymentMethod(paymentMethodInfo)
                .paymentTransactionId(order.getPaymentTransactionId())
                .paymentChannel(order.getPaymentChannel())
                .cancelReason(order.getCancelReason())
                .cancelStatus(order.getCancelStatus())
                .refundAmount(order.getRefundAmount())
                .refundApprovedAt(order.getRefundApprovedAt())
                .build();
    }

    /**
     * 获取订单详情
     * 返回包含状态中文描述的DTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<AdminOrderDto> getOrder(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(this::convertToAdminDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 修改订单状态
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return orderRepository.findById(id)
                .map(order -> {
                    String newStatusCode = body.get("status");
                    if (newStatusCode != null) {
                        OrderStatus newStatus = OrderStatus.fromCode(newStatusCode);
                        if (newStatus != null) {
                            order.setStatus(newStatus);
                        }
                    }
                    Order saved = orderRepository.save(order);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
