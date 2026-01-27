package com.fooddelivery.merchant.controller;

import com.fooddelivery.merchant.dto.MenuItemDto;
import com.fooddelivery.merchant.service.MenuService;
import com.fooddelivery.merchant.service.MerchantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 商家服务内部接口
 * 供 AI Service 等内部服务调用，获取菜单数据，简化鉴权流程
 */
@RestController
@RequestMapping("/merchants/internal")
@RequiredArgsConstructor
public class MerchantInternalController {

    private final MerchantService merchantService;
    private final MenuService menuService;

    /**
     * 获取商家的所有上架菜品（包含最新价格）
     * 供 AI 定价引擎拉取当前基准价格
     */
    @GetMapping("/{merchantId}/menu-items")
    public ResponseEntity<List<MenuItemDto>> getMerchantMenuItems(@PathVariable Long merchantId) {
        // 复用 service 层的 public 查询逻辑 (只查上架的)
        return ResponseEntity.ok(menuService.getPublicMenu(merchantId));
    }

    /**
     * 获取所有开启了动态定价的活跃商家
     * 供 AI 定价引擎扫描目标
     */
    @GetMapping("/active")
    public ResponseEntity<List<com.fooddelivery.merchant.dto.MerchantDto>> getAllActiveMerchants() {
        return ResponseEntity.ok(merchantService.getAllActiveMerchants());
    }
}