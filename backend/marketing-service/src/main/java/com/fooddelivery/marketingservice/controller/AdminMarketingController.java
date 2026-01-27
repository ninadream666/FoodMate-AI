package com.fooddelivery.marketingservice.controller;

import com.fooddelivery.marketingservice.entity.CouponStatus;
import com.fooddelivery.marketingservice.entity.CouponTemplate;
import com.fooddelivery.marketingservice.repository.CouponTemplateRepository;
import com.fooddelivery.marketingservice.repository.UserCouponRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理员端营销统计控制器
 */
@RestController
@RequestMapping("/api/admin/marketing")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "管理员端-营销统计", description = "平台营销数据统计")
public class AdminMarketingController {

    private final CouponTemplateRepository couponTemplateRepository;
    private final UserCouponRepository userCouponRepository;

    /**
     * 获取营销统计数据
     * GET /api/admin/marketing/stats
     * 
     * 返回前端 Commissions.jsx 需要的营销统计字段
     */
    @GetMapping("/stats")
    @Operation(summary = "获取营销统计", description = "获取优惠券和营销活动的统计数据")
    public ResponseEntity<?> getMarketingStats() {
        try {
            LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

            // 统计各状态优惠券数量
            long totalCoupons = userCouponRepository.count();
            long usedCoupons = userCouponRepository.countByStatus(CouponStatus.USED);

            // 计算使用率
            double usageRate = totalCoupons > 0
                    ? Math.round((double) usedCoupons / totalCoupons * 10000) / 100.0
                    : 0.0;

            // 活跃营销活动数（启用的优惠券模板）
            List<CouponTemplate> enabledTemplates = couponTemplateRepository.findAllByEnabled(true);
            long activeCampaigns = enabledTemplates.size();

            // 估算总优惠金额：基于已使用优惠券数量和平均折扣值
            BigDecimal totalDiscount = BigDecimal.ZERO;
            if (!enabledTemplates.isEmpty()) {
                BigDecimal avgDiscount = enabledTemplates.stream()
                        .map(CouponTemplate::getDiscountValue)
                        .filter(v -> v != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(enabledTemplates.size()), 2, java.math.RoundingMode.HALF_UP);
                totalDiscount = avgDiscount.multiply(BigDecimal.valueOf(usedCoupons));
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("activeCampaigns", activeCampaigns);
            stats.put("totalCoupons", totalCoupons);
            stats.put("usedCoupons", usedCoupons);
            stats.put("usageRate", usageRate);
            stats.put("totalDiscount", totalDiscount);
            // 额外的有用字段
            stats.put("availableCoupons", userCouponRepository.countByStatus(CouponStatus.AVAILABLE));
            stats.put("expiredCoupons", userCouponRepository.countByStatus(CouponStatus.EXPIRED));
            stats.put("issuedToday", userCouponRepository.countIssuedToday(startOfToday));
            stats.put("usedToday", userCouponRepository.countUsedToday(startOfToday));

            log.info("管理员获取营销统计数据");
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("获取营销统计失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "获取统计数据失败", "message", e.getMessage()));
        }
    }
}
