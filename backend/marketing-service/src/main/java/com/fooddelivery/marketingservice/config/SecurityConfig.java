package com.fooddelivery.marketingservice.config;

import com.fooddelivery.marketingservice.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 禁用CSRF
                .csrf(AbstractHttpConfigurer::disable)

                // 统一CORS配置
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 无状态Session
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 权限规则
                .authorizeHttpRequests(auth -> auth
                        // Swagger&监控 (公开)
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()

                        // 内部调用/管理员接口
                        .requestMatchers("/api/admin/coupons/**", "/admin/coupons/**").permitAll()

                        // 领取优惠券(POST) / 查看我的优惠券(GET) -> 必须认证
                        // 同时兼容/api/coupons和/coupons开头的路径
                        .requestMatchers("/api/coupons/user/**", "/coupons/user/**").authenticated()
                        .requestMatchers("/api/coupons/issue/**", "/coupons/issue/**").authenticated()

                        // 如果有公开的优惠券列表，可以放行
                        .requestMatchers(HttpMethod.GET, "/api/coupons/public/**", "/coupons/public/**").permitAll()

                        // 兜底：其他所有/coupons请求默认放行
                        .requestMatchers("/coupons/**", "/api/coupons/**").permitAll()

                        .anyRequest().authenticated())

                // 添加JWT过滤器
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // 允许跨域携带凭证(Cookie/Token)
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*"); // 使用Pattern允许所有
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        source.registerCorsConfiguration("/**", config);
        return source;
    }
}