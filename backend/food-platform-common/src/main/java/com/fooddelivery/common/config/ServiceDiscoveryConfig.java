package com.fooddelivery.common.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

/**
 * 服务发现配置
 * 可通过配置开关控制是否启用
 */
@Configuration
@ConditionalOnProperty(name = "eureka.client.enabled", havingValue = "true", matchIfMissing = true)
public class ServiceDiscoveryConfig {
    // 该配置类的存在即表示启用了服务发现
    // 在 Spring Cloud 2023.0.0+ 中，@EnableEurekaClient 已被移除，只需要依赖存在即可自动启用
}