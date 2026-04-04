package com.fooddelivery.marketingservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 优惠券模板实体类
 * 存储优惠券规则、有效期、发放总量等信息
 */
@Entity
@Table(name = "coupon_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CouponTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 优惠券名称
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 优惠券描述
     */
    @Column(length = 255)
    private String description;

    /**
     * 优惠券类型：
     * - DISCOUNT: 折扣券（如：打9折）
     * - THRESHOLD_REDUCTION: 满减券（如：满30减5）
     * - NO_THRESHOLD: 无门槛券（直接减免）
     * - FREE_SHIPPING: 免运费券
     */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private CouponType type;

    /**
     * 优惠门槛金额（满X元）
     * 对于无门槛券和免运费券，可以为null或0
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderAmount;

    /**
     * 优惠值：
     * - 对于折扣券：9表示90折（即打9折）
     * - 对于满减/无门槛：实际减免金额
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    /**
     * 优惠券的最大优惠上限金额（可选）
     * 例如：一张券最多优惠50元
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal maxDiscount;

    /**
     * 发放总量限制（0表示无限制）
     */
    @Column(nullable = false)
    private Integer totalQuantity;

    /**
     * 当前已发放数量
     */
    @Column(nullable = false)
    private Integer issuedQuantity;

    /**
     * 有效期开始时间
     */
    @Column(nullable = false)
    private LocalDateTime validFrom;

    /**
     * 有效期结束时间
     */
    @Column(nullable = false)
    private LocalDateTime validUntil;

    /**
     * 是否启用（可在后台禁用某张券）
     */
    @Column(nullable = false)
    private Boolean enabled;

    /**
     * 是否允许与其他券叠加
     * - true: 可与其他券同时使用
     * - false: 不能与其他券同时使用（互斥）
     */
    @Column(nullable = false)
    private Boolean stackable;

    /**
     * 互斥券ID列表（JSON格式）
     * 指定与哪些券互斥（不能同时使用）
     */
    @Column(columnDefinition = "TEXT")
    private String exclusiveIds;

    /**
     * 适用商家ID列表（JSON格式）
     * 空值表示全商家可用
     */
    @Column(columnDefinition = "TEXT")
    private String applicableMerchantIds;

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
        this.issuedQuantity = 0;
        this.enabled = true;
        this.stackable = true;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 判断优惠券是否仍在有效期内
     */
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return this.enabled && now.isAfter(validFrom) && now.isBefore(validUntil);
    }

    /**
     * 判断是否还有可用的发放额度
     */
    public boolean hasAvailableQuantity() {
        return totalQuantity == 0 || issuedQuantity < totalQuantity;
    }
}
