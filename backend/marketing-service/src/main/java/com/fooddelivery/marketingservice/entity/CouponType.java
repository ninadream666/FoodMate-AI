package com.fooddelivery.marketingservice.entity;

/**
 * 优惠券类型枚举
 */
public enum CouponType {
    /**
     * 折扣券：如打9折
     */
    DISCOUNT("折扣券"),

    /**
     * 满减券：满X元减Y元
     */
    THRESHOLD_REDUCTION("满减券"),

    /**
     * 无门槛券：直接减免Y元
     */
    NO_THRESHOLD("无门槛券"),

    /**
     * 免运费券
     */
    FREE_SHIPPING("免运费券");

    private final String description;

    CouponType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
