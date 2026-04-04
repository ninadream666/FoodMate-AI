package com.fooddelivery.marketingservice.service;

import com.fooddelivery.marketingservice.dto.CalculateBestCouponResponse;
import com.fooddelivery.marketingservice.entity.CouponTemplate;
import com.fooddelivery.marketingservice.entity.UserCoupon;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 优惠券组合算法服务
 * 处理复杂的背包问题，计算最优优惠券组合
 */
@Service
@RequiredArgsConstructor
public class CouponCombinationService {

    /**
     * 内部数据结构：表示一个可用的优惠券及其信息
     */
    @Data
    private static class CouponOption {
        private Long couponId; // 优惠券ID
        private Long userCouponId; // 用户优惠券ID
        private BigDecimal discount; // 优惠金额
        private String type; // 优惠券类型
        private boolean stackable; // 是否可叠加
        private Set<Long> exclusiveIds; // 互斥的优惠券ID

        public CouponOption(UserCoupon uc, CouponTemplate template, BigDecimal discount) {
            this.couponId = template.getId();
            this.userCouponId = uc.getId();
            this.discount = discount;
            this.type = template.getType().toString();
            this.stackable = template.getStackable();
            this.exclusiveIds = parseExclusiveIds(template.getExclusiveIds());
        }

        private Set<Long> parseExclusiveIds(String exclusiveIdsJson) {
            if (exclusiveIdsJson == null || exclusiveIdsJson.isEmpty()) {
                return new HashSet<>();
            }
            try {
                // 简单的JSON解析
                String cleaned = exclusiveIdsJson.replaceAll("[\\[\\]]", "");
                if (cleaned.isEmpty()) {
                    return new HashSet<>();
                }
                return Arrays.stream(cleaned.split(","))
                        .map(String::trim)
                        .map(Long::parseLong)
                        .collect(Collectors.toSet());
            } catch (Exception e) {
                return new HashSet<>();
            }
        }
    }

    /**
     * 主算法：计算最优优惠券组合
     * 
     * @param orderAmount      订单原始金额
     * @param availableCoupons 用户可用的优惠券列表（已加载模板信息）
     * @return 最优方案的优惠券ID列表和总优惠金额
     */
    public CombinationResult calculateBestCombination(
            BigDecimal orderAmount,
            List<UserCoupon> availableCoupons,
            Map<Long, CouponTemplate> templateMap) {

        // 筛选符合门槛的优惠券
        List<CouponOption> eligibleCoupons = filterEligibleCoupons(
                orderAmount,
                availableCoupons,
                templateMap);

        if (eligibleCoupons.isEmpty()) {
            return new CombinationResult(Collections.emptyList(), BigDecimal.ZERO);
        }

        // 分类优惠券（可叠加vs互斥）
        List<CouponOption> stackableCoupons = eligibleCoupons.stream()
                .filter(c -> c.stackable)
                .collect(Collectors.toList());

        List<CouponOption> mutualExclusiveCoupons = eligibleCoupons.stream()
                .filter(c -> !c.stackable)
                .collect(Collectors.toList());

        // 第三步：计算最优组合
        CombinationResult result = findBestCombination(
                orderAmount,
                stackableCoupons,
                mutualExclusiveCoupons);

        return result;
    }

