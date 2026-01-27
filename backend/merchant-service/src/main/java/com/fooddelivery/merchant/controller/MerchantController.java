package com.fooddelivery.merchant.controller;

import com.fooddelivery.merchant.dto.BatchImportRequest;
import com.fooddelivery.merchant.dto.CreateMerchantRequest;
import com.fooddelivery.merchant.dto.MerchantDto;
import com.fooddelivery.merchant.dto.RealRestaurantDTO;
import com.fooddelivery.merchant.entity.Merchant;
import com.fooddelivery.merchant.repository.MerchantRepository;
import com.fooddelivery.merchant.service.MerchantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/merchants")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantService merchantService;
    private final MerchantRepository merchantRepository;

    /**
     * 公开接口：获取商家列表（分页）
     * GET /merchants?page=0&size=10&sort=createdAt,desc
     */
    @GetMapping
    public ResponseEntity<Page<MerchantDto>> listMerchants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        String[] sortParams = sort.split(",");
        String sortField = sortParams[0];
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortField));
        Page<Merchant> merchants = merchantRepository.findAll(pageRequest);
        Page<MerchantDto> dtoPage = merchants.map(merchantService::toDto);
        return ResponseEntity.ok(dtoPage);
    }

    @PostMapping
    public ResponseEntity<MerchantDto> createMerchant(@RequestBody CreateMerchantRequest request) {
        Long userId = getCurrentUserId();
        MerchantDto merchant = merchantService.createMerchant(userId, request);
        return ResponseEntity.ok(merchant);
    }

    @GetMapping("/my")
    public ResponseEntity<MerchantDto> getMyMerchant() {
        Long userId = getCurrentUserId();
        MerchantDto merchant = merchantService.getMerchantByUserId(userId);
        return ResponseEntity.ok(merchant);
    }

    /**
     * 获取商家信息（支持数字 ID 和外部 ID）
     * GET /merchants/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<MerchantDto> getMerchant(@PathVariable String id) {
        return merchantService.findByAnyId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 通过外部 ID 获取商家
     * GET /merchants/external/{externalId}
     */
    @GetMapping("/external/{externalId}")
    public ResponseEntity<MerchantDto> getMerchantByExternalId(@PathVariable String externalId) {
        return merchantService.findByExternalId(externalId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 导入真实餐厅（来自智能体/地图 API）
     * POST /merchants/import
     */
    @PostMapping("/import")
    public ResponseEntity<?> importRealRestaurant(@RequestBody RealRestaurantDTO dto) {
        try {
            MerchantDto merchant = merchantService.importRealRestaurant(dto);
            return ResponseEntity.ok(merchant);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "导入失败: " + e.getMessage()));
        }
    }

    /**
     * 批量导入真实餐厅
     * POST /merchants/import/batch
     */
    @PostMapping("/import/batch")
    public ResponseEntity<?> importRealRestaurantsBatch(@RequestBody BatchImportRequest request) {
        try {
            List<MerchantDto> imported = request.getRestaurants().stream()
                    .map(merchantService::importRealRestaurant)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "count", imported.size(),
                    "merchants", imported));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "批量导入失败: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/auto-approval/status")
    public ResponseEntity<MerchantDto> updateAutoApprovalStatus(
            @PathVariable Long id,
            @RequestParam Boolean enable) {
        Long userId = getCurrentUserId();
        if (!merchantService.isMerchantOwner(id, userId)) {
            throw new RuntimeException("Access denied");
        }
        return ResponseEntity.ok(merchantService.updateAutoApprovalSettings(id, enable, null));
    }

    @PatchMapping("/{id}/auto-approval/threshold")
    public ResponseEntity<MerchantDto> updateAutoApprovalThreshold(
            @PathVariable Long id,
            @RequestParam Double threshold) {
        Long userId = getCurrentUserId();
        if (!merchantService.isMerchantOwner(id, userId)) {
            throw new RuntimeException("Access denied");
        }
        return ResponseEntity.ok(merchantService.updateAutoApprovalSettings(id, null, threshold));
    }

    // 从 SecurityContext 获取当前用户ID
    // 根据 JwtAuthenticationFilter，Principal 直接存储为 Long 类型的 userId
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }

        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid User ID format in token");
        }
    }
}