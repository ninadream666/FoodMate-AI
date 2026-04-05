package com.fooddelivery.orderservice.client;

import com.fooddelivery.orderservice.dto.MenuItemDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * 商家服务Feign客户端
 * 用于order-service调用merchant-service获取菜品信息
 */
@FeignClient(name = "merchant-service", path = "/merchants")
public interface MerchantServiceClient {

    /**
     * 获取商家的公开菜单（包含价格等信息）
     * GET /merchants/{merchantId}/menu-items/public
     * 支持数字ID或外部ID
     */
    @GetMapping("/{merchantId}/menu-items/public")
    List<MenuItemDto> getPublicMenu(@PathVariable("merchantId") String merchantId);
}