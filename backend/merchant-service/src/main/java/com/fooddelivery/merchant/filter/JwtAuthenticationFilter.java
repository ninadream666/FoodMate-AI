package com.fooddelivery.merchant.filter;

import com.fooddelivery.merchant.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT 认证过滤器
 * 从请求头提取 JWT token，验证并设置 Spring Security 上下文
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        // 获取Authorization Header
        final String authHeader = request.getHeader("Authorization");
        
        // 检查Header格式是否正确：以"Bearer "开头
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 提取Token
            String jwt = authHeader.substring(7);
            
            // 从Token中提取用户信息
            String username = jwtUtil.extractUsername(jwt);
            Long userId = jwtUtil.extractUserId(jwt);
            String role = jwtUtil.extractRole(jwt);
            
            // 兼容旧token：如果role为null，默认为customer
            if (role == null) {
                role = "customer";
            }

            // 如果用户名存在，且当前上下文没有认证信息
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // 验证 Token 是否有效
                if (jwtUtil.isTokenValid(jwt, username)) {
                    // 生成认证令牌
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userId, // principal 使用 userId
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // 将认证信息放入 Spring Security 上下文
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token 解析失败，继续执行但不设置认证信息
            logger.error("JWT authentication failed: " + e.getMessage());
        }
        
        // 放行，进入下一个过滤器
        filterChain.doFilter(request, response);
    }
}
