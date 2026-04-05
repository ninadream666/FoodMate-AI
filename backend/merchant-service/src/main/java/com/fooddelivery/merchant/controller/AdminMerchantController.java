package com.fooddelivery.merchant.controller;

import com.fooddelivery.merchant.dto.MerchantDto;
import com.fooddelivery.merchant.entity.Merchant;
import com.fooddelivery.merchant.repository.MerchantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/merchants")
@RequiredArgsConstructor
public class AdminMerchantController {

    private final MerchantRepository merchantRepository;

    /**
     * 获取商家统计数据
     * 返回前端期望的格式：total, active, pending, suspended, newThisMonth, growthRate
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getMerchantStats() {
        long totalCount = merchantRepository.count();
        long activeCount = totalCount;
        long pendingCount = 0L;
        long suspendedCount = 0L;

        Map<String, Object> stats = new HashMap<>();
        // 前端期望的字段
        stats.put("total", totalCount);
        stats.put("active", activeCount);
        stats.put("pending", pendingCount);
        stats.put("suspended", suspendedCount);
        stats.put("newThisMonth", 0L);
        stats.put("growthRate", 0.0);
        // 保持兼容旧的字段名
        stats.put("totalCount", totalCount);
        stats.put("activeCount", activeCount);
        stats.put("pendingCount", pendingCount);

        return ResponseEntity.ok(stats);
    }

    /**
     * 获取活跃商家数
     */
    @GetMapping("/active-count")
    public ResponseEntity<Map<String, Long>> getActiveCount() {
        long count = merchantRepository.count();
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * 获取最新注册商家
     */
    @GetMapping("/latest")
    public ResponseEntity<List<MerchantDto>> getLatestMerchants(
            @RequestParam(defaultValue = "5") int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "id"));
        Page<Merchant> merchants = merchantRepository.findAll(pageRequest);

        List<MerchantDto> dtos = merchants.getContent().stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * 获取商家列表（分页）
     */
    @GetMapping
    public ResponseEntity<Page<MerchantDto>> getMerchants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Merchant> merchants = merchantRepository.findAll(pageRequest);

        Page<MerchantDto> dtoPage = merchants.map(this::toDto);
        return ResponseEntity.ok(dtoPage);
    }

    /**
     * 获取商家详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<MerchantDto> getMerchant(@PathVariable Long id) {
        return merchantRepository.findById(id)
                .map(merchant -> ResponseEntity.ok(toDto(merchant)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 修改商家状态
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<MerchantDto> updateMerchantStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return merchantRepository.findById(id)
                .map(merchant -> {
                    Merchant saved = merchantRepository.save(merchant);
                    return ResponseEntity.ok(toDto(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 审批商家
     */
    @PatchMapping("/{id}/approve")
    public ResponseEntity<MerchantDto> approveMerchant(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return merchantRepository.findById(id)
                .map(merchant -> {
                    Merchant saved = merchantRepository.save(merchant);
                    return ResponseEntity.ok(toDto(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private MerchantDto toDto(Merchant merchant) {
        MerchantDto dto = new MerchantDto();
        dto.setId(merchant.getId());
        dto.setExternalId(merchant.getExternalId());
        dto.setName(merchant.getName());
        dto.setAddress(merchant.getAddress());
        dto.setLatitude(merchant.getLatitude());
        dto.setLongitude(merchant.getLongitude());
        dto.setImageUrl(merchant.getImageUrl());
        dto.setRating(merchant.getRating());
        dto.setCuisineType(merchant.getCuisineType());
        dto.setPhone(merchant.getPhone());
        dto.setDescription(merchant.getDescription());
        dto.setSource(merchant.getSource());
        return dto;
    }
}
