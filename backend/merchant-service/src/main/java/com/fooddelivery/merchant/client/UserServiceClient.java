package com.fooddelivery.merchant.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户服务Feign客户端
 * 用于merchant-service调用user-service的API
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
}
