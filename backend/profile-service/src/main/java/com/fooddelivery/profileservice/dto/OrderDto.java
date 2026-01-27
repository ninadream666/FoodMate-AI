package com.fooddelivery.profileservice.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderDto {
    private Long id;
    private Long userId;
    private Long merchantId;
    private BigDecimal totalAmount;
    private String status;
    private List<OrderItemDto> items;
    private LocalDateTime createdAt;
}