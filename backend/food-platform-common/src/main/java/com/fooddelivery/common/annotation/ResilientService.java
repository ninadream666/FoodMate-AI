package com.fooddelivery.common.annotation;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;

import java.lang.annotation.*;

/**
 * 组合注解：包含所有弹性模式
 * 
 * 使用示例：
 * 
 * @ResilientService(name = "user-service")
 *                        public User getUserById(Long id) {
 *                        return userServiceClient.findById(id);
 *                        }
 */
@Target({ ElementType.METHOD, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@CircuitBreaker(name = "default")
@Retry(name = "default")
@RateLimiter(name = "default")
@Bulkhead(name = "default")
@TimeLimiter(name = "default")
public @interface ResilientService {
    // 服务名称
    String name() default "default";

    // 降级方法名
    String fallbackMethod() default "";
}