package com.fooddelivery.merchant.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "merchants")
@Data
@EntityListeners(AuditingEntityListener.class)
public class Merchant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 外部ID，来自智能体/地图API
    @Column(name = "external_id", unique = true, length = 50)
    private String externalId;

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String address;

    // 地理位置
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // 餐厅图片URL
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // 评分（0-5）
    @Column(name = "rating")
    private Double rating;

    // 菜系类型
    @Column(name = "cuisine_type", length = 100)
    private String cuisineType;

    // 联系电话
    @Column(name = "phone", length = 50)
    private String phone;

    // 餐厅描述
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // 数据来源：LOCAL（本地创建）、AGENT（智能体导入）、AMAP（高德）、GOOGLE（Google Places）
    @Column(name = "source", length = 20)
    private String source = "LOCAL";

    @Column(name = "enable_dynamic_pricing")
    private Boolean enableDynamicPricing = true;

    @Column(name = "pricing_strategy_id")
    private Long pricingStrategyId;

    @Column(name = "ai_pricing_budget_percentage")
    private Integer aiPricingBudgetPercentage = 5;

    @Column(name = "enable_auto_approval")
    private Boolean enableAutoApproval = false; // 默认关闭自动审批

    @Column(name = "auto_approval_threshold")
    private Double autoApprovalThreshold = 0.05; // 默认 5%

    // 审计字段
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
