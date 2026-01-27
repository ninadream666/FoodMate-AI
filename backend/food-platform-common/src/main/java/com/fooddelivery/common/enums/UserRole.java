package com.fooddelivery.common.enums;

/**
 * 用户角色枚举
 */
public enum UserRole {
    CUSTOMER("customer", "顾客"),
    MERCHANT("merchant", "商家"),
    ADMIN("admin", "管理员");

    private final String code;
    private final String description;

    UserRole(String code, String description) {
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
     * 根据code获取角色
     */
    public static UserRole fromCode(String code) {
        if (code == null) {
            return CUSTOMER; // 默认为顾客
        }
        for (UserRole role : values()) {
            if (role.code.equalsIgnoreCase(code)) {
                return role;
            }
        }
        return CUSTOMER; // 默认为顾客
    }

    /**
     * 验证角色代码是否有效
     */
    public static boolean isValidRole(String code) {
        if (code == null)
            return false;
        for (UserRole role : values()) {
            if (role.code.equalsIgnoreCase(code)) {
                return true;
            }
        }
        return false;
    }
}