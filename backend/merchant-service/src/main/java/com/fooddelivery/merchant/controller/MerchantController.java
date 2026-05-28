package com.fooddelivery.merchant.controller;

import com.fooddelivery.merchant.dto.BatchImportRequest;
import com.fooddelivery.merchant.dto.CreateMerchantRequest;
import com.fooddelivery.merchant.dto.MerchantDto;
import com.fooddelivery.merchant.dto.RealRestaurantDTO;
import com.fooddelivery.merchant.entity.Merchant;
import com.fooddelivery.merchant.repository.MerchantRepository;
import com.fooddelivery.merchant.service.MerchantService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/merchants")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantService merchantService;
    private final MerchantRepository merchantRepository;

    /**
     * 内部接口：通过 external_id 或数据库主键解析商家 ID
     * GET /merchants/{merchantId}/resolve-id
     * 返回 {id: 4, externalId: "B0FFGJAP9K", name: "..."}
     */
    @GetMapping("/{merchantId}/resolve-id")
    public ResponseEntity<java.util.Map<String, Object>> resolveMerchantId(@org.springframework.web.bind.annotation.PathVariable String merchantId) {
        java.util.Optional<Merchant> opt;
        // 先按整数 ID 查，失败再按 external_id 查
        try {
            opt = merchantRepository.findById(Long.parseLong(merchantId));
        } catch (NumberFormatException e) {
            opt = merchantRepository.findByExternalId(merchantId);
        }
        if (opt.isEmpty()) {
            opt = merchantRepository.findByExternalId(merchantId);
        }
        return opt.map(m -> ResponseEntity.ok(java.util.Map.<String, Object>of(
                "id", m.getId(),
                "externalId", m.getExternalId() != null ? m.getExternalId() : "",
                "name", m.getName() != null ? m.getName() : ""
        ))).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * 公开接口：获取商家列表（分页）
     * GET /merchants?page=0&size=10&sort=createdAt,desc
     */
    @GetMapping
    @CircuitBreaker(name = "merchantService", fallbackMethod = "listMerchantsFallback")
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

    @GetMapping("/my/all")
    public ResponseEntity<List<MerchantDto>> getAllMyMerchants() {
        Long userId = getCurrentUserId();
        List<MerchantDto> merchants = merchantService.getAllMerchantsByUserId(userId);
        return ResponseEntity.ok(merchants);
    }

    /**
     * 获取商家信息（支持数字ID和外部ID）
     * GET /merchants/{id}
     */
    @GetMapping("/{id}")
    @CircuitBreaker(name = "merchantService", fallbackMethod = "getMerchantFallback")
    public ResponseEntity<MerchantDto> getMerchant(@PathVariable String id) {
        return merchantService.findByAnyId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 通过外部ID获取商家
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
    @RateLimiter(name = "default")
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

    /**
     * 认领商家（将外部导入的无主商家关联到当前用户）
     * POST /merchants/{id}/claim
     */
    @PostMapping("/{id}/claim")
    public ResponseEntity<?> claimMerchant(@PathVariable String id) {
        Long userId = getCurrentUserId();
        try {
            MerchantDto merchant = merchantService.claimMerchant(id, userId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "商家认领成功",
                    "merchant", merchant));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    /**
     * 获取未被认领的商家列表（用于商家入驻时选择认领）
     * GET /merchants/unclaimed
     */
    @GetMapping("/unclaimed")
    public ResponseEntity<List<MerchantDto>> getUnclaimedMerchants(
            @RequestParam(required = false) String keyword) {
        List<MerchantDto> merchants = merchantService.getUnclaimedMerchants(keyword);
        return ResponseEntity.ok(merchants);
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

    // ============ 降级方法 ============

    public ResponseEntity<Page<MerchantDto>> listMerchantsFallback(int page, int size, String sort, Throwable t) {
        log.warn("[降级] 商家列表查询熔断: {}", t.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Page.empty());
    }

    public ResponseEntity<MerchantDto> getMerchantFallback(String id, Throwable t) {
        log.warn("[降级] 商家详情查询熔断: id={}, error={}", id, t.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    // 从SecurityContext获取当前用户ID
    // 根据JwtAuthenticationFilter，Principal直接存储为Long类型的userId
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