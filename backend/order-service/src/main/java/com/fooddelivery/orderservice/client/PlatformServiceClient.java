package com.fooddelivery.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Platform Service Feign 客户端
 * 用于调用平台服务的内部接口
 */
@FeignClient(name = "platform-service", path = "/api/internal/commissions")
public interface PlatformServiceClient {

    /**
     * 计算订单分成
     * POST /api/internal/commissions/calculate
     */
    @PostMapping("/calculate")
    ResponseEntity<?> calculateCommission(@RequestBody Map<String, Object> request);
}
