package com.fooddelivery.common.enums;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 支付方式枚举
 */
public enum PaymentMethod {
    WECHAT("WECHAT", "微信支付"),
    ALIPAY("ALIPAY", "支付宝"),
    CASH("CASH", "现金支付"),
    CARD("CARD", "银行卡支付");

    private final String code;
    private final String description;

    PaymentMethod(String code, String description) {
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
     * 根据code获取支付方式
     */
    public static PaymentMethod fromCode(String code) {
        if (code == null)
            return null;
        for (PaymentMethod method : values()) {
            if (method.code.equals(code)) {
                return method;
            }
        }
        return null;
    }
}