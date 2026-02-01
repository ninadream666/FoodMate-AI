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
                // 1. 禁用 CSRF
                .csrf(AbstractHttpConfigurer::disable)

                // 2. 统一 CORS 配置
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 3. 无状态 Session
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. 权限规则
                .authorizeHttpRequests(auth -> auth
                        // Swagger & 监控 (公开)
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()

                        // 内部调用/管理员接口 (暂时公开或需认证，视需求而定)
                        .requestMatchers("/api/admin/coupons/**", "/admin/coupons/**").permitAll()

                        // ========== 关键修改 ==========
                        // 领取优惠券(POST) / 查看我的优惠券(GET) -> 必须认证
                        // 同时兼容 /api/coupons 和 /coupons 开头的路径
                        .requestMatchers("/api/coupons/user/**", "/coupons/user/**").authenticated()
                        .requestMatchers("/api/coupons/issue/**", "/coupons/issue/**").authenticated()

                        // 如果有公开的优惠券列表(例如首页推荐)，可以放行
                        .requestMatchers(HttpMethod.GET, "/api/coupons/public/**", "/coupons/public/**").permitAll()

                        // 兜底：其他所有 /coupons 请求默认放行 (或者改成 authenticated 收紧权限)
                        // 为了防止不知名的 403，这里暂时保留宽泛的 permitAll，但建议生产环境改为 authenticated()
                        .requestMatchers("/coupons/**", "/api/coupons/**").permitAll()

                        .anyRequest().authenticated())

                // 5. 添加 JWT 过滤器
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // 允许跨域携带凭证 (Cookie/Token) - 这里改为 true 以匹配 user-service
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*"); // 使用 Pattern 允许所有
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        source.registerCorsConfiguration("/**", config);
        return source;
    }
}