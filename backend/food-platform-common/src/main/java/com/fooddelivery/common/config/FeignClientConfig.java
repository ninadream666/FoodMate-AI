package com.fooddelivery.common.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Feign客户端通用配置
 */
@Configuration
public class FeignClientConfig {

    /**
     * JWT Token传递拦截器
     * 确保服务间调用时传递认证信息
     */
    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                        .getRequestAttributes();
                if (attributes != null) {
                    String authorization = attributes.getRequest().getHeader("Authorization");
                    if (authorization != null) {
                        template.header("Authorization", authorization);
                    }
                }
            }
        };
    }
}