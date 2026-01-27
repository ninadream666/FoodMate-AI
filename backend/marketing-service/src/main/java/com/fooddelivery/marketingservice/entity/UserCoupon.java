package com.fooddelivery.marketingservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 用户优惠券实体类
 * 记录用户领取的优惠券状态
 */
@Entity
@Table(name = "user_coupons", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_coupon_template_id", columnList = "coupon_template_id"),
        @Index(name = "idx_user_status", columnList = "user_id,status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCoupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户ID
     */
    @Column(nullable = false)
    private Long userId;

    /**
     * 优惠券模板ID
     */
    @Column(nullable = false)
    private Long couponTemplateId;

    /**
     * 优惠券状态：
     * - AVAILABLE: 可用
     * - LOCKED: 已锁定（在订单中使用但未支付）
     * - USED: 已使用
     * - EXPIRED: 已过期
     */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private CouponStatus status;

    /**
     * 订单ID（如果已被锁定或使用）
     */
    @Column
    private Long orderId;

    /**
     * 获得优惠券的时间
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime obtainedAt;

    /**
     * 使用时间
     */
    @Column
    private LocalDateTime usedAt;

    /**
     * 过期时间（在这个时间之后，优惠券自动失效）
     */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /**
     * 创建时间
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 修改时间
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.obtainedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = CouponStatus.AVAILABLE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 判断优惠券是否可用（未使用、未过期、未锁定）
     */
    public boolean isAvailable() {
        return status == CouponStatus.AVAILABLE &&
                LocalDateTime.now().isBefore(expiresAt);
    }

    /**
     * 标记优惠券为已使用
     */
    public void use(Long orderId) {
        this.status = CouponStatus.USED;
        this.orderId = orderId;
        this.usedAt = LocalDateTime.now();
    }

    /**
     * 锁定优惠券（用于订单中，但还未支付）
     */
    public void lock(Long orderId) {
        this.status = CouponStatus.LOCKED;
        this.orderId = orderId;
    }

    /**
     * 解除锁定（订单取消时）
     */
    public void unlock() {
        this.status = CouponStatus.AVAILABLE;
        this.orderId = null;
    }
}
