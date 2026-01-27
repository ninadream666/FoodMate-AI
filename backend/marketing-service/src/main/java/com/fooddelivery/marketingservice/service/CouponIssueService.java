package com.fooddelivery.marketingservice.service;

import com.fooddelivery.marketingservice.dto.IssueCouponRequest;
import com.fooddelivery.marketingservice.dto.UserCouponDTO;
import com.fooddelivery.marketingservice.entity.*;
import com.fooddelivery.marketingservice.repository.CouponTemplateRepository;
import com.fooddelivery.marketingservice.repository.UserCouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fooddelivery.marketingservice.exception.BusinessException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 优惠券发放和管理服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CouponIssueService {

    private final CouponTemplateRepository couponTemplateRepository;
    private final UserCouponRepository userCouponRepository;

    /**
     * 发放优惠券给用户
     * 包含规则判断：
     * 1. 优惠券模板必须启用且有效
     * 2. 必须有可用的发放额度
     * 3. 用户不能重复领取（可选）
     * 
     * @param request 发放请求
     * @return 发放后的用户优惠券信息
     * @throws IllegalArgumentException 当不符合发放条件时
     */
    @Transactional
    public UserCouponDTO issueCoupon(IssueCouponRequest request) {
        Long couponTemplateId = request.getCouponTemplateId();
        Long userId = request.getUserId();

        // 1. 验证优惠券模板是否存在且有效
        CouponTemplate template = couponTemplateRepository.findById(couponTemplateId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "优惠券不存在，ID: " + couponTemplateId));

        // 2. 检查优惠券是否启用
        if (!template.getEnabled()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "优惠券已被禁用");
        }

        // 3. 检查优惠券是否仍在有效期内
        if (!template.isValid()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "优惠券已过期或未生效");
        }

        // 4. 检查发放额度
        if (!template.hasAvailableQuantity()) {
            throw new BusinessException(HttpStatus.CONFLICT, String.format("优惠券已达到发放上限（模板ID: %d，总量: %d，已发: %d）",
                    couponTemplateId, template.getTotalQuantity(), template.getIssuedQuantity()));
        }

        // 5. 检查用户是否已经领取过（可选的重复检查）
        Optional<UserCoupon> existingCoupon = userCouponRepository
                .findByUserIdAndCouponTemplateId(userId, couponTemplateId);

        if (existingCoupon.isPresent()) {
            // 不允许重复发放同一模板给同一用户，返回冲突错误
            log.warn("用户 {} 已持有优惠券模板 {}，拒绝重复发放", userId, couponTemplateId);
            throw new com.fooddelivery.marketingservice.exception.BusinessException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "已发放过优惠券");
        }

        // 6. 创建用户优惠券记录
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setUserId(userId);
        userCoupon.setCouponTemplateId(couponTemplateId);
        userCoupon.setStatus(CouponStatus.AVAILABLE);
        userCoupon.setExpiresAt(template.getValidUntil());
        UserCoupon savedCoupon; // 1. 先在外部声明变量
        try {
            // 2. 在 try 内部赋值
            savedCoupon = userCouponRepository.save(userCoupon);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // 3. 捕获异常
            throw new BusinessException(HttpStatus.CONFLICT, "优惠券已发放过，不可以再次发放");
        }

        // 7. 更新模板的发放数量
        template.setIssuedQuantity(template.getIssuedQuantity() + 1);
        couponTemplateRepository.save(template);

        log.info("成功为用户 {} 发放优惠券，模板ID: {}", userId, couponTemplateId);

        // 8. 返回DTO
        return convertToDTO(savedCoupon, template);
    }

    /**
     * 获取用户的所有可用优惠券
     */
    public List<UserCouponDTO> getUserAvailableCoupons(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<UserCoupon> coupons = userCouponRepository.findAvailableCouponsByUser(userId, now);

        return coupons.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 根据订单金额获取用户的可用优惠券
     * 只返回满足最低使用金额要求的优惠券
     * 
     * @param userId      用户ID
     * @param orderAmount 订单金额
     * @return 可用且满足使用条件的优惠券列表
     */
    public List<UserCouponDTO> getUserAvailableCoupons(Long userId, BigDecimal orderAmount) {
        LocalDateTime now = LocalDateTime.now();
        List<UserCoupon> coupons = userCouponRepository.findAvailableCouponsByUser(userId, now);

        return coupons.stream()
                .map(this::convertToDTO)
                .filter(couponDTO -> {
                    // 获取优惠券模板信息
                    Optional<CouponTemplate> templateOpt = couponTemplateRepository
                            .findById(couponDTO.getCouponTemplateId());
                    if (!templateOpt.isPresent()) {
                        return false;
                    }

                    CouponTemplate template = templateOpt.get();

                    // 检查最低使用金额要求
                    if (template.getMinOrderAmount() != null && orderAmount != null) {
                        return orderAmount.compareTo(template.getMinOrderAmount()) >= 0;
                    }

                    // 如果没有最低金额限制，则可以使用
                    return true;
                })
                .collect(Collectors.toList());
    }

    /**
     * 检查优惠券是否可以在指定订单金额下使用
     * 
     * @param userCouponId 用户优惠券ID
     * @param orderAmount  订单金额
     * @return 是否可以使用
     */
    public boolean canUseCouponWithAmount(Long userCouponId, BigDecimal orderAmount) {
        UserCoupon userCoupon = userCouponRepository.findById(userCouponId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "用户优惠券不存在，ID: " + userCouponId));

        // 检查优惠券是否可用
        if (!userCoupon.isAvailable()) {
            return false;
        }

        // 获取优惠券模板信息
        CouponTemplate template = couponTemplateRepository.findById(userCoupon.getCouponTemplateId())
                .orElse(null);

        if (template == null) {
            return false;
        }

        // 检查最低使用金额要求
        if (template.getMinOrderAmount() != null && orderAmount != null) {
            return orderAmount.compareTo(template.getMinOrderAmount()) >= 0;
        }

        // 如果没有最低金额限制，则可以使用
        return true;
    }

    /**
     * 获取用户的所有优惠券（包括已使用等）
     */
    public List<UserCouponDTO> getUserAllCoupons(Long userId) {
        List<UserCoupon> coupons = userCouponRepository.findByUserId(userId);

        return coupons.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取单个用户优惠券详情
     */
    public UserCouponDTO getUserCouponById(Long couponId) {
        UserCoupon coupon = userCouponRepository.findById(couponId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "用户优惠券不存在，ID: " + couponId));
        return convertToDTO(coupon);
    }

    /**
     * 锁定优惠券（提交订单时）
     */
    @Transactional
    public void lockCoupon(Long userCouponId, Long orderId) {
        UserCoupon coupon = userCouponRepository.findById(userCouponId)
                .orElseThrow(() -> new IllegalArgumentException("用户优惠券不存在"));

        if (!coupon.isAvailable()) {
            throw new IllegalArgumentException("优惠券不可用");
        }

        coupon.lock(orderId);
        userCouponRepository.save(coupon);

        log.info("优惠券 {} 已锁定，订单ID: {}", userCouponId, orderId);
    }

    /**
     * 解锁优惠券（订单取消时）
     */
    @Transactional
    public void unlockCoupon(Long userCouponId) {
        UserCoupon coupon = userCouponRepository.findById(userCouponId)
                .orElseThrow(() -> new IllegalArgumentException("用户优惠券不存在"));

        if (coupon.getStatus() != CouponStatus.LOCKED) {
            throw new IllegalArgumentException("优惠券不是锁定状态");
        }

        coupon.unlock();
        userCouponRepository.save(coupon);

        log.info("优惠券 {} 已解锁", userCouponId);
    }

    /**
     * 将用户优惠券转换为DTO
     */
    private UserCouponDTO convertToDTO(UserCoupon coupon) {
        Optional<CouponTemplate> template = couponTemplateRepository.findById(coupon.getCouponTemplateId());

        return UserCouponDTO.builder()
                .id(coupon.getId())
                .userId(coupon.getUserId())
                .couponTemplateId(coupon.getCouponTemplateId())
                .status(coupon.getStatus())
                .orderId(coupon.getOrderId())
                .obtainedAt(coupon.getObtainedAt())
                .usedAt(coupon.getUsedAt())
                .expiresAt(coupon.getExpiresAt())
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .build();
    }

    /**
     * 平台管理员发放优惠券（带备注）
     * 用于运营系统直接向用户发放优惠券
     * 
     * @param request 发放请求，包含couponTemplateId、userId和remark
     * @return 发放后的用户优惠券信息
     * @throws IllegalArgumentException 当不符合发放条件时
     */
    @Transactional
    public UserCouponDTO adminIssueCoupon(Long couponTemplateId, Long userId, String remark) {
        // 使用标准的发放流程
        IssueCouponRequest request = new IssueCouponRequest();
        request.setCouponTemplateId(couponTemplateId);
        request.setUserId(userId);

        UserCouponDTO coupon = issueCoupon(request);
        log.info("管理员为用户 {} 发放优惠券 {}，备注: {}", userId, couponTemplateId, remark);
        return coupon;
    }

    /**
     * 平台管理员批量发放优惠券给多个用户
     * 用于运营系统批量发放优惠券
     * 
     * @param couponTemplateId 优惠券模板ID
     * @param userIds          用户ID列表
     * @param remark           批量发放备注
     * @return 成功发放的数量和失败信息
     */
    @Transactional
    public Map<String, Object> adminIssueBatch(Long couponTemplateId, List<Long> userIds, String remark) {
        if (userIds == null || userIds.isEmpty()) {
            throw new IllegalArgumentException("用户列表不能为空");
        }

        // 检查优惠券模板
        CouponTemplate template = couponTemplateRepository.findById(couponTemplateId)
                .orElseThrow(() -> new IllegalArgumentException("优惠券不存在，ID: " + couponTemplateId));

        if (!template.getEnabled()) {
            throw new IllegalArgumentException("优惠券已被禁用");
        }

        if (!template.isValid()) {
            throw new IllegalArgumentException("优惠券已过期或未生效");
        }

        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new java.util.ArrayList<>();

        // 逐个发放给用户
        for (Long userId : userIds) {
            try {
                // 检查发放额度（注意：template 可能来自本地缓存，需要在 issueCoupon 中再次检查最新值）
                if (!template.hasAvailableQuantity()) {
                    // 已无库存，后续用户都会失败，记录并停止以减少重复请求
                    int remaining = userIds.size() - (successCount + failureCount);
                    failureCount += remaining;
                    errors.add("从用户" + userId + "开始: 优惠券已达到发放上限（停止批量发放）");
                    log.warn("批量发放中止：优惠券 {} 已达上限", couponTemplateId);
                    break;
                }

                IssueCouponRequest request = new IssueCouponRequest();
                request.setCouponTemplateId(couponTemplateId);
                request.setUserId(userId);

                issueCoupon(request);
                successCount++;
                log.info("批量发放: 已为用户 {} 发放优惠券 {}", userId, couponTemplateId);
            } catch (BusinessException be) {
                // 如果是因为库存不足，提前结束批量发放
                if (be.getStatus() == HttpStatus.CONFLICT) {
                    int remaining = userIds.size() - (successCount + failureCount + 1);
                    failureCount += 1 + remaining;
                    errors.add("用户" + userId + ": " + be.getMessage());
                    errors.add("后续 " + remaining + " 个用户均未尝试，因为库存已耗尽");
                    log.warn("批量发放中止（库存不足）：{}", be.getMessage());
                    break;
                }
                failureCount++;
                errors.add("用户" + userId + ": " + be.getMessage());
                log.warn("批量发放失败 - 用户: {}, 错误: {}", userId, be.getMessage());
            } catch (Exception e) {
                failureCount++;
                errors.add("用户" + userId + ": " + e.getMessage());
                log.warn("批量发放失败 - 用户: {}, 错误: {}", userId, e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("couponTemplateId", couponTemplateId);
        result.put("totalCount", userIds.size());
        result.put("successCount", successCount);
        result.put("failureCount", failureCount);
        result.put("remark", remark);
        result.put("errors", errors);

        log.info("批量发放完成 - 总计: {}, 成功: {}, 失败: {}, 备注: {}",
                userIds.size(), successCount, failureCount, remark);

        return result;
    }

    /**
     * 将用户优惠券转换为DTO（包含模板信息）
     */
    private UserCouponDTO convertToDTO(UserCoupon coupon, CouponTemplate template) {
        return UserCouponDTO.builder()
                .id(coupon.getId())
                .userId(coupon.getUserId())
                .couponTemplateId(coupon.getCouponTemplateId())
                .status(coupon.getStatus())
                .orderId(coupon.getOrderId())
                .obtainedAt(coupon.getObtainedAt())
                .usedAt(coupon.getUsedAt())
                .expiresAt(coupon.getExpiresAt())
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .build();
    }

    /**
     * 使用/核销优惠券
     * 订单服务调用此接口来消耗用户的优惠券
     * 
     * @param couponId 用户优惠券ID
     * @param orderId  订单ID
     * @return 核销后的优惠券信息
     * @throws IllegalArgumentException 当优惠券不存在或不可用时
     */
    @Transactional
    public UserCouponDTO useCoupon(Long couponId, Long orderId) {
        // 1. 查找优惠券
        UserCoupon userCoupon = userCouponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("优惠券不存在，ID: " + couponId));

        // 2. 检查优惠券状态
        if (!userCoupon.getStatus().equals(CouponStatus.AVAILABLE)) {
            throw new IllegalArgumentException("优惠券不可用，当前状态: " + userCoupon.getStatus());
        }

        // 3. 检查优惠券是否过期
        if (userCoupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("优惠券已过期");
        }

        // 4. 标记为已使用
        userCoupon.setStatus(CouponStatus.USED);
        userCoupon.setUsedAt(LocalDateTime.now());
        userCoupon.setOrderId(orderId);
        userCoupon.setUpdatedAt(LocalDateTime.now());

        UserCoupon savedCoupon = userCouponRepository.save(userCoupon);
        log.info("优惠券已核销 - ID: {}, 订单ID: {}", couponId, orderId);

        return convertToDTO(savedCoupon, null);
    }

    /**
     * 回滚/取消优惠券使用
     * 取消订单时调用此接口把券还给用户
     * 
     * @param couponId 用户优惠券ID
     * @return 回滚后的优惠券信息
     * @throws IllegalArgumentException 当优惠券不存在或不可回滚时
     */
    @Transactional
    public UserCouponDTO rollbackCoupon(Long couponId) {
        // 1. 查找优惠券
        UserCoupon userCoupon = userCouponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("优惠券不存在，ID: " + couponId));

        // 2. 检查优惠券是否已使用
        if (!userCoupon.getStatus().equals(CouponStatus.USED)) {
            throw new IllegalArgumentException("优惠券未被使用，无法回滚，当前状态: " + userCoupon.getStatus());
        }

        // 3. 恢复为可用状态
        userCoupon.setStatus(CouponStatus.AVAILABLE);
        userCoupon.setUsedAt(null);
        userCoupon.setOrderId(null);
        userCoupon.setUpdatedAt(LocalDateTime.now());

        UserCoupon savedCoupon = userCouponRepository.save(userCoupon);
        log.info("优惠券已回滚 - ID: {}", couponId);

        return convertToDTO(savedCoupon, null);
    }
}
