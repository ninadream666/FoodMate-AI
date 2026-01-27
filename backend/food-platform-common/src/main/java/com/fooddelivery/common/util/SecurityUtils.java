package com.fooddelivery.common.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.fooddelivery.common.filter.JwtAuthenticationFilter.JwtAuthenticationDetails;

/**
 * 安全工具类，用于获取当前用户信息
 */
public class SecurityUtils {

    /**
     * 获取当前认证信息
     */
    public static Authentication getCurrentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    /**
     * 获取当前用户名
     */
    public static String getCurrentUsername() {
        Authentication authentication = getCurrentAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return authentication.getName();
    }

    /**
     * 获取当前用户ID
     */
    public static Long getCurrentUserId() {
        Authentication authentication = getCurrentAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object details = authentication.getDetails();
        if (details instanceof JwtAuthenticationDetails) {
            return ((JwtAuthenticationDetails) details).getUserId();
        }
        return null;
    }

    /**
     * 获取当前用户角色
     */
    public static String getCurrentUserRole() {
        Authentication authentication = getCurrentAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object details = authentication.getDetails();
        if (details instanceof JwtAuthenticationDetails) {
            return ((JwtAuthenticationDetails) details).getRole();
        }
        return null;
    }

    /**
     * 判断当前用户是否为管理员
     */
    public static boolean isAdmin() {
        String role = getCurrentUserRole();
        return "admin".equalsIgnoreCase(role);
    }

    /**
     * 判断当前用户是否为商家
     */
    public static boolean isMerchant() {
        String role = getCurrentUserRole();
        return "merchant".equalsIgnoreCase(role);
    }

    /**
     * 判断当前用户是否为顾客
     */
    public static boolean isCustomer() {
        String role = getCurrentUserRole();
        return "customer".equalsIgnoreCase(role);
    }

    /**
     * 判断是否已认证
     */
    public static boolean isAuthenticated() {
        Authentication authentication = getCurrentAuthentication();
        return authentication != null && authentication.isAuthenticated();
    }
}