package com.fooddelivery.marketingservice.controller;

import com.fooddelivery.marketingservice.dto.CouponStatsDTO;
import com.fooddelivery.marketingservice.dto.CouponUsageTrendDTO;
import com.fooddelivery.marketingservice.dto.CouponTypeStatsDTO;
import com.fooddelivery.marketingservice.dto.CouponTemplateDTO;
import com.fooddelivery.marketingservice.service.CouponStatsService;
import com.fooddelivery.marketingservice.service.CouponStatisticsService;
import com.fooddelivery.marketingservice.service.CouponTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 管理员端优惠券统计控制器
 */
@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
@Tag(name = "管理员端-优惠券统计", description = "优惠券统计和分析接口")
public class AdminCouponController {

    private final CouponStatsService couponStatisticsService;
    private final CouponTemplateService couponTemplateService;

    @GetMapping("/stats")
    @Operation(summary = "获取优惠券统计概览")
    public ResponseEntity<CouponStatsDTO> getCouponStats() {
        CouponStatsDTO stats = couponStatisticsService.getCouponStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/usage-trend")
    @Operation(summary = "获取优惠券使用趋势")
    public ResponseEntity<List<CouponUsageTrendDTO>> getUsageTrend(
            @RequestParam(defaultValue = "month") String period) {
        List<CouponUsageTrendDTO> trends = couponStatisticsService.getUsageTrend(period);
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/type-stats")
    @Operation(summary = "获取优惠券类型统计")
    public ResponseEntity<List<CouponTypeStatsDTO>> getTypeStats() {
        List<CouponTypeStatsDTO> typeStats = couponStatisticsService.getTypeStats();
        return ResponseEntity.ok(typeStats);
    }

    @PutMapping("/templates/{id}/toggle")
    @Operation(summary = "切换优惠券模板状态", description = "启用或禁用优惠券模板")
    public ResponseEntity<?> toggleTemplateStatus(@PathVariable Long id) {
        try {
            CouponTemplateDTO template = couponTemplateService.toggleTemplateStatus(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", template.getEnabled() ? "优惠券已启用" : "优惠券已禁用",
                    "data", template));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "操作失败: " + e.getMessage()));
        }
    }

    @PutMapping("/templates/{id}/enable")
    @Operation(summary = "启用优惠券模板")
    public ResponseEntity<?> enableTemplate(@PathVariable Long id) {
        try {
            CouponTemplateDTO template = couponTemplateService.enableTemplate(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "优惠券已启用",
                    "data", template));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @PutMapping("/templates/{id}/disable")
    @Operation(summary = "禁用优惠券模板")
    public ResponseEntity<?> disableTemplate(@PathVariable Long id) {
        try {
            CouponTemplateDTO template = couponTemplateService.disableTemplate(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "优惠券已禁用",
                    "data", template));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @DeleteMapping("/templates/{id}")
    @Operation(summary = "删除优惠券模板", description = "删除指定的优惠券模板（仅限未发放的优惠券）")
    public ResponseEntity<?> deleteTemplate(@PathVariable Long id) {
        try {
            couponTemplateService.deleteTemplate(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "优惠券模板删除成功"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "删除失败: " + e.getMessage()));
        }
    }
}