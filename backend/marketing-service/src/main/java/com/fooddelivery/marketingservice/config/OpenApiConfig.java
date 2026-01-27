package com.fooddelivery.marketingservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 配置类
 * 配置 Swagger 文档信息
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("营销服务 API")
                        .version("1.0.0")
                        .description("食品配送平台营销服务\n\n" +
                                "主要功能：\n" +
                                "- 优惠券模板管理\n" +
                                "- 优惠券发放和状态管理\n" +
                                "- 优惠券组合算法（背包问题求解）\n" +
                                "- 最优优惠方案计算\n\n" +
                                "核心算法：动态规划和回溯法的组合使用，解决复杂的背包问题变种"));
    }
}
