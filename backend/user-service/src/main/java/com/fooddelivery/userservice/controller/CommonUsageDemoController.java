package com.fooddelivery.userservice.controller;

import com.fooddelivery.common.dto.ApiResponse;
import com.fooddelivery.common.dto.PageResponse;
import com.fooddelivery.common.enums.UserRole;
import com.fooddelivery.common.util.PageUtils;
import com.fooddelivery.common.util.SecurityUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 演示如何使用 food-platform-common 中的公共组件
 */
@RestController
@RequestMapping("/api/demo")
public class CommonUsageDemoController {

    /**
     * 演示使用 ApiResponse 统一响应格式
     */
    @GetMapping("/api-response")
    public ApiResponse<String> demoApiResponse() {
        return ApiResponse.success("这是使用公共ApiResponse的示例");
    }

    /**
     * 演示使用 PageUtils 创建分页对象
     */
    @GetMapping("/pagination")
    public ApiResponse<PageResponse<String>> demoPagination(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {

        // 使用公共工具类创建分页对象
        Pageable pageable = PageUtils.createPageableWithIdDesc(page, size);

        // 模拟分页数据（在实际使用中这里会是数据库查询结果）
        PageResponse<String> pageResponse = PageResponse.empty(page, size);

        return ApiResponse.success("分页示例", pageResponse);
    }

    /**
     * 演示使用 SecurityUtils 获取当前用户信息
     */
    @GetMapping("/current-user")
    public ApiResponse<Object> demoCurrentUser() {
        if (!SecurityUtils.isAuthenticated()) {
            return ApiResponse.error("用户未登录");
        }

        return ApiResponse.success("当前用户信息", Map.of(
                "username", SecurityUtils.getCurrentUsername(),
                "userId", SecurityUtils.getCurrentUserId(),
                "role", SecurityUtils.getCurrentUserRole(),
                "isAdmin", SecurityUtils.isAdmin(),
                "isMerchant", SecurityUtils.isMerchant(),
                "isCustomer", SecurityUtils.isCustomer()));
    }

    /**
     * 演示使用 UserRole 枚举
     */
    @GetMapping("/roles")
    public ApiResponse<Object> demoUserRoles() {
        return ApiResponse.success("用户角色信息", Map.of(
                "availableRoles", UserRole.values(),
                "defaultRole", UserRole.CUSTOMER,
                "isValidRole", UserRole.isValidRole("admin")));
    }
}