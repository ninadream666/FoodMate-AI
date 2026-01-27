package com.fooddelivery.platformservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 平台服务实体
 * 定义平台提供的各类服务（基础服务、配送服务、流量服务、运营服务）
 */
@Entity
@Table(name = "platform_services")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 服务编码，唯一标识，如 BASIC_TECH_FEE
     */
    @Column(name = "service_code", unique = true, nullable = false, length = 50)
    private String serviceCode;

    /**
     * 服务名称
     */
    @Column(name = "service_name", nullable = false, length = 100)
    private String serviceName;

    /**
     * 服务类别：BASIC/TRAFFIC/DELIVERY/OPERATION
     */
    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private ServiceCategory category;

    /**
     * 服务描述
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * 收费类型：PERCENTAGE/FIXED_PER_ORDER/FIXED_MONTHLY
     */
    @Column(name = "fee_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private FeeType feeType;

    /**
     * 费用值
     * - PERCENTAGE: 小数形式，如0.05表示5%
     * - FIXED_*: 固定金额
     */
    @Column(name = "fee_value", nullable = false, precision = 10, scale = 4)
    private BigDecimal feeValue;

    /**
     * 计费周期：PER_ORDER/MONTHLY/DAILY
     */
    @Column(name = "billing_cycle", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private BillingCycle billingCycle;

    /**
     * 最低订单金额要求（可选）
     */
    @Column(name = "min_order_amount", precision = 10, scale = 2)
    private BigDecimal minOrderAmount;

    /**
     * 是否强制订阅（基础服务为true）
     */
    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory;

    /**
     * 服务状态：ACTIVE/INACTIVE
     */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ServiceStatus status;

    /**
     * 排序权重
     */
    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ServiceStatus.ACTIVE;
        }
        if (isMandatory == null) {
            isMandatory = false;
        }
        if (billingCycle == null) {
            billingCycle = BillingCycle.PER_ORDER;
        }
        if (sortOrder == null) {
            sortOrder = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
