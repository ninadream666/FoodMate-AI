package com.fooddelivery.orderservice.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderItemDetailDto {
    private Long menuItemId;
    private String menuItemName;
    private Integer quantity;
    private BigDecimal unitPrice;         // 单价（点单时）
    private BigDecimal originalUnitPrice; // 原价
    private BigDecimal subtotal;          // 小计
}
