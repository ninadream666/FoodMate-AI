package com.fooddelivery.orderservice.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateOrderDto {
    private String merchantId;  // 支持数字 ID 或外部 ID（如 B0FFKPDZZI）
    private List<OrderItemDto> items;

    @Data
    public static class OrderItemDto {
        private Long menuItemId;
        private BigDecimal price;
        private Integer quantity;
    }
}