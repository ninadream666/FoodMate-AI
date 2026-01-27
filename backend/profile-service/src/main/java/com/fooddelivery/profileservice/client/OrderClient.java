package com.fooddelivery.profileservice.client;

import com.fooddelivery.profileservice.config.FeignConfig;
import com.fooddelivery.profileservice.dto.OrderDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

// 绑定到docker-compose，服务名"order-service"，端口8080
@FeignClient(name = "order-service", url = "http://order-service:8080", configuration = FeignConfig.class)
public interface OrderClient {

    @GetMapping("/orders/user/{userId}")
    List<OrderDto> getOrdersByUserId(@PathVariable("userId") Long userId);
}