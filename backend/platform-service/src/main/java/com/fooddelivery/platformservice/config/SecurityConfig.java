package com.fooddelivery.platformservice.config;

import com.fooddelivery.platformservice.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

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
                                // 1. 启用 CORS (关键缺失点)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // ========== CORS 预检请求 (必须放行) ==========
                                                .requestMatchers(new AntPathRequestMatcher("/**",
                                                                HttpMethod.OPTIONS.name()))
                                                .permitAll()

                                                // ========== Swagger & 监控 ==========
                                                .requestMatchers(
                                                                new AntPathRequestMatcher("/swagger-ui/**"),
                                                                new AntPathRequestMatcher("/api-docs/**"),
                                                                new AntPathRequestMatcher("/v3/api-docs/**"),
                                                                new AntPathRequestMatcher("/swagger-resources/**"),
                                                                new AntPathRequestMatcher("/actuator/**"),
                                                                new AntPathRequestMatcher("/health"))
                                                .permitAll()

                                                // ========== 临时放行用于测试的接口 ==========
                                                .requestMatchers(
                                                                new AntPathRequestMatcher(
                                                                                "/api/admin/dashboard/overview"),
                                                                new AntPathRequestMatcher("/admin/dashboard/overview"),
                                                                new AntPathRequestMatcher(
                                                                                "/api/admin/settlements/stats"),
                                                                new AntPathRequestMatcher("/admin/settlements/stats"),
                                                                new AntPathRequestMatcher(
                                                                                "/api/admin/settlements/trend"),
                                                                new AntPathRequestMatcher("/admin/settlements/trend"))
                                                .permitAll()

                                                // ========== 内部接口 ==========
                                                .requestMatchers(
                                                                new AntPathRequestMatcher("/api/internal/**"),
                                                                new AntPathRequestMatcher("/internal/**"))
                                                .permitAll()

                                                // ========== 业务接口权限控制 ==========
                                                // 商家接口 - 登录即可访问，具体权限由业务层校验店铺所有权
                                                .requestMatchers(
                                                                new AntPathRequestMatcher("/api/merchant/**"),
                                                                new AntPathRequestMatcher("/merchant/**"))
                                                .authenticated()

                                                // 管理员接口
                                                .requestMatchers(
                                                                new AntPathRequestMatcher("/api/admin/**"),
                                                                new AntPathRequestMatcher("/admin/**"))
                                                .hasRole("ADMIN")

                                                // 其他需要认证
                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        // 2. 添加 CORS 配置 Bean (与其他服务保持一致)
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowCredentials(true);
                config.setAllowedOriginPatterns(List.of("*"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
                config.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }
}