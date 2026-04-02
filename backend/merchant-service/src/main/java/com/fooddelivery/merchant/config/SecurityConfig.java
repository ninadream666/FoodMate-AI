package com.fooddelivery.merchant.config;

import com.fooddelivery.merchant.filter.JwtAuthenticationFilter;
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
                // 1. 禁用 CSRF (移动端必须)
                .csrf(AbstractHttpConfigurer::disable)

                // 2. 启用 CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 3. 设置无状态 Session
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. 权限规则配置 (注意顺序：越具体的越靠前)
                .authorizeHttpRequests(auth -> auth
                        // ========== [关键修复] 必须认证的接口 (放在通配符之前) ==========
                        // "我的店铺"信息必须登录才能看，防止被误判为公开接口
                        .requestMatchers("/api/merchants/my/**", "/merchants/my/**").authenticated()
                        .requestMatchers("/api/merchants/my", "/merchants/my").authenticated()

                        // 商家入驻/创建店铺 (POST) 必须登录
                        .requestMatchers(HttpMethod.POST, "/api/merchants", "/merchants").authenticated()

                        // ========== 公开接口 (白名单) ==========
                        // 导入数据 (允许智能体/脚本调用)
                        .requestMatchers("/api/merchants/import/**", "/merchants/import/**").permitAll()

                        // 内部服务调用
                        .requestMatchers("/merchants/internal/**", "/api/merchants/internal/**").permitAll()

                        // 商家详情/列表/菜单 (GET) - 允许公开查看
                        // 注意：这里放在 /my 之后，确保 /my 不会被这个通配符“吃掉”
                        .requestMatchers(HttpMethod.GET, "/merchants/**", "/api/merchants/**").permitAll()

                        // 管理员接口
                        .requestMatchers("/admin/**", "/api/admin/**").permitAll()

                        // Swagger 文档
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-resources/**").permitAll()

                        // ========== 其他所有请求必须认证 ==========
                        .anyRequest().authenticated())

                // 5. 添加 JWT 过滤器
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS 配置 Bean
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}