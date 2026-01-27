package com.fooddelivery.platformservice.entity;

/**
 * 分成状态枚举
 */
public enum CommissionStatus {
    /**
     * 待结算
     */
    PENDING,

    /**
     * 已结算
     */
    SETTLED,

    /**
     * 已退款（订单取消）
     */
    REFUNDED
}
