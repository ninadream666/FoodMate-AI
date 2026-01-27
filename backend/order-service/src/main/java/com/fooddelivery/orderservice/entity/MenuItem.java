package com.fooddelivery.orderservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "menu_items")
@Data
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "merchant_id")
    private Long merchantId;

    @Column(name = "name")
    private String name;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "description")
    private String description;

    @Column(name = "category")
    private String category;

    @Column(name = "is_available")
    private Boolean isAvailable;

    @Column(name = "base_price")
    private BigDecimal basePrice;

    @Column(name = "current_dynamic_price")
    private BigDecimal currentDynamicPrice;

    @Column(name = "cost_type")
    private String costType;

    @Column(name = "cost_amount")
    private BigDecimal costAmount;

    @Column(name = "pricing_strategy_id")
    private Long pricingStrategyId;

    @Column(name = "last_price_update_at")
    private LocalDateTime lastPriceUpdateAt;

    @Column(name = "is_dynamic")
    private Boolean isDynamic;
}
