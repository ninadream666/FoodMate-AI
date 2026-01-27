package com.fooddelivery.marketingservice.entity;

/**
 * 用户优惠券状态枚举
 */
public enum CouponStatus {
    /**
     * 可用状态
     */
    AVAILABLE("可用"),

    /**
     * 已锁定状态（在订单中使用但未支付）
     */
    LOCKED("已锁定"),

    /**
     * 已使用
     */
    USED("已使用"),

    /**
     * 已过期
     */
    EXPIRED("已过期");

    private final String description;

    CouponStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
