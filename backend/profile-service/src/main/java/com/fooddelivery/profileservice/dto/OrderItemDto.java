package com.fooddelivery.profileservice.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderItemDto {
    private Long id;
    private Long menuItemId;
    private BigDecimal price;
    private Integer quantity;
}