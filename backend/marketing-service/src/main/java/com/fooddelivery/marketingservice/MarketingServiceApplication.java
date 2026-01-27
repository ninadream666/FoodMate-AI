package com.fooddelivery.marketingservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

/**
 * 营销服务主应用程序
 * 管理优惠券发放和推荐服务
 */
@SpringBootApplication
public class MarketingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarketingServiceApplication.class, args);
    }
}
