package com.fooddelivery.common.config;

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.time.Duration;

/**
 * 微服务弹性模式配置
 * 包含断路器、重试、限流、隔板、超时等完整的弹性模式
 * 
 * 可通过配置开关控制是否启用，确保向后兼容性
 */
@Configuration
@ConditionalOnProperty(name = "resilience.enabled", havingValue = "true", matchIfMissing = false)
public class ResilienceConfig {

    /**
     * 断路器配置
     * 实现服务熔断保护
     */
    @Bean
    public CircuitBreakerConfig circuitBreakerConfig() {
        return CircuitBreakerConfig.custom()
                .failureRateThreshold(50) // 失败率达到50%时熔断
                .waitDurationInOpenState(Duration.ofSeconds(30)) // 熔断后等待30秒
                .slidingWindowSize(10) // 滑动窗口大小
                .minimumNumberOfCalls(5) // 最小调用次数
                .permittedNumberOfCallsInHalfOpenState(3) // 半开状态允许的调用次数
                .automaticTransitionFromOpenToHalfOpenEnabled(true) // 自动转换到半开状态
                .recordExceptions(Exception.class) // 记录所有异常
                .build();
    }

    /**
     * 重试配置
     * 实现失败重试机制
     */
    @Bean
    public RetryConfig retryConfig() {
        return RetryConfig.custom()
                .maxAttempts(3) // 最大重试3次
                .waitDuration(Duration.ofSeconds(1)) // 重试间隔1秒
                .retryOnException(throwable -> !(throwable instanceof IllegalArgumentException)) // 不重试业务异常
                .build();
    }

    /**
     * 限流配置
     * 实现API限流保护
     */
    @Bean
    public RateLimiterConfig rateLimiterConfig() {
        return RateLimiterConfig.custom()
                .limitRefreshPeriod(Duration.ofSeconds(1)) // 每秒刷新限制
                .limitForPeriod(100) // 每秒允许100个请求
                .timeoutDuration(Duration.ofMillis(500)) // 等待许可超时时间
                .build();
    }

    /**
     * 隔板配置
     * 实现线程池隔离
     */
    @Bean
    public BulkheadConfig bulkheadConfig() {
        return BulkheadConfig.custom()
                .maxConcurrentCalls(25) // 最大并发调用数
                .maxWaitDuration(Duration.ofMillis(1000)) // 最大等待时间
                .build();
    }

    /**
     * 超时配置
     * 实现调用超时控制
     */
    @Bean
    public TimeLimiterConfig timeLimiterConfig() {
        return TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(3)) // 超时时间3秒
                .cancelRunningFuture(true) // 取消正在运行的任务
                .build();
    }
}