package com.fooddelivery.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户服务 Feign 客户端
 * 用于 order-service 调用 user-service 的 API
 */
@FeignClient(name = "user-service", path = "/users")
public interface UserServiceClient {

    /**
     * 记录用户取消订单历史并更新信用等级
     * POST /users/{userId}/cancellations/record
     */
    @PostMapping("/{userId}/cancellations/record")
    ResponseEntity<?> recordCancellation(
            @PathVariable("userId") Long userId,
            @RequestBody Map<String, Object> request);

    /**
     * 获取用户信用信息
     * GET /users/{userId}/credit
     */
    @GetMapping("/{userId}/credit")
    ResponseEntity<?> getUserCredit(@PathVariable("userId") Long userId);

    /**
     * 尝试升级用户信用等级
     * POST /users/{userId}/credit/upgrade
     */
    @PostMapping("/{userId}/credit/upgrade")
    ResponseEntity<?> tryUpgradeCredit(@PathVariable("userId") Long userId);
}
