package com.fooddelivery.common.enums;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 订单状态枚举
 */
public enum OrderStatus {
    PENDING("PENDING", "待支付"),
    PAID("PAID", "已支付"),
    CONFIRMED("CONFIRMED", "已确认"),
    PREPARING("PREPARING", "制作中"),
    READY("READY", "已完成"),
    DELIVERED("DELIVERED", "已配送"),
    COMPLETED("COMPLETED", "已完成"),
    CANCELLED("CANCELLED", "已取消"),
    REFUNDED("REFUNDED", "已退款"),
    CANCEL_PENDING("CANCEL_PENDING", "取消审核中");

    private final String code;
    private final String description;

    OrderStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 根据code获取状态
     */
    public static OrderStatus fromCode(String code) {
        if (code == null)
            return null;
        for (OrderStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return null;
    }

    /**
     * 判断是否为最终状态（不可变更）
     */
    public boolean isFinalStatus() {
        return this == COMPLETED || this == CANCELLED || this == REFUNDED;
    }

    /**
     * 判断订单是否可以取消
     */
    public boolean isCancellable() {
        return this == PENDING || this == PAID || this == CONFIRMED;
    }

    /**
     * 判断订单是否可以退款
     */
    public boolean isRefundable() {
        return this == PAID || this == CONFIRMED || this == PREPARING;
    }
}