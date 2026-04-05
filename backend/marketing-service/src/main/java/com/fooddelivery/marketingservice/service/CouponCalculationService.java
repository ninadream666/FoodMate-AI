package com.fooddelivery.marketingservice.service;

import com.fooddelivery.marketingservice.dto.CalculateBestCouponRequest;
import com.fooddelivery.marketingservice.dto.CalculateBestCouponResponse;
import com.fooddelivery.marketingservice.entity.CouponTemplate;
import com.fooddelivery.marketingservice.entity.UserCoupon;
import com.fooddelivery.marketingservice.repository.CouponTemplateRepository;
import com.fooddelivery.marketingservice.repository.UserCouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 优惠券计算服务
 * 负责计算订单的最优优惠券组合方案
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CouponCalculationService {

    private final UserCouponRepository userCouponRepository;
    private final CouponTemplateRepository couponTemplateRepository;
    private final CouponCombinationService combinationService;

    /**
     * 计算用户订单的最优优惠券组合
     * 
     * @param request 优惠券计算请求，包含用户ID和订单信息
     * @return 最优优惠方案
     */
    public CalculateBestCouponResponse calculateBestCoupon(CalculateBestCouponRequest request) {
        Long userId = request.getUserId();
        BigDecimal orderTotal = request.getOrderTotal();

        log.info("计算用户 {} 的最优优惠券方案，订单总额: {}", userId, orderTotal);

        try {
            // 获取用户的所有可用优惠券
            LocalDateTime now = LocalDateTime.now();
            List<UserCoupon> availableCoupons = userCouponRepository
                    .findAvailableCouponsByUser(userId, now);

            if (availableCoupons.isEmpty()) {
                log.info("用户 {} 没有可用的优惠券", userId);
                return buildEmptyResponse(orderTotal);
            }

            // 加载这些优惠券对应的模板信息
            Set<Long> templateIds = availableCoupons.stream()
                    .map(UserCoupon::getCouponTemplateId)
                    .collect(Collectors.toSet());

            List<CouponTemplate> templates = couponTemplateRepository.findAllById(templateIds);
            Map<Long, CouponTemplate> templateMap = templates.stream()
                    .collect(Collectors.toMap(CouponTemplate::getId, t -> t));

            // 过滤出有效的优惠券模板
            List<UserCoupon> validCoupons = availableCoupons.stream()
                    .filter(uc -> {
                        CouponTemplate template = templateMap.get(uc.getCouponTemplateId());
                        return template != null && template.isValid();
                    })
                    .collect(Collectors.toList());

            if (validCoupons.isEmpty()) {
                log.info("用户 {} 的可用优惠券均已过期或无效", userId);
                return buildEmptyResponse(orderTotal);
            }

            // 调用组合算法计算最优方案
            CouponCombinationService.CombinationResult result = combinationService.calculateBestCombination(
                    orderTotal,
                    validCoupons,
                    templateMap);

            // 构建响应
            return buildResponse(result, orderTotal, validCoupons, templateMap);

        } catch (Exception e) {
            log.error("计算优惠券方案出错", e);
            return buildErrorResponse(orderTotal);
        }
    }

    /**
     * 验证优惠券组合是否有效
     * 检查选中的优惠券是否真的可以叠加使用
     */
    public boolean validateCouponCombination(List<Long> userCouponIds) {
        if (userCouponIds == null || userCouponIds.isEmpty()) {
            return true;
        }

        // 获取所有优惠券的模板信息
        List<UserCoupon> coupons = userCouponRepository.findAllById(userCouponIds);
        Map<Long, CouponTemplate> templateMap = new HashMap<>();

        for (UserCoupon uc : coupons) {
            CouponTemplate template = couponTemplateRepository.findById(uc.getCouponTemplateId())
                    .orElse(null);
            if (template == null) {
                return false;
            }
            templateMap.put(template.getId(), template);
        }

        // 检查互斥性
        for (int i = 0; i < coupons.size(); i++) {
            for (int j = i + 1; j < coupons.size(); j++) {
                UserCoupon uc1 = coupons.get(i);
                UserCoupon uc2 = coupons.get(j);

                CouponTemplate t1 = templateMap.get(uc1.getCouponTemplateId());
                CouponTemplate t2 = templateMap.get(uc2.getCouponTemplateId());

                if (!t1.getStackable() || !t2.getStackable()) {
                    return false;
                }

                // 检查是否互斥
                if (isExclusive(t1, t2)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 检查两张优惠券是否互斥
     */
    private boolean isExclusive(CouponTemplate t1, CouponTemplate t2) {
        String exclusiveIds1 = t1.getExclusiveIds();
        String exclusiveIds2 = t2.getExclusiveIds();

        if (exclusiveIds1 != null && exclusiveIds1.contains(t2.getId().toString())) {
            return true;
        }
        if (exclusiveIds2 != null && exclusiveIds2.contains(t1.getId().toString())) {
            return true;
        }

        return false;
    }

    /**
     * 构建成功响应
     */
    private CalculateBestCouponResponse buildResponse(
            CouponCombinationService.CombinationResult result,
            BigDecimal originalAmount,
            List<UserCoupon> validCoupons,
            Map<Long, CouponTemplate> templateMap) {

        BigDecimal finalPrice = originalAmount.subtract(result.totalDiscount);

        String description = buildDescription(result, validCoupons, templateMap);

        return CalculateBestCouponResponse.builder()
                .selectedCouponIds(result.selectedCouponIds)
                .originalPrice(originalAmount)
                .totalDiscount(result.totalDiscount)
                .finalPrice(finalPrice)
                .description(description)
                .success(true)
                .build();
    }

    /**
     * 构建空响应（无可用优惠券）
     */
    private CalculateBestCouponResponse buildEmptyResponse(BigDecimal originalAmount) {
        return CalculateBestCouponResponse.builder()
                .selectedCouponIds(Collections.emptyList())
                .originalPrice(originalAmount)
                .totalDiscount(BigDecimal.ZERO)
                .finalPrice(originalAmount)
                .description("没有可用的优惠券")
                .success(true)
                .build();
    }

    /**
     * 构建错误响应
     */
    private CalculateBestCouponResponse buildErrorResponse(BigDecimal originalAmount) {
        return CalculateBestCouponResponse.builder()
                .selectedCouponIds(Collections.emptyList())
                .originalPrice(originalAmount)
                .totalDiscount(BigDecimal.ZERO)
                .finalPrice(originalAmount)
                .description("计算优惠方案出错")
                .success(false)
                .build();
    }

    /**
     * 构建优惠方案的文字描述
     */
    private String buildDescription(
            CouponCombinationService.CombinationResult result,
            List<UserCoupon> validCoupons,
            Map<Long, CouponTemplate> templateMap) {

        if (result.selectedCouponIds.isEmpty()) {
            return "未找到可用的优惠方案";
        }

        StringBuilder description = new StringBuilder("优惠方案: ");

        for (Long userCouponId : result.selectedCouponIds) {
            UserCoupon uc = validCoupons.stream()
                    .filter(c -> c.getId().equals(userCouponId))
                    .findFirst()
                    .orElse(null);

            if (uc != null) {
                CouponTemplate template = templateMap.get(uc.getCouponTemplateId());
                if (template != null) {
                    description.append(template.getName()).append(", ");
                }
            }
        }

        // 移除末尾的逗号和空格
        if (description.length() > 5) {
            description.setLength(description.length() - 2);
        }

        description.append(" 共优惠 ").append(result.totalDiscount).append(" 元");

        return description.toString();
    }
}
