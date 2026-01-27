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
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 开发环境允许所有来源
        configuration.setAllowedOriginPatterns(List.of("*")); // 使用 allowedOriginPatterns 替代 allowedOrigins
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true); // 改为 true
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ========== 管理员接口（临时开发模式全部放行）==========
                .requestMatchers(new AntPathRequestMatcher("/api/admin/**")).permitAll()

                // ========== 公开商家接口 ==========
                // 放行商家列表接口 (GET /merchants 和 /api/merchants)
                .requestMatchers(new AntPathRequestMatcher("/merchants", HttpMethod.GET.name())).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/merchants", HttpMethod.GET.name())).permitAll()

                // 放行公开菜单查看接口 (GET) - 支持数字 ID 和外部 ID
                .requestMatchers(new AntPathRequestMatcher("/merchants/*/menu-items/public", HttpMethod.GET.name())).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/merchants/*/menu-items/public", HttpMethod.GET.name())).permitAll()

                // 放行商家详情查看接口 (GET) - 支持数字 ID 和外部 ID
                .requestMatchers(new AntPathRequestMatcher("/merchants/*", HttpMethod.GET.name())).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/merchants/*", HttpMethod.GET.name())).permitAll()

                // 放行外部 ID 查询接口
                .requestMatchers(new AntPathRequestMatcher("/merchants/external/*", HttpMethod.GET.name())).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/merchants/external/*", HttpMethod.GET.name())).permitAll()

                // 放行导入接口（允许智能体导入真实餐厅数据）
                .requestMatchers(new AntPathRequestMatcher("/merchants/import", HttpMethod.POST.name())).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/merchants/import/batch", HttpMethod.POST.name())).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/merchants/import", HttpMethod.POST.name())).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/merchants/import/batch", HttpMethod.POST.name())).permitAll()

                // 放行内部服务调用接口 (如 AI Pricing 获取菜单)
                .requestMatchers(new AntPathRequestMatcher("/merchants/internal/**")).permitAll()

                // 放行 Swagger 文档资源
                .requestMatchers(new AntPathRequestMatcher("/swagger-ui/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/v3/api-docs/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/swagger-resources/**")).permitAll()
                
                // 其他所有接口都需要认证 (JWT Token)
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}