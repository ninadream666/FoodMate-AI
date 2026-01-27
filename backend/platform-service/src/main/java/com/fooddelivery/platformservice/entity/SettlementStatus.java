package com.fooddelivery.platformservice.entity;

/**
 * 结算单状态枚举
 */
public enum SettlementStatus {
    /**
     * 待确认
     */
    PENDING_CONFIRM,

    /**
     * 已确认
     */
    CONFIRMED,

    /**
     * 有异议（简化处理，线下解决）
     */
    DISPUTED,

    /**
     * 已打款
     */
    PAID,

    /**
     * 已作废
     */
    CANCELLED
}
