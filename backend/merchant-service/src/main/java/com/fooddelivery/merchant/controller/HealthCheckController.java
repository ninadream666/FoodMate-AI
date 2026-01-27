package com.fooddelivery.merchant.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HealthCheckController {

    // 计划要求 "基本健康检查 /health"
    // Spring Actuator 已经自动提供了 /actuator/health
    // 我们这里额外加一个 /health 作为示例
    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        return Map.of("status", "UP");
    }
}