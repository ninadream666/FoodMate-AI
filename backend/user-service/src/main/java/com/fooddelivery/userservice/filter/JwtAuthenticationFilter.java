package com.fooddelivery.userservice.filter;

import com.fooddelivery.userservice.service.CustomUserDetailsService;
import com.fooddelivery.userservice.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        // 获取Authorization Header
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // 检查Header格式是否正确：以"Bearer "开头
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 提取Token
        jwt = authHeader.substring(7);
        // 从Token中提取用户名
        username = jwtUtil.extractUsername(jwt);

        // 如果用户名存在，且当前上下文没有认证信息，避免重复认证
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // 从数据库加载用户信息
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // 验证Token是否有效
            if (jwtUtil.isTokenValid(jwt, userDetails.getUsername())) {
                // 生成认证令牌
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // 将认证信息放入Spring Security上下文
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        
        // 放行，进入下一个过滤器
        filterChain.doFilter(request, response);
    }
}