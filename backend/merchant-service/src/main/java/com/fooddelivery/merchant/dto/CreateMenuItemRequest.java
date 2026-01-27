package com.fooddelivery.merchant.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateMenuItemRequest {
    private String name;
    private BigDecimal price;
    private String description;
    private String imageUrl;
    private String category;
}