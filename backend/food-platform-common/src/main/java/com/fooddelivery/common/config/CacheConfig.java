package com.fooddelivery.common.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis缓存配置
 */
@Configuration
@EnableCaching
@ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis")
public class CacheConfig {

    /**
     * 配置缓存管理器
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // 默认缓存配置
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30)) // 默认30分钟过期
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues(); // 不缓存null值

        // 针对不同缓存的个性化配置
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // 用户缓存 - 1小时过期
        cacheConfigurations.put("users", defaultConfig.entryTtl(Duration.ofHours(1)));

        // 商家缓存 - 2小时过期
        cacheConfigurations.put("merchants", defaultConfig.entryTtl(Duration.ofHours(2)));

        // 菜单缓存 - 30分钟过期
        cacheConfigurations.put("menu_items", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // 订单缓存 - 10分钟过期（订单变化频繁）
        cacheConfigurations.put("orders", defaultConfig.entryTtl(Duration.ofMinutes(10)));

        // 优惠券缓存 - 15分钟过期
        cacheConfigurations.put("coupons", defaultConfig.entryTtl(Duration.ofMinutes(15)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}