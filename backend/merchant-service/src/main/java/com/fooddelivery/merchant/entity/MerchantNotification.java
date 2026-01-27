package com.fooddelivery.merchant.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "merchant_notifications")
@Data
public class MerchantNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long merchantId;
    
    private String title;
    
    @Column(length = 1000)
    private String content;
    
    private String type; // e.g., PRICE_UPDATE
    
    private boolean isRead = false;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}