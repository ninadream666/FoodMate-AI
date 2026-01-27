package com.fooddelivery.marketingservice.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 异步处理配置类
 * 为智能发放功能提供异步执行能力，避免阻塞主业务流程
 */
@Configuration
@EnableAsync
@Slf4j
public class AsyncConfig {

    /**
     * 智能发放专用线程池
     * 配置独立的线程池处理智能发放任务，保证系统稳定性
     */
    @Bean("smartIssuanceExecutor")
    public Executor smartIssuanceExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // 核心线程数：适应基础并发量
        executor.setCorePoolSize(5);

        // 最大线程数：处理高峰期并发
        executor.setMaxPoolSize(20);

        // 队列容量：缓存待处理任务
        executor.setQueueCapacity(100);

        // 线程名称前缀：便于日志追踪
        executor.setThreadNamePrefix("SmartIssuance-");

        // 空闲线程存活时间（秒）
        executor.setKeepAliveSeconds(60);

        // 拒绝策略：使用调用者线程执行，避免任务丢失
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

        // 线程池关闭时等待任务完成
        executor.setWaitForTasksToCompleteOnShutdown(true);

        // 等待时间（秒）
        executor.setAwaitTerminationSeconds(60);

        executor.initialize();

        log.info("Smart Issuance thread pool initialized - Core: {}, Max: {}, Queue: {}",
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());

        return executor;
    }

    /**
     * 通用异步任务线程池
     * 处理其他异步任务，如日志记录、统计等
     */
    @Bean("generalAsyncExecutor")
    public Executor generalAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("GeneralAsync-");
        executor.setKeepAliveSeconds(30);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);

        executor.initialize();

        log.info("General async thread pool initialized - Core: {}, Max: {}, Queue: {}",
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());

        return executor;
    }
}