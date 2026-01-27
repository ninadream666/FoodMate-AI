package com.fooddelivery.common.enums;

/**
 * 支付状态枚举
 */
public enum PaymentStatus {
    PENDING("PENDING", "待支付"),
    SUCCESS("SUCCESS", "支付成功"),
    FAILED("FAILED", "支付失败"),
    REFUNDING("REFUNDING", "退款中"),
    REFUNDED("REFUNDED", "已退款"),
    PARTIAL_REFUNDED("PARTIAL_REFUNDED", "部分退款");

    private final String code;
    private final String description;

    PaymentStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 根据code获取支付状态
     */
    public static PaymentStatus fromCode(String code) {
        if (code == null)
            return null;
        for (PaymentStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return null;
    }

    /**
     * 判断是否为最终状态
     */
    public boolean isFinalStatus() {
        return this == SUCCESS || this == FAILED || this == REFUNDED;
    }

    /**
     * 判断是否可以退款
     */
    public boolean isRefundable() {
        return this == SUCCESS;
    }
}