package com.fooddelivery.platformservice.filter;

import com.fooddelivery.platformservice.service.MerchantQueryService;
import com.fooddelivery.platformservice.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final MerchantQueryService merchantQueryService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                if (jwtUtil.validateToken(token)) {
                    Long userId = jwtUtil.getUserId(token);
                    String role = jwtUtil.getRole(token);

                    // 根据userId查询merchantId（不限角色，因为顾客也可能同时是商家）
                    Long merchantId = null;
                    try {
                        merchantId = merchantQueryService.getMerchantIdByUserId(userId);
                    } catch (Exception e) {
                        log.warn("Failed to query merchantId for user {}: {}", userId, e.getMessage());
                    }

                    // 创建认证对象
                    AuthenticatedUser user = new AuthenticatedUser(userId, role, merchantId);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                            );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Authenticated user: {} with role: {}, merchantId: {}", userId, role, merchantId);
                }
            } catch (Exception e) {
                log.warn("JWT validation failed: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 认证用户信息
     */
    public record AuthenticatedUser(Long userId, String role, Long merchantId) {
    }
}
