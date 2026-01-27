package com.fooddelivery.orderservice.config;

import com.fooddelivery.orderservice.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // 启用CORS
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 使用 AntPathRequestMatcher 显式匹配路径，解决 403 问题
                .requestMatchers(new AntPathRequestMatcher("/orders/internal/**")).permitAll()
                // 放行 Swagger
                .requestMatchers(new AntPathRequestMatcher("/swagger-ui/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/v3/api-docs/**")).permitAll()
                // 放行监控端点
                .requestMatchers(new AntPathRequestMatcher("/actuator/**")).permitAll()
                // 临时允许admin接口用于测试
                .requestMatchers(new AntPathRequestMatcher("/api/admin/orders/**")).permitAll()
                // 临时允许支付接口用于测试
                .requestMatchers(new AntPathRequestMatcher("/orders/*/pay")).permitAll()
                // 其他所有请求必须认证
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /**
     * CORS配置 - 允许前端跨域访问
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 允许的源（开发环境允许所有，生产环境应该限制具体域名）
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));

        // 允许的HTTP方法
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 允许的请求头
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // 允许携带认证信息（如Cookie、Authorization header）
        configuration.setAllowCredentials(true);

        // 预检请求的有效期（秒）
        configuration.setMaxAge(3600L);

        // 暴露的响应头
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}