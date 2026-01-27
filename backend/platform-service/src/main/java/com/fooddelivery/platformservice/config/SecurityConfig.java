package com.fooddelivery.platformservice.config;

import com.fooddelivery.platformservice.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // 公开接口
                                                .requestMatchers(
                                                                "/swagger-ui/**",
                                                                "/api-docs/**",
                                                                "/v3/api-docs/**",
                                                                "/actuator/**",
                                                                "/health",
                                                                "/api/admin/dashboard/overview", // 临时允许dashboard接口用于测试
                                                                "/api/admin/settlements/stats", // 临时允许分成统计接口
                                                                "/api/admin/settlements/trend" // 临时允许分成趋势接口
                                                ).permitAll()
                                                // 内部接口（实际生产环境应使用内网认证）
                                                .requestMatchers("/api/internal/**").permitAll()
                                                // 管理员接口
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                // 商家接口
                                                .requestMatchers("/api/merchant/**").hasAnyRole("MERCHANT", "ADMIN")
                                                // 其他需要认证
                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}
