package com.fooddelivery.platformservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 商家服务订阅实体
 * 记录商家订阅的平台服务
 */
@Entity
@Table(name = "merchant_service_subscriptions",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_merchant_service_active",
           columnNames = {"merchant_id", "service_id", "status"}
       ))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantServiceSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 商家ID
     */
    @Column(name = "merchant_id", nullable = false)
    private Long merchantId;

    /**
     * 关联的平台服务
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private PlatformService service;

    /**
     * 订阅状态
     */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private SubscriptionStatus status;

    /**
     * 订阅时间
     */
    @Column(name = "subscribed_at", nullable = false)
    private LocalDateTime subscribedAt;

    /**
     * 过期时间（周期性服务用）
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * 取消时间
     */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    /**
     * 取消原因
     */
    @Column(name = "cancel_reason", length = 200)
    private String cancelReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (subscribedAt == null) {
            subscribedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = SubscriptionStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
