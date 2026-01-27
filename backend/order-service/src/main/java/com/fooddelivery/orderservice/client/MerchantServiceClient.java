package com.fooddelivery.orderservice.client;

import com.fooddelivery.orderservice.dto.MenuItemDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * 商家服务 Feign 客户端
 * 用于 order-service 调用 merchant-service 获取菜品信息
 */
@FeignClient(name = "merchant-service", path = "/merchants")
public interface MerchantServiceClient {

    /**
     * 获取商家的公开菜单（包含价格等信息）
     * GET /merchants/{merchantId}/menu-items/public
     * 支持数字 ID 或外部 ID（如 B0FFKPDZZI）
     * 注意：这里调用的是公开接口，不需要特殊的内部鉴权
     */
    @GetMapping("/{merchantId}/menu-items/public")
    List<MenuItemDto> getPublicMenu(@PathVariable("merchantId") String merchantId);
}