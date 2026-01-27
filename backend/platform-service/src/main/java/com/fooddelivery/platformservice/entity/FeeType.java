package com.fooddelivery.platformservice.entity;

/**
 * 收费类型枚举
 */
public enum FeeType {
    /**
     * 按订单金额百分比收费
     */
    PERCENTAGE,

    /**
     * 每单固定金额
     */
    FIXED_PER_ORDER,

    /**
     * 按月固定金额
     */
    FIXED_MONTHLY
}
