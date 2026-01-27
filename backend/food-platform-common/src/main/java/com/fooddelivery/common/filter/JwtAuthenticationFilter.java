package com.fooddelivery.common.filter;

import com.fooddelivery.common.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

//统一JWT认证过滤器,可被各微服务复用的JWT认证逻辑
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // 如果没有Authorization头或不是Bearer token，直接放行
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        username = jwtUtil.extractUsername(jwt);

        // 如果能提取到用户名且当前没有认证信息
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                // 验证token有效性
                if (jwtUtil.validateToken(jwt)) {
                    // 提取角色信息
                    String role = jwtUtil.extractRole(jwt);
                    Long userId = jwtUtil.extractUserId(jwt);

                    // 创建权限列表
                    List<SimpleGrantedAuthority> authorities = List.of(
                            new SimpleGrantedAuthority("ROLE_" + (role != null ? role.toUpperCase() : "USER")));

                    // 创建认证token
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username, null, authorities);

                    // 在token中存储额外信息（userId等）
                    authToken.setDetails(new JwtAuthenticationDetails(userId, role, username));

                    // 设置认证信息
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception e) {
                logger.warn("JWT token validation failed: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    //JWT认证详情类，用于存储JWT中的额外信息
    public static class JwtAuthenticationDetails {
        private final Long userId;
        private final String role;
        private final String username;

        public JwtAuthenticationDetails(Long userId, String role, String username) {
            this.userId = userId;
            this.role = role;
            this.username = username;
        }

        public Long getUserId() {
            return userId;
        }

        public String getRole() {
            return role;
        }

        public String getUsername() {
            return username;
        }
    }
}