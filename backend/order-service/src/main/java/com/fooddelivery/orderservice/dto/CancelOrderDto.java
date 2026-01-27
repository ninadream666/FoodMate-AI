package com.fooddelivery.orderservice.dto;

import lombok.Data;

@Data
public class CancelOrderDto {
    private Long orderId;
    private String cancelReason;  // 取消原因（用户输入）
}
