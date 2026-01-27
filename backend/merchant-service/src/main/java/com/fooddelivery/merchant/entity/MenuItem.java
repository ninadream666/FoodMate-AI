package com.fooddelivery.merchant.entity;

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

    @Column(name = "merchant_id", nullable = false)
    private Long merchantId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(columnDefinition = "TEXT")
    private String description;

    // 新增字段，对应数据库修改
    @Column(name = "image_url")
    private String imageUrl;

    @Column(length = 50)
    private String category;

    @Column(name = "is_available")
    private Boolean isAvailable = true;
    
    // Dynamic Pricing Fields
    @Column(name = "base_price")
    private BigDecimal basePrice;

    @Column(name = "current_dynamic_price")
    private BigDecimal currentDynamicPrice;

    @Column(name = "is_dynamic")
    private Boolean isDynamic = false;

    @Column(name = "last_price_update_at")
    private LocalDateTime lastPriceUpdateAt;

    @PrePersist
    public void prePersist() {
        if (this.isAvailable == null) this.isAvailable = true;
        if (this.basePrice == null) this.basePrice = this.price;
        if (this.lastPriceUpdateAt == null) this.lastPriceUpdateAt = LocalDateTime.now();
    }
}