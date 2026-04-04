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
                                // 启用CORS
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // ========== CORS预检请求 ==========
                                                .requestMatchers(new AntPathRequestMatcher("/**",
                                                                HttpMethod.OPTIONS.name()))
                                                .permitAll()

                                                // ========== Swagger&监控 ==========
                                                .requestMatchers(
                                                                new AntPathRequestMatcher("/swagger-ui/**"),
                                                                new AntPathRequestMatcher("/api-docs/**"),
                                                                new AntPathRequestMatcher("/v3/api-docs/**"),
                                                                new AntPathRequestMatcher("/swagger-resources/**"),
                                                                new AntPathRequestMatcher("/actuator/**"),
                                                                new AntPathRequestMatcher("/health"))
                                                .permitAll()

                                                // ========== 测试接口 ==========
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

        // 添加CORS配置Bean
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