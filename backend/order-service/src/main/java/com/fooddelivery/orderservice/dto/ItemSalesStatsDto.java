package com.fooddelivery.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 数据传输对象：用于在服务间传输商品销量统计数据
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ItemSalesStatsDto {
    private Long menuItemId;
    private String menuItemName;
    private Long totalQuantity;      // 总销量
    private BigDecimal totalRevenue; // 总销售额
}