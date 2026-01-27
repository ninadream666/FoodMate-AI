package com.fooddelivery.orderservice.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 用于接收商家服务返回的菜品信息
 */
@Data
public class MenuItemDto {
    private Long id;
    private String name;
    private BigDecimal price;
    private String description;
    private String category;
    private String imageUrl;
    private Boolean available;
}