    /**
     * 筛选符合订单金额的优惠券
     */
    private List<CouponOption> filterEligibleCoupons(
            BigDecimal orderAmount,
            List<UserCoupon> availableCoupons,
            Map<Long, CouponTemplate> templateMap) {

        return availableCoupons.stream()
                .filter(uc -> templateMap.containsKey(uc.getCouponTemplateId()))
                .map(uc -> {
                    CouponTemplate template = templateMap.get(uc.getCouponTemplateId());
                    BigDecimal discount = calculateDiscount(orderAmount, template);

                    // 只有当优惠金额>0时才认为符合条件
                    if (discount.compareTo(BigDecimal.ZERO) > 0) {
                        return new CouponOption(uc, template, discount);
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * 计算单张优惠券对订单的优惠金额
     */
    private BigDecimal calculateDiscount(BigDecimal orderAmount, CouponTemplate template) {
        switch (template.getType()) {
            case DISCOUNT:
                // 折扣券：discountValue为0-10的数字，表示X折
                // 例如：9表示九折，优惠金额=原价*(1-0.9)=原价*0.1
                BigDecimal discountRate = BigDecimal.ONE.subtract(
                        template.getDiscountValue().divide(BigDecimal.TEN, 2, java.math.RoundingMode.HALF_UP));
                BigDecimal discount = orderAmount.multiply(discountRate);

                // 应用最大优惠上限
                if (template.getMaxDiscount() != null) {
                    discount = discount.min(template.getMaxDiscount());
                }
                return discount;

            case THRESHOLD_REDUCTION:
                // 满减券：检查是否满足最小金额要求
                if (template.getMinOrderAmount() == null ||
                        orderAmount.compareTo(template.getMinOrderAmount()) < 0) {
                    return BigDecimal.ZERO;
                }
                return template.getDiscountValue();

            case NO_THRESHOLD:
                // 无门槛券：直接减免
                BigDecimal noThresholdDiscount = template.getDiscountValue();
                if (template.getMaxDiscount() != null) {
                    noThresholdDiscount = noThresholdDiscount.min(template.getMaxDiscount());
                }
                return noThresholdDiscount;

            case FREE_SHIPPING:
                // 免运费券：假设运费为5元
                return BigDecimal.valueOf(5);

            default:
                return BigDecimal.ZERO;
        }
    }

    /**
     * 找到最优的优惠券组合
     * 
     * 策略：
     * 1. 在互斥券中找出最优的一张（贪心）
     * 2. 将这张互斥券与所有可叠加券组合（组合优化）
     * 3. 如果不选互斥券，则尝试只用可叠加券
     * 4. 返回优惠最多的方案
     */
    private CombinationResult findBestCombination(
            BigDecimal orderAmount,
            List<CouponOption> stackableCoupons,
            List<CouponOption> mutualExclusiveCoupons) {

        CombinationResult bestResult = new CombinationResult(
                Collections.emptyList(),
                BigDecimal.ZERO);

        // 方案1：只使用可叠加券
        CombinationResult stackableOnlyResult = findBestStackableCombination(
                orderAmount,
                stackableCoupons);

        if (stackableOnlyResult.totalDiscount.compareTo(bestResult.totalDiscount) > 0) {
            bestResult = stackableOnlyResult;
        }

        // 方案2：选择一张互斥券，再加上可叠加券
        for (CouponOption mutualExclusive : mutualExclusiveCoupons) {
            // 获取与当前互斥券不冲突的可叠加券
            List<CouponOption> compatibleStackable = stackableCoupons.stream()
                    .filter(s -> !mutualExclusive.exclusiveIds.contains(s.couponId))
                    .collect(Collectors.toList());

            BigDecimal baseDiscount = mutualExclusive.discount;
            CombinationResult stackableResult = findBestStackableCombination(
                    orderAmount.subtract(baseDiscount),
                    compatibleStackable);

            BigDecimal totalDiscount = baseDiscount.add(stackableResult.totalDiscount);
            List<Long> allCoupons = new ArrayList<>();
            allCoupons.add(mutualExclusive.userCouponId);
            allCoupons.addAll(stackableResult.selectedCouponIds);

            CombinationResult result = new CombinationResult(allCoupons, totalDiscount);

            if (totalDiscount.compareTo(bestResult.totalDiscount) > 0) {
                bestResult = result;
            }
        }

        return bestResult;
    }

    /**
     * 贪心算法：在可叠加的优惠券中找到最优组合
     * 使用动态规划的思想（类似0/1背包）
     */
    private CombinationResult findBestStackableCombination(
            BigDecimal remainingAmount,
            List<CouponOption> stackableCoupons) {

        if (stackableCoupons.isEmpty() || remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return new CombinationResult(Collections.emptyList(), BigDecimal.ZERO);
        }

        // 使用回溯法找出所有可能的组合
        List<CombinationResult> allCombinations = new ArrayList<>();

        // 尝试所有可能的子集
        int n = stackableCoupons.size();
        for (int mask = 0; mask < (1 << n); mask++) {
            List<Long> currentCoupons = new ArrayList<>();
            BigDecimal currentDiscount = BigDecimal.ZERO;
            boolean valid = true;

            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) {
                    CouponOption coupon = stackableCoupons.get(i);
                    currentCoupons.add(coupon.userCouponId);
                    currentDiscount = currentDiscount.add(coupon.discount);

                    // 检查与已选择的优惠券是否冲突
                    for (int j = 0; j < i; j++) {
                        if ((mask & (1 << j)) != 0) {
                            CouponOption prevCoupon = stackableCoupons.get(j);
                            if (coupon.exclusiveIds.contains(prevCoupon.couponId)) {
                                valid = false;
                                break;
                            }
                        }
                    }

                    if (!valid)
                        break;
                }
            }

            if (valid) {
                allCombinations.add(new CombinationResult(currentCoupons, currentDiscount));
            }
        }

        // 返回优惠金额最多的组合
        return allCombinations.stream()
                .max(Comparator.comparing(r -> r.totalDiscount))
                .orElse(new CombinationResult(Collections.emptyList(), BigDecimal.ZERO));
    }

    /**
     * 优惠券组合结果
     */
    @Data
    public static class CombinationResult {
        public List<Long> selectedCouponIds;
        public BigDecimal totalDiscount;

        public CombinationResult(List<Long> selectedCouponIds, BigDecimal totalDiscount) {
            this.selectedCouponIds = selectedCouponIds;
            this.totalDiscount = totalDiscount;
        }
    }
}
