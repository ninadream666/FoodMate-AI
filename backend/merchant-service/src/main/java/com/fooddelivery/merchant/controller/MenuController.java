package com.fooddelivery.merchant.controller;

import com.fooddelivery.merchant.dto.CreateMenuItemRequest;
import com.fooddelivery.merchant.dto.MenuItemDto;
import com.fooddelivery.merchant.dto.UpdateMenuItemRequest;
import com.fooddelivery.merchant.entity.Merchant;
import com.fooddelivery.merchant.service.MenuService;
import com.fooddelivery.merchant.service.MerchantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/merchants/{merchantId}/menu-items")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;
    private final MerchantService merchantService;

    // 商家端：添加菜品
    @PostMapping
    public ResponseEntity<MenuItemDto> addMenuItem(
            @PathVariable String merchantId,
            @RequestBody CreateMenuItemRequest request) {
        Long resolvedId = resolveAndCheckOwnership(merchantId);
        MenuItemDto item = menuService.addMenuItem(resolvedId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    // 商家端：更新菜品
    @PutMapping("/{itemId}")
    public ResponseEntity<MenuItemDto> updateMenuItem(
            @PathVariable String merchantId,
            @PathVariable Long itemId,
            @RequestBody UpdateMenuItemRequest request) {
        resolveAndCheckOwnership(merchantId);
        MenuItemDto item = menuService.updateMenuItem(itemId, request);
        return ResponseEntity.ok(item);
    }

    // 商家端/管理端：查看所有菜品（含下架）
    // 允许管理员或店主访问
    @GetMapping
    public ResponseEntity<List<MenuItemDto>> getMerchantMenu(@PathVariable String merchantId) {
        Long resolvedId = resolveAndCheckPermission(merchantId, true);
        return ResponseEntity.ok(menuService.getMerchantMenu(resolvedId));
    }

    /**
     * 客户端/公开端：查看上架菜品（支持数字ID和外部ID）
     * GET /merchants/{merchantId}/menu-items/public
     */
    @GetMapping("/public")
    public ResponseEntity<List<MenuItemDto>> getPublicMenu(@PathVariable String merchantId) {
        // 使用findEntityByAnyId方法，支持数字ID和外部ID
        Optional<Merchant> merchantOpt = merchantService.findEntityByAnyId(merchantId);
        
        if (merchantOpt.isEmpty()) {
            // 商家不存在，返回空列表而非404，便于前端处理
            return ResponseEntity.ok(Collections.emptyList());
        }
        
        Merchant merchant = merchantOpt.get();
        return ResponseEntity.ok(menuService.getPublicMenu(merchant.getId()));
    }
    
    // 商家端：删除菜品（软删除）
    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteMenuItem(
            @PathVariable String merchantId,
            @PathVariable Long itemId) {
        resolveAndCheckOwnership(merchantId);
        menuService.deleteMenuItem(itemId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 解析商家ID并检查所有权
     */
    private Long resolveAndCheckOwnership(String merchantId) {
        Long resolvedId = resolveMerchantId(merchantId);
        checkOwnership(resolvedId);
        return resolvedId;
    }
    
    /**
     * 解析商家ID并检查权限
     */
    private Long resolveAndCheckPermission(String merchantId, boolean allowAdmin) {
        Long resolvedId = resolveMerchantId(merchantId);
        checkPermission(resolvedId, allowAdmin);
        return resolvedId;
    }
    
    /**
     * 将字符串ID解析为数字ID（支持外部ID）
     */
    private Long resolveMerchantId(String merchantId) {
        // 先尝试作为数字解析
        try {
            return Long.parseLong(merchantId);
        } catch (NumberFormatException ignored) {
            // 不是数字，按外部ID查询
        }
        
        // 按外部 ID 查询
        return merchantService.findEntityByAnyId(merchantId)
                .map(Merchant::getId)
                .orElseThrow(() -> new RuntimeException("Merchant not found: " + merchantId));
    }

    // 默认鉴权：仅限店主
    private void checkOwnership(Long merchantId) {
        checkPermission(merchantId, false);
    }

    // 统一鉴权逻辑
    // @param merchantId 餐厅ID
    // @param allowAdmin 是否允许管理员通过
    private void checkPermission(Long merchantId, boolean allowAdmin) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        // 如果允许管理员，且当前用户拥有ROLE_ADMIN权限，则直接放行
        if (allowAdmin && isAdmin(auth)) {
            return;
        }

        // 否则检查是否是店主
        Long currentUserId = getCurrentUserId(auth);
        if (!merchantService.isMerchantOwner(merchantId, currentUserId)) {
            throw new AccessDeniedException("You are not the owner of this merchant");
        }
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private Long getCurrentUserId(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        try {
            return Long.parseLong(auth.getName());
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid User ID format in token");
        }
    }
}