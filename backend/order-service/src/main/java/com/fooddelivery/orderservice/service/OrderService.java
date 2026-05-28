package com.fooddelivery.orderservice.service;

import com.fooddelivery.common.enums.OrderStatus;
import com.fooddelivery.common.enums.PaymentMethod;
import com.fooddelivery.orderservice.client.PlatformServiceClient;
import com.fooddelivery.orderservice.client.UserServiceClient;
import com.fooddelivery.orderservice.dto.OrderDetailDto;
import com.fooddelivery.orderservice.dto.OrderItemDetailDto;
import com.fooddelivery.orderservice.dto.PaymentConfirmDto;
import com.fooddelivery.orderservice.dto.RefundApprovalDto;
import com.fooddelivery.orderservice.entity.MenuItem;
import com.fooddelivery.orderservice.entity.Order;
import com.fooddelivery.orderservice.entity.OrderItem;
import com.fooddelivery.orderservice.entity.OrderStatusHistory;
import com.fooddelivery.orderservice.repository.MenuItemRepository;
import com.fooddelivery.orderservice.repository.OrderRepository;
import com.fooddelivery.orderservice.repository.OrderStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final CancellationService cancellationService;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final UserServiceClient userServiceClient;
    private final RabbitTemplate rabbitTemplate;
    private final PlatformServiceClient platformServiceClient;
    private final com.fooddelivery.orderservice.client.MerchantServiceClient merchantServiceClient;

    /**
     * 把订单的字符串 merchantId（external_id 或数字 id）转换为商家表的数字 id
     * commission_records 表的 merchant_id 是 bigint，需要数字 id 才能写入
     */
    private Long resolveMerchantNumericId(String merchantId) {
        if (merchantId == null || merchantId.isBlank()) return null;
        try {
            // 如果本身就是数字 id，直接返回
            return Long.parseLong(merchantId);
        } catch (NumberFormatException ignored) {
            // 不是数字，调 merchant-service 查
        }
        try {
            Map<String, Object> resp = merchantServiceClient.resolveMerchantId(merchantId);
            if (resp != null && resp.get("id") != null) {
                return Long.valueOf(resp.get("id").toString());
            }
        } catch (Exception e) {
            log.warn("resolveMerchantNumericId 调用失败: merchantId={}, error={}", merchantId, e.getMessage());
        }
        return null;
    }

    /**
     * 取消订单（用户侧）
     * 接单前：立即全额退款
     * 接单后：等待商家批准
     */
    @Transactional
    public ResponseEntity<?> cancelOrder(Long orderId, String cancelReason) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "订单不存在"));
        }

        Order order = orderOpt.get();

        // 检查订单状态是否可以取消
        if (order.getStatus() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "订单状态异常"));
        }

        // PENDING状态下可以取消，其他状态需要等待商家批准
        boolean isUnaccepted = OrderStatus.PENDING == order.getStatus();

        order.setCancelReason(cancelReason);

        if (isUnaccepted) {
            // 接单前：立即全额退款
            order.setCancelStatus("APPROVED");
            order.setRefundAmount(order.getTotalAmount());
            order.setRefundApprovedAt(LocalDateTime.now());
            recordStatusChange(order, order.getStatus(), OrderStatus.CANCELLED);
            order.setStatus(OrderStatus.CANCELLED);
        } else {
            // 接单后：等待商家批准
            order.setCancelStatus("PENDING_APPROVAL");
            recordStatusChange(order, order.getStatus(), OrderStatus.CANCEL_PENDING);
            order.setStatus(OrderStatus.CANCEL_PENDING);
        }

        orderRepository.save(order);

        // 记录取消事件到用户服务（调用用户服务的接口）
        try {
            Map<String, Object> cancellationData = new HashMap<>();
            cancellationData.put("orderId", orderId);
            cancellationData.put("cancelReason", cancelReason);
            cancellationData.put("cancelTime", LocalDateTime.now().toString());

            userServiceClient.recordCancellation(order.getUserId(), cancellationData);
            log.info("已通知用户服务记录取消：userId={}, orderId={}", order.getUserId(), orderId);
        } catch (Exception e) {
            log.error("调用用户服务失败：{}", e.getMessage());
            // 不影响主流程，仅记录日志
        }

        return ResponseEntity.ok(Map.of(
                "message", isUnaccepted ? "订单已取消，全额退款已处理" : "取消申请已提交，等待商家确认",
                "orderId", orderId,
                "cancelStatus", order.getCancelStatus(),
                "refundAmount", order.getRefundAmount() != null ? order.getRefundAmount() : "待审批"));
    }

    /**
     * 内部方法：商家同意取消 - 仅供商家服务调用
     * 权限校验应在商家服务进行
     */
    @Transactional
    public ResponseEntity<?> updateOrderCancelStatusToApproved(Long orderId, BigDecimal refundAmount) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("订单不存在"));

            if (order.getStatus() != OrderStatus.CANCEL_PENDING) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "订单不在待审批状态"));
            }

            order.setCancelStatus("APPROVED");
            order.setRefundAmount(refundAmount);
            order.setRefundApprovedAt(LocalDateTime.now());
            order.setStatus(OrderStatus.CANCELLED);

            recordStatusChange(order, OrderStatus.CANCEL_PENDING, OrderStatus.CANCELLED);
            orderRepository.save(order);

            return ResponseEntity.ok(Map.of(
                    "message", "订单取消状态已更新为已批准",
                    "orderId", orderId,
                    "refundAmount", refundAmount));
        } catch (Exception e) {
            log.error("更新订单取消状态失败：{}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 商家拒绝取消 - 仅供商家服务调用
     */
    @Transactional
    public ResponseEntity<?> updateOrderCancelStatusToRejected(Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("订单不存在"));

            if (order.getStatus() != OrderStatus.CANCEL_PENDING) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "订单不在待审批状态"));
            }

            order.setCancelStatus("REJECTED");
            order.setStatus(OrderStatus.CONFIRMED);

            recordStatusChange(order, OrderStatus.CANCEL_PENDING, OrderStatus.CONFIRMED);
            orderRepository.save(order);

            return ResponseEntity.ok(Map.of(
                    "message", "订单取消状态已更新为已拒绝",
                    "orderId", orderId));
        } catch (Exception e) {
            log.error("更新订单取消状态失败：{}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 计算退款金额 - 仅供内部使用
     */
    private BigDecimal calculateRefundAmount(Long orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            // 目前规则：全额退款
            return order.getTotalAmount();
        }
        return BigDecimal.ZERO;
    }

    /**
     * 获取订单详情（含优惠信息）
     */
    public ResponseEntity<?> getOrderDetail(Long orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "订单不存在"));
        }

        Order order = orderOpt.get();
        OrderDetailDto detailDto = buildOrderDetailDto(order);

        return ResponseEntity.ok(detailDto);
    }

    /**
     * 构建订单详情DTO
     */
    private OrderDetailDto buildOrderDetailDto(Order order) {
        OrderDetailDto dto = new OrderDetailDto();
        dto.setOrderId(order.getId());
        dto.setMerchantId(order.getMerchantId());
        dto.setUserId(order.getUserId());
        dto.setStatus(order.getStatus());
        dto.setCancelStatus(order.getCancelStatus());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setTotalAmount(order.getTotalAmount());

        // 设置价格信息
        BigDecimal originalAmount = order.getOriginalAmount() != null ? order.getOriginalAmount()
                : order.getTotalAmount();
        dto.setOriginalAmount(originalAmount);

        BigDecimal discountAmount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        dto.setDiscountAmount(discountAmount);

        dto.setAiDiscountReason(order.getAiDiscountReason());

        // 设置支付信息
        dto.setPaidAt(order.getPaidAt());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setPaymentTransactionId(order.getPaymentTransactionId());
        dto.setPaymentChannel(order.getPaymentChannel());
        dto.setIsPaid(order.getPaidAt() != null);

        // 构建订单项详情
        List<OrderItemDetailDto> itemDetails = buildOrderItemDetails(order.getItems());
        dto.setOrderItems(itemDetails);

        // 检查是否可以取消（已支付的订单也可以取消，但需要走退款流程）
        dto.setCanCancel(order.getStatus() == OrderStatus.PENDING ||
                order.getStatus() == OrderStatus.PAID ||
                order.getStatus() == OrderStatus.CONFIRMED);

        return dto;
    }

    /**
     * 构建订单项详情列表
     */
    private List<OrderItemDetailDto> buildOrderItemDetails(List<OrderItem> items) {
        return items.stream().map(item -> {
            OrderItemDetailDto itemDto = new OrderItemDetailDto();
            itemDto.setMenuItemId(item.getMenuItemId());
            itemDto.setQuantity(item.getQuantity());
            itemDto.setUnitPrice(item.getPrice());

            // 获取菜品信息
            Optional<MenuItem> menuItemOpt = menuItemRepository.findById(item.getMenuItemId());
            if (menuItemOpt.isPresent()) {
                MenuItem menuItem = menuItemOpt.get();
                itemDto.setMenuItemName(menuItem.getName());
                itemDto.setOriginalUnitPrice(
                        menuItem.getBasePrice() != null ? menuItem.getBasePrice() : item.getPrice());
            }

            // 计算小计
            BigDecimal subtotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            itemDto.setSubtotal(subtotal);

            return itemDto;
        }).collect(Collectors.toList());
    }

    /**
     * 获取待审批的退款订单列表（给商家看的）
     */
    public List<OrderDetailDto> getPendingRefundOrders(String merchantId) {
        // 查询该商家所有状态为 CANCEL_PENDING 的订单
        List<Order> pendingOrders = orderRepository.findByMerchantIdAndStatus(merchantId, OrderStatus.CANCEL_PENDING);

        // 转换为 DTO
        return pendingOrders.stream()
                .map(this::buildOrderDetailDto)
                .collect(Collectors.toList());
    }

    /**
     * 记录订单状态变更
     */
    private void recordStatusChange(Order order, OrderStatus oldStatus, OrderStatus newStatus) {
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrderId(order.getId());
        history.setOldStatus(oldStatus != null ? oldStatus.getCode() : null);
        history.setNewStatus(newStatus != null ? newStatus.getCode() : null);
        history.setStatusChangedAt(LocalDateTime.now());
        orderStatusHistoryRepository.save(history);
    }

    /**
     * 确认支付成功
     * 接收支付服务的回调，更新订单支付状态
     */
    @Transactional
    public ResponseEntity<?> confirmPayment(Long orderId, PaymentConfirmDto paymentDto) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "订单不存在"));
        }

        Order order = orderOpt.get();

        // 检查订单是否已支付
        if (order.getPaidAt() != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "订单已支付，请勿重复操作"));
        }

        // 检查订单状态是否可以支付
        OrderStatus currentStatus = order.getStatus();
        if (currentStatus != OrderStatus.PENDING) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "订单状态不正确，无法完成支付",
                            "currentStatus", currentStatus.getCode()));
        }

        // 校验支付金额（如果提供了）
        if (paymentDto.getPaidAmount() != null) {
            if (order.getTotalAmount().compareTo(paymentDto.getPaidAmount()) != 0) {
                log.warn("支付金额不匹配: 订单金额={}, 支付金额={}",
                        order.getTotalAmount(), paymentDto.getPaidAmount());
                // 这里可以选择返回错误或记录日志继续处理
            }
        }

        // 更新支付信息
        order.setPaidAt(LocalDateTime.now());
        order.setPaymentMethod(PaymentMethod.fromCode(paymentDto.getPaymentMethod()));
        order.setPaymentTransactionId(paymentDto.getPaymentTransactionId());
        order.setPaymentChannel(paymentDto.getPaymentChannel());

        // 更新订单状态为已支付待接单
        OrderStatus newStatus = OrderStatus.PAID;
        recordStatusChange(order, currentStatus, newStatus);
        order.setStatus(newStatus);

        orderRepository.save(order);

        log.info("订单支付成功: orderId={}, transactionId={}, paymentMethod={}",
                orderId, paymentDto.getPaymentTransactionId(), paymentDto.getPaymentMethod());

        try {
            sendOrderPaidEvent(order);
        } catch (Exception e) {
            log.error("Failed to send order.paid event to RabbitMQ", e);
            // 不影响支付主流程
        }

        // 触发分成计算（异步调用，失败不影响支付流程）
        try {
            Long merchantNumericId = resolveMerchantNumericId(order.getMerchantId());
            if (merchantNumericId != null) {
                Map<String, Object> commissionRequest = new HashMap<>();
                commissionRequest.put("orderId", orderId);
                commissionRequest.put("merchantId", merchantNumericId);
                commissionRequest.put("orderAmount", order.getTotalAmount());

                platformServiceClient.calculateCommission(commissionRequest);
                log.info("已触发订单分成计算: orderId={}, merchantId={} (numeric={}), amount={}",
                        orderId, order.getMerchantId(), merchantNumericId, order.getTotalAmount());
            } else {
                log.warn("无法解析商家ID，跳过分成计算: orderId={}, merchantId={}", orderId, order.getMerchantId());
            }
        } catch (Exception e) {
            // 分成计算失败不影响支付流程，记录日志即可，定时任务会兜底
            log.warn("触发分成计算失败，将由定时任务处理: orderId={}, error={}", orderId, e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "message", "支付成功，订单已更新",
                "orderId", orderId,
                "status", newStatus,
                "paidAt", order.getPaidAt().toString(),
                "paymentTransactionId",
                paymentDto.getPaymentTransactionId() != null ? paymentDto.getPaymentTransactionId() : "",
                "totalAmount", order.getTotalAmount()));
    }

    /**
     * 辅助方法：构建并发送消息
     */
    private void sendOrderPaidEvent(Order order) {
        Map<String, Object> event = new HashMap<>();
        event.put("orderId", order.getId());
        event.put("merchantId", order.getMerchantId());
        event.put("userId", order.getUserId());
        event.put("timestamp", LocalDateTime.now().toString());

        List<Map<String, Object>> items = order.getItems().stream().map(item -> {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("menuItemId", item.getMenuItemId());
            itemMap.put("quantity", item.getQuantity());
            itemMap.put("unitPrice", item.getPrice());
            return itemMap;
        }).collect(Collectors.toList());

        event.put("items", items);

        // 发送到order.events交换机，路由键order.paid
        rabbitTemplate.convertAndSend("order.events", "order.paid", event);
        log.info("Sent RabbitMQ message: order.paid for order {}", order.getId());
    }

    /**
     * 商家接单
     */
    @Transactional
    public ResponseEntity<?> acceptOrder(Long orderId, String merchantId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "订单不存在"));
        }

        Order order = orderOpt.get();

        // 验证订单属于该商家
        if (!String.valueOf(order.getMerchantId()).equals(String.valueOf(merchantId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "无权操作该订单"));
        }

        // 只有PAID状态的订单才可以接单
        if (order.getStatus() != OrderStatus.PAID) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "订单状态不正确，无法接单", "currentStatus", order.getStatus().getCode()));
        }

        recordStatusChange(order, OrderStatus.PAID, OrderStatus.CONFIRMED);
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        log.info("商家接单成功: orderId={}, merchantId={}", orderId, merchantId);

        return ResponseEntity.ok(Map.of(
                "message", "接单成功",
                "orderId", orderId,
                "status", OrderStatus.CONFIRMED.getCode()));
    }

    /**
     * 商家拒单
     */
    @Transactional
    public ResponseEntity<?> rejectOrder(Long orderId, String merchantId, String rejectReason) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "订单不存在"));
        }

        Order order = orderOpt.get();

        if (!String.valueOf(order.getMerchantId()).equals(String.valueOf(merchantId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "无权操作该订单"));
        }

        if (order.getStatus() != OrderStatus.PAID) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "订单状态不正确，无法拒单", "currentStatus", order.getStatus().getCode()));
        }

        order.setCancelReason(rejectReason != null ? rejectReason : "商家拒绝接单");
        order.setCancelStatus("APPROVED");
        order.setRefundAmount(order.getTotalAmount());
        order.setRefundApprovedAt(LocalDateTime.now());
        recordStatusChange(order, OrderStatus.PAID, OrderStatus.CANCELLED);
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        log.info("商家拒单: orderId={}, merchantId={}, reason={}", orderId, merchantId, rejectReason);

        return ResponseEntity.ok(Map.of(
                "message", "已拒单，订单将全额退款",
                "orderId", orderId,
                "refundAmount", order.getRefundAmount()));
    }

    /**
     * 商家更新订单状态（备餐完成等）
     */
    @Transactional
    public ResponseEntity<?> updateOrderProgress(Long orderId, String merchantId, OrderStatus newStatus) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "订单不存在"));
        }

        Order order = orderOpt.get();

        if (!String.valueOf(order.getMerchantId()).equals(String.valueOf(merchantId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "无权操作该订单"));
        }

        // 验证状态流转合法性
        OrderStatus currentStatus = order.getStatus();
        if (!isValidTransition(currentStatus, newStatus)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "状态流转不合法",
                            "currentStatus", currentStatus.getCode(),
                            "targetStatus", newStatus.getCode()));
        }

        recordStatusChange(order, currentStatus, newStatus);
        order.setStatus(newStatus);
        orderRepository.save(order);

        log.info("订单状态更新: orderId={}, {} -> {}", orderId, currentStatus.getCode(), newStatus.getCode());

        // 订单完成或配送完成时，通知平台服务结算佣金
        if (newStatus == OrderStatus.COMPLETED || newStatus == OrderStatus.DELIVERED) {
            try {
                Long merchantNumericId = resolveMerchantNumericId(order.getMerchantId());
                if (merchantNumericId != null) {
                    Map<String, Object> settlementData = new HashMap<>();
                    settlementData.put("orderId", orderId);
                    settlementData.put("merchantId", merchantNumericId);
                    settlementData.put("orderAmount", order.getTotalAmount());
                    settlementData.put("action", "SETTLE");

                    platformServiceClient.calculateCommission(settlementData);
                    log.info("已触发订单完成结算: orderId={}, merchantId={} (numeric={})", orderId, order.getMerchantId(), merchantNumericId);
                }
            } catch (Exception e) {
                log.warn("触发结算失败，将由定时任务处理: orderId={}, error={}", orderId, e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "状态已更新",
                "orderId", orderId,
                "status", newStatus.getCode()));
    }

    /**
     * 验证订单是否属于该商家
     * merchantId可能是数据库主键或外部ID，只要订单中存的值匹配其中一个即可
     */
    private boolean isOrderOwnedByMerchant(Order order, String merchantId) {
        String orderMerchantId = String.valueOf(order.getMerchantId());
        return orderMerchantId.equals(String.valueOf(merchantId));
    }

    /**
     * 验证订单状态流转是否合法（商家侧）
     */
    private boolean isValidTransition(OrderStatus from, OrderStatus to) {
        if (from == OrderStatus.CONFIRMED && to == OrderStatus.PREPARING) return true;
        if (from == OrderStatus.PREPARING && to == OrderStatus.READY) return true;
        if (from == OrderStatus.READY && to == OrderStatus.DELIVERED) return true;
        if (from == OrderStatus.DELIVERED && to == OrderStatus.COMPLETED) return true;
        return false;
    }

    /**
     * 获取商家指定状态的订单列表
     * 支持同时用数据库主键和外部ID查询（订单表的merchant_id可能存的是任一种）
     */
    public List<OrderDetailDto> getMerchantOrdersByStatuses(String merchantId, List<OrderStatus> statuses) {
        List<Order> orders = orderRepository.findByMerchantIdAndStatusInOrderByCreatedAtDesc(merchantId, statuses);
        return orders.stream()
                .map(this::buildOrderDetailDto)
                .collect(Collectors.toList());
    }

    /**
     * 获取商家指定状态的订单列表（支持多个ID同时查询）
     * 用于兼容订单中存的merchantId可能是数据库主键或外部ID的情况
     */
    public List<OrderDetailDto> getMerchantOrdersByMultipleIds(List<String> merchantIds, List<OrderStatus> statuses) {
        List<Order> orders = orderRepository.findByMerchantIdInAndStatusInOrderByCreatedAtDesc(merchantIds, statuses);
        return orders.stream()
                .map(this::buildOrderDetailDto)
                .collect(Collectors.toList());
    }

    /**
     * 获取待审批的退款订单列表（支持多个ID）
     */
    public List<OrderDetailDto> getPendingRefundOrdersByMultipleIds(List<String> merchantIds) {
        List<Order> pendingOrders = orderRepository.findByMerchantIdInAndStatus(merchantIds, OrderStatus.CANCEL_PENDING);
        return pendingOrders.stream()
                .map(this::buildOrderDetailDto)
                .collect(Collectors.toList());
    }

    /**
     * 根据订单ID获取订单（内部方法）
     */
    public Optional<Order> getOrderById(Long orderId) {
        return orderRepository.findById(orderId);
    }
}