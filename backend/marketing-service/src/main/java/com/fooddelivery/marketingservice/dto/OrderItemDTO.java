package com.fooddelivery.marketingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 订单商品项DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDTO {
    /**
     * 商品ID
     */
    private Long itemId;

    /**
     * 商品单价
     */
    private BigDecimal price;

    /**
     * 购买数量
     */
    private Integer quantity;

    /**
     * 商家ID
     */
    private Long merchantId;
}
