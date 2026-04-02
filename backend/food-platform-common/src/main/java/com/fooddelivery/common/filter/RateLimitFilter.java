package com.fooddelivery.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 全局限流过滤器（无 API Gateway 时的兜底方案）
 *
 * 策略：
 * 1. 全局 QPS 限制：单实例最多 500 req/s，超过则返回 429
 * 2. 单 IP QPS 限制：同一 IP 最多 100 req/s，防止单点刷接口
 * 3. 并发连接数限制：同时最多处理 300 个请求，超过直接拒绝
 *
 * 通过 rate-limit.enabled=true 开启（默认关闭，避免对现有环境产生影响）
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10) // 优先级高，在 JWT 之前执行
@ConditionalOnProperty(name = "rate-limit.enabled", havingValue = "true", matchIfMissing = false)
public class RateLimitFilter extends OncePerRequestFilter {

    // 全局 QPS 计数
    private final AtomicInteger globalCounter = new AtomicInteger(0);
    private final AtomicLong globalWindowStart = new AtomicLong(System.currentTimeMillis());
    private static final int GLOBAL_QPS_LIMIT = 500;

    // 单 IP QPS 计数
    private final Map<String, IpRateState> ipCounters = new ConcurrentHashMap<>();
    private static final int IP_QPS_LIMIT = 100;

    // 并发连接限制
    private final AtomicInteger activeRequests = new AtomicInteger(0);
    private static final int MAX_CONCURRENT_REQUESTS = 300;

    // 清理间隔（每 60s 清理过期的 IP 计数器，防止内存泄漏）
    private final AtomicLong lastCleanup = new AtomicLong(System.currentTimeMillis());
    private static final long CLEANUP_INTERVAL_MS = 60_000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // 健康检查 / Actuator 端点不限流
        String path = request.getRequestURI();
        if (path.startsWith("/actuator") || path.equals("/health")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);

        // 检查 1：并发连接数
        int current = activeRequests.incrementAndGet();
        if (current > MAX_CONCURRENT_REQUESTS) {
            activeRequests.decrementAndGet();
            log.warn("[限流] 并发连接数超限: {}/{}, IP: {}, Path: {}", current, MAX_CONCURRENT_REQUESTS, clientIp, path);
            rejectRequest(response, "服务器繁忙，请稍后重试");
            return;
        }

        try {
            // 检查 2：全局 QPS
            if (!checkGlobalRate()) {
                log.warn("[限流] 全局 QPS 超限: >{}/s, IP: {}, Path: {}", GLOBAL_QPS_LIMIT, clientIp, path);
                rejectRequest(response, "系统繁忙，请稍后重试");
                return;
            }

            // 检查 3：单 IP QPS
            if (!checkIpRate(clientIp)) {
                log.warn("[限流] IP QPS 超限: {} > {}/s, Path: {}", clientIp, IP_QPS_LIMIT, path);
                rejectRequest(response, "请求过于频繁，请稍后重试");
                return;
            }

            // 定期清理过期 IP 计数器
            periodicCleanup();

            filterChain.doFilter(request, response);
        } finally {
            activeRequests.decrementAndGet();
        }
    }

    private boolean checkGlobalRate() {
        long now = System.currentTimeMillis();
        long windowStart = globalWindowStart.get();

        // 窗口过期，重置
        if (now - windowStart >= 1000) {
            globalWindowStart.set(now);
            globalCounter.set(1);
            return true;
        }

        return globalCounter.incrementAndGet() <= GLOBAL_QPS_LIMIT;
    }

    private boolean checkIpRate(String ip) {
        long now = System.currentTimeMillis();
        IpRateState state = ipCounters.computeIfAbsent(ip, k -> new IpRateState());

        // 窗口过期，重置
        if (now - state.windowStart.get() >= 1000) {
            state.windowStart.set(now);
            state.counter.set(1);
            return true;
        }

        return state.counter.incrementAndGet() <= IP_QPS_LIMIT;
    }

    private void periodicCleanup() {
        long now = System.currentTimeMillis();
        if (now - lastCleanup.get() > CLEANUP_INTERVAL_MS) {
            lastCleanup.set(now);
            // 清理 5s 内无请求的 IP
            ipCounters.entrySet().removeIf(e -> now - e.getValue().windowStart.get() > 5000);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty()) {
            return ip.split(",")[0].trim();
        }
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty()) {
            return ip;
        }
        return request.getRemoteAddr();
    }

    private void rejectRequest(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\",\"status\":429}");
    }

    private static class IpRateState {
        final AtomicInteger counter = new AtomicInteger(0);
        final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());
    }
}
