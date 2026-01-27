package com.fooddelivery.marketingservice.controller;

import com.fooddelivery.marketingservice.dto.*;
import com.fooddelivery.marketingservice.entity.CouponStatus;
import com.fooddelivery.marketingservice.repository.CouponTemplateRepository;
import com.fooddelivery.marketingservice.repository.UserCouponRepository;
import com.fooddelivery.marketingservice.service.CouponCalculationService;
import com.fooddelivery.marketingservice.service.CouponIssueService;
import com.fooddelivery.marketingservice.service.CouponTemplateService;
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
import java.util.stream.Collectors;

/**
 * 优惠券管理REST控制器
 * 处理优惠券的发放、查询和计算等业务逻辑
 */
@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "优惠券管理", description = "优惠券发放、查询和计算相关接口")
public class CouponController {

    private final CouponIssueService couponIssueService;
    private final CouponCalculationService couponCalculationService;
    private final CouponTemplateService couponTemplateService;
    private final CouponTemplateRepository couponTemplateRepository;
    private final UserCouponRepository userCouponRepository;

    /**
     * 发放优惠券给用户
     * POST /api/coupons/issue
     * 
     * 业务流程：
     * 1. 验证优惠券模板是否存在且启用
     * 2. 检查优惠券是否在有效期内
     * 3. 检查是否还有可用的发放额度
     * 4. 为用户创建优惠券记录
     * 
     * @param request 发放请求，包含couponTemplateId和userId
     * @return 发放成功的优惠券信息
     */
    @PostMapping("/issue")
    @Operation(summary = "发放优惠券", description = "为指定用户发放一张优惠券")
    public ResponseEntity<?> issueCoupon(@RequestBody IssueCouponRequest request) {
        try {
            // 参数验证
            if (request.getCouponTemplateId() == null) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "优惠券模板ID不能为空"));
            }

            // 如果用户已认证，从 SecurityContext 中获取 userId
            // 否则使用请求中的 userId（用于后台管理员或内部接口）
            Long userId = request.getUserId();
            if (userId == null) {
                Object principal = org.springframework.security.core.context.SecurityContextHolder
                        .getContext().getAuthentication().getPrincipal();
                if (principal != null && principal instanceof Long) {
                    userId = (Long) principal;
                } else {
                    return ResponseEntity.badRequest()
                            .body(buildErrorResponse(400, "用户ID不能为空"));
                }
            }

            // 设置 userId 到请求对象中
            request.setUserId(userId);

            // 调用发放服务
            UserCouponDTO coupon = couponIssueService.issueCoupon(request);

            log.info("成功为用户 {} 发放优惠券 {}", request.getUserId(), request.getCouponTemplateId());

            return ResponseEntity.ok(buildSuccessResponse(coupon));

        } catch (com.fooddelivery.marketingservice.exception.BusinessException be) {
            throw be;
        } catch (IllegalArgumentException e) {
            log.warn("优惠券发放失败: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(buildErrorResponse(400, e.getMessage()));
        } catch (Exception e) {
            log.error("优惠券发放出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 平台管理员发放优惠券给用户
     * POST /api/coupons/admin/issue
     * 
     * 该接口用于运营系统直接向用户发放优惠券，支持备注说明
     * 
     * @param request 发放请求，包含couponTemplateId、userId和remark
     * @return 发放成功的优惠券信息
     */
    @PostMapping("/admin/issue")
    @Operation(summary = "管理员发放优惠券", description = "平台管理员为指定用户发放优惠券（支持备注）")
    public ResponseEntity<?> adminIssueCoupon(@RequestBody AdminIssueCouponRequest request) {
        try {
            // 参数验证
            if (request.getCouponTemplateId() == null || request.getUserId() == null) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "参数不完整"));
            }

            // 调用管理员发放服务
            UserCouponDTO coupon = couponIssueService.adminIssueCoupon(
                    request.getCouponTemplateId(),
                    request.getUserId(),
                    request.getRemark());

            log.info("管理员为用户 {} 发放优惠券 {}", request.getUserId(), request.getCouponTemplateId());

            return ResponseEntity.ok(buildSuccessResponse(coupon));

        } catch (com.fooddelivery.marketingservice.exception.BusinessException be) {
            throw be;
        } catch (IllegalArgumentException e) {
            log.warn("优惠券发放失败: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(buildErrorResponse(400, e.getMessage()));
        } catch (Exception e) {
            log.error("优惠券发放出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 平台管理员批量发放优惠券
     * POST /api/coupons/admin/issue-batch
     * 
     * 该接口用于运营系统批量向多个用户发放同一优惠券
     * 支持部分发放失败的情况，会返回详细的成功/失败统计
     * 
     * @param request 批量发放请求，包含couponTemplateId、userIds和remark
     * @return 发放统计结果（成功/失败数量及错误详情）
     */
    @PostMapping("/admin/issue-batch")
    @Operation(summary = "管理员批量发放优惠券", description = "平台管理员批量为多个用户发放同一优惠券")
    public ResponseEntity<?> adminIssueBatch(@RequestBody AdminIssueBatchRequest request) {
        try {
            // 参数验证
            if (request.getCouponTemplateId() == null || request.getUserIds() == null) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "参数不完整"));
            }

            if (request.getUserIds().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "用户列表不能为空"));
            }

            // 调用批量发放服务
            Map<String, Object> result = couponIssueService.adminIssueBatch(
                    request.getCouponTemplateId(),
                    request.getUserIds(),
                    request.getRemark());

            log.info("管理员批量发放优惠券 {}，总数: {}，成功: {}，失败: {}",
                    request.getCouponTemplateId(),
                    request.getUserIds().size(),
                    result.get("successCount"),
                    result.get("failureCount"));

            return ResponseEntity.ok(buildSuccessResponse(result));

        } catch (com.fooddelivery.marketingservice.exception.BusinessException be) {
            throw be;
        } catch (IllegalArgumentException e) {
            log.warn("批量发放失败: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(buildErrorResponse(400, e.getMessage()));
        } catch (Exception e) {
            log.error("批量发放出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 计算订单的最优优惠券组合
     * POST /api/coupons/calculate-best
     * 
     * 这是核心算法接口。输入订单信息，返回：
     * 1. 最优的优惠券ID列表
     * 2. 总优惠金额
     * 3. 优惠后的最终价格
     * 4. 方案描述
     * 
     * 算法说明：
     * - 筛选：根据订单金额筛选符合门槛的优惠券
     * - 分类：将券分为可叠加和互斥类
     * - 计算：使用动态规划/回溯法找出最优组合
     * 
     * @param request 计算请求，包含用户ID和订单信息
     * @return 最优优惠方案
     */
    @PostMapping("/calculate-best")
    @Operation(summary = "计算最优优惠券组合", description = "根据订单信息计算用户可用的最优优惠券组合方案")
    public ResponseEntity<?> calculateBestCoupon(@RequestBody CalculateBestCouponRequest request) {
        try {
            // 参数验证
            if (request.getUserId() == null || request.getOrderTotal() == null) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "参数不完整"));
            }

            if (request.getOrderTotal().signum() <= 0) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "订单金额必须大于0"));
            }

            // 调用计算服务
            CalculateBestCouponResponse response = couponCalculationService
                    .calculateBestCoupon(request);

            log.info("为用户 {} 计算最优优惠方案，订单额: {}，优惠: {}",
                    request.getUserId(),
                    request.getOrderTotal(),
                    response.getTotalDiscount());

            return ResponseEntity.ok(buildSuccessResponse(response));

        } catch (Exception e) {
            log.error("计算优惠券方案出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 获取用户的所有可用优惠券
     * GET /api/coupons/user/{userId}/available
     * 
     * @param userId      用户ID
     * @param orderAmount 订单金额（可选，用于过滤满足最低使用条件的优惠券）
     * @return 可用优惠券列表
     */
    @GetMapping("/user/{userId}/available")
    @Operation(summary = "获取用户可用优惠券", description = "获取指定用户的所有可用优惠券，可按订单金额过滤")
    public ResponseEntity<?> getUserAvailableCoupons(
            @PathVariable Long userId,
            @RequestParam(required = false) BigDecimal orderAmount) {
        try {
            List<UserCouponDTO> coupons;

            if (orderAmount != null) {
                // 根据订单金额过滤优惠券
                coupons = couponIssueService.getUserAvailableCoupons(userId, orderAmount);
                log.info("获取用户 {} 订单金额 {} 可用优惠券，数量: {}", userId, orderAmount, coupons.size());
            } else {
                // 获取所有可用优惠券
                coupons = couponIssueService.getUserAvailableCoupons(userId);
                log.info("获取用户 {} 所有可用优惠券，数量: {}", userId, coupons.size());
            }

            return ResponseEntity.ok(buildSuccessResponse(coupons));
        } catch (Exception e) {
            log.error("获取用户优惠券出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 获取用户的所有优惠券（包括已使用）
     * GET /api/coupons/user/{userId}/all
     * 
     * @param userId 用户ID
     * @return 优惠券列表
     */
    @GetMapping("/user/{userId}/all")
    @Operation(summary = "获取用户所有优惠券", description = "获取指定用户的所有优惠券（包括已使用）")
    public ResponseEntity<?> getUserAllCoupons(@PathVariable Long userId) {
        try {
            List<UserCouponDTO> coupons = couponIssueService.getUserAllCoupons(userId);
            return ResponseEntity.ok(buildSuccessResponse(coupons));
        } catch (Exception e) {
            log.error("获取用户优惠券出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 获取用户优惠券详情
     * GET /api/coupons/{couponId}
     * 
     * @param couponId 用户优惠券ID
     * @return 优惠券详情
     */
    @GetMapping("/{couponId}")
    @Operation(summary = "获取优惠券详情", description = "获取指定优惠券的详细信息")
    public ResponseEntity<?> getCouponDetail(@PathVariable Long couponId) {
        try {
            UserCouponDTO coupon = couponIssueService.getUserCouponById(couponId);
            return ResponseEntity.ok(buildSuccessResponse(coupon));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("获取优惠券详情出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 检查优惠券是否可在指定金额下使用
     * GET /api/coupons/{couponId}/check-amount
     * 
     * @param couponId    用户优惠券ID
     * @param orderAmount 订单金额
     * @return 是否可以使用
     */
    @GetMapping("/{couponId}/check-amount")
    @Operation(summary = "检查优惠券使用条件", description = "检查指定优惠券是否可以在给定订单金额下使用")
    public ResponseEntity<?> checkCouponUsageCondition(
            @PathVariable Long couponId,
            @RequestParam BigDecimal orderAmount) {
        try {
            boolean canUse = couponIssueService.canUseCouponWithAmount(couponId, orderAmount);

            Map<String, Object> result = new HashMap<>();
            result.put("couponId", couponId);
            result.put("orderAmount", orderAmount);
            result.put("canUse", canUse);

            if (!canUse) {
                // 获取优惠券详情以提供更多信息
                UserCouponDTO coupon = couponIssueService.getUserCouponById(couponId);
                result.put("reason", "订单金额不满足优惠券最低使用要求");
            }

            return ResponseEntity.ok(buildSuccessResponse(result));
        } catch (com.fooddelivery.marketingservice.exception.BusinessException e) {
            return ResponseEntity.badRequest()
                    .body(buildErrorResponse(400, e.getMessage()));
        } catch (Exception e) {
            log.error("检查优惠券使用条件出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 验证优惠券组合是否有效
     * POST /api/coupons/validate-combination
     * 
     * @param couponIds 优惠券ID列表
     * @return 验证结果
     */
    @PostMapping("/validate-combination")
    @Operation(summary = "验证优惠券组合", description = "检查选定的优惠券是否可以一起使用")
    public ResponseEntity<?> validateCouponCombination(@RequestBody List<Long> couponIds) {
        try {
            boolean valid = couponCalculationService.validateCouponCombination(couponIds);

            Map<String, Object> result = new HashMap<>();
            result.put("valid", valid);
            result.put("message", valid ? "优惠券组合有效" : "优惠券间存在互斥关系");

            return ResponseEntity.ok(buildSuccessResponse(result));
        } catch (Exception e) {
            log.error("验证优惠券组合出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 创建优惠券模板
     * POST /templates
     * 
     * 运营系统创建新的优惠券
     * 
     * @param request 创建请求
     * @return 创建成功的优惠券模板信息
     */
    @PostMapping("/templates")
    @Operation(summary = "创建优惠券模板", description = "运营系统创建新的优惠券")
    public ResponseEntity<?> createTemplate(@RequestBody CreateCouponTemplateRequest request) {
        try {
            // 参数验证
            if (request.getName() == null || request.getName().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "优惠券名称不能为空"));
            }

            if (request.getType() == null) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "优惠券类型不能为空"));
            }

            CouponTemplateDTO template = couponTemplateService.createTemplate(request);
            log.info("优惠券模板已创建 - ID: {}", template.getId());

            return ResponseEntity.ok(buildSuccessResponse(template));

        } catch (IllegalArgumentException e) {
            log.warn("创建优惠券失败: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(buildErrorResponse(400, e.getMessage()));
        } catch (Exception e) {
            log.error("创建优惠券出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 更新优惠券模板
     * PUT /templates/{id}
     * 
     * 运营可以调整库存或修改启用状态
     * 
     * @param request 更新请求
     * @return 更新后的优惠券模板信息
     */
    @PutMapping("/templates/{id}")
    @Operation(summary = "更新优惠券模板", description = "运营增加库存/下架优惠券")
    public ResponseEntity<?> updateTemplate(@PathVariable Long id, @RequestBody UpdateCouponTemplateRequest request) {
        try {
            // 确保路径变量和请求体的 ID 一致
            request.setId(id);

            if (request.getAddQuantity() != null && request.getAddQuantity() < 0) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "增加的库存数量不能为负数"));
            }

            CouponTemplateDTO template = couponTemplateService.updateTemplate(request);
            log.info("优惠券模板已更新 - ID: {}", id);

            return ResponseEntity.ok(buildSuccessResponse(template));

        } catch (IllegalArgumentException e) {
            log.warn("更新优惠券失败: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(buildErrorResponse(400, e.getMessage()));
        } catch (Exception e) {
            log.error("更新优惠券出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 使用/核销优惠券
     * POST /coupons/{id}/use (or /verify)
     * 
     * 订单服务调用此接口来"消耗"用户的优惠券
     * 
     * @param request 核销请求
     * @return 核销后的优惠券信息
     */
    @PostMapping("/{couponId}/use")
    @Operation(summary = "核销优惠券", description = "订单服务调用此接口消耗用户的优惠券")
    public ResponseEntity<?> useCoupon(@PathVariable Long couponId, @RequestBody UseCouponRequest request) {
        try {
            // 参数验证
            if (couponId == null) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "优惠券ID不能为空"));
            }

            if (request.getOrderId() == null) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "订单ID不能为空"));
            }

            UserCouponDTO coupon = couponIssueService.useCoupon(couponId, request.getOrderId());
            log.info("优惠券已核销 - ID: {}, 订单ID: {}", couponId, request.getOrderId());

            return ResponseEntity.ok(buildSuccessResponse(coupon));

        } catch (IllegalArgumentException e) {
            log.warn("核销优惠券失败: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(buildErrorResponse(400, e.getMessage()));
        } catch (Exception e) {
            log.error("核销优惠券出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 回滚/取消优惠券使用
     * POST /coupons/{id}/rollback
     * 
     * 取消订单时调用此接口把券还给用户
     * 
     * @param couponId 优惠券ID
     * @param request  回滚请求
     * @return 回滚后的优惠券信息
     */
    @PostMapping("/{couponId}/rollback")
    @Operation(summary = "回滚优惠券", description = "取消订单时调用此接口把券还给用户")
    public ResponseEntity<?> rollbackCoupon(@PathVariable Long couponId, @RequestBody RollbackCouponRequest request) {
        try {
            // 参数验证
            if (couponId == null) {
                return ResponseEntity.badRequest()
                        .body(buildErrorResponse(400, "优惠券ID不能为空"));
            }

            UserCouponDTO coupon = couponIssueService.rollbackCoupon(couponId);
            log.info("优惠券已回滚 - ID: {}, 原因: {}", couponId, request.getReason());

            return ResponseEntity.ok(buildSuccessResponse(coupon));

        } catch (IllegalArgumentException e) {
            log.warn("回滚优惠券失败: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(buildErrorResponse(400, e.getMessage()));
        } catch (Exception e) {
            log.error("回滚优惠券出错", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "内部服务器错误，请稍后重试"));
        }
    }

    /**
     * 健康检查端点
     */
    @GetMapping("/health")
    @Operation(summary = "健康检查", description = "检查服务是否正常运行")
    public ResponseEntity<?> health() {
        Map<String, String> result = new HashMap<>();
        result.put("status", "UP");
        result.put("service", "marketing-service");
        return ResponseEntity.ok(result);
    }

    /**
     * 获取所有优惠券模板列表
     * GET /coupons/templates
     */
    @GetMapping("/templates")
    @Operation(summary = "获取优惠券模板列表", description = "获取所有优惠券模板，支持按启用状态筛选")
    public ResponseEntity<?> getCouponTemplates(
            @RequestParam(required = false) Boolean enabled) {
        try {
            List<?> templates;
            if (enabled != null) {
                templates = couponTemplateRepository.findAllByEnabled(enabled);
            } else {
                templates = couponTemplateRepository.findAll();
            }

            // 转换为DTO格式
            List<Map<String, Object>> result = templates.stream().map(t -> {
                com.fooddelivery.marketingservice.entity.CouponTemplate template = (com.fooddelivery.marketingservice.entity.CouponTemplate) t;
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", template.getId());
                dto.put("name", template.getName());
                dto.put("type", template.getType());
                dto.put("discountValue", template.getDiscountValue());
                dto.put("maxDiscount", template.getMaxDiscount());
                dto.put("minOrderAmount", template.getMinOrderAmount());
                dto.put("totalQuantity", template.getTotalQuantity());
                dto.put("issuedQuantity", template.getIssuedQuantity());
                dto.put("enabled", template.getEnabled());
                dto.put("stackable", template.getStackable());
                dto.put("validFrom", template.getValidFrom());
                dto.put("validUntil", template.getValidUntil());
                dto.put("createdAt", template.getCreatedAt());
                dto.put("updatedAt", template.getUpdatedAt());
                return dto;
            }).collect(Collectors.toList());

            log.info("获取优惠券模板列表，总数: {}", result.size());
            return ResponseEntity.ok(buildSuccessResponse(result));
        } catch (Exception e) {
            log.error("获取优惠券模板失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "获取优惠券模板失败"));
        }
    }

    /**
     * 获取优惠券统计数据
     * GET /coupons/stats
     */
    @GetMapping("/stats")
    @Operation(summary = "获取优惠券统计", description = "获取优惠券相关的统计数据")
    public ResponseEntity<?> getCouponStats() {
        try {
            LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

            // 统计各状态数量
            long totalCoupons = userCouponRepository.count();
            long availableCoupons = userCouponRepository.countByStatus(CouponStatus.AVAILABLE);
            long usedCoupons = userCouponRepository.countByStatus(CouponStatus.USED);
            long expiredCoupons = userCouponRepository.countByStatus(CouponStatus.EXPIRED);

            // 今日统计
            long issuedToday = userCouponRepository.countIssuedToday(startOfToday);
            long usedToday = userCouponRepository.countUsedToday(startOfToday);

            // 模板统计
            long totalTemplates = couponTemplateRepository.count();
            long enabledTemplates = couponTemplateRepository.findAllByEnabled(true).size();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCoupons", totalCoupons);
            stats.put("availableCoupons", availableCoupons);
            stats.put("usedCoupons", usedCoupons);
            stats.put("expiredCoupons", expiredCoupons);
            stats.put("issuedToday", issuedToday);
            stats.put("usedToday", usedToday);
            stats.put("totalTemplates", totalTemplates);
            stats.put("enabledTemplates", enabledTemplates);
            stats.put("usageRate", totalCoupons > 0 ? Math.round((double) usedCoupons / totalCoupons * 100) : 0);

            log.info("获取优惠券统计数据");
            return ResponseEntity.ok(buildSuccessResponse(stats));
        } catch (Exception e) {
            log.error("获取优惠券统计失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "获取统计数据失败"));
        }
    }

    /**
     * 获取营销活动列表
     * GET /campaigns
     * 
     * 注意：当前系统暂未实现独立的活动表，返回基于优惠券模板的活动信息
     */
    @GetMapping("/campaigns")
    @Operation(summary = "获取营销活动列表", description = "获取所有营销活动（基于优惠券模板）")
    public ResponseEntity<?> getCampaigns() {
        try {
            LocalDateTime now = LocalDateTime.now();

            // 基于优惠券模板生成活动列表
            List<Map<String, Object>> campaigns = couponTemplateRepository.findAll().stream()
                    .map(template -> {
                        Map<String, Object> campaign = new HashMap<>();
                        campaign.put("id", template.getId());
                        campaign.put("name", template.getName());
                        campaign.put("type", "COUPON");
                        campaign.put("description", "优惠券活动 - " + template.getName());
                        campaign.put("discountType", template.getType());
                        campaign.put("discountValue", template.getDiscountValue());
                        campaign.put("startTime", template.getValidFrom());
                        campaign.put("endTime", template.getValidUntil());
                        campaign.put("enabled", template.getEnabled());

                        // 计算活动状态
                        String status;
                        if (!template.getEnabled()) {
                            status = "DISABLED";
                        } else if (now.isBefore(template.getValidFrom())) {
                            status = "PENDING";
                        } else if (now.isAfter(template.getValidUntil())) {
                            status = "ENDED";
                        } else {
                            status = "ACTIVE";
                        }
                        campaign.put("status", status);

                        // 参与统计
                        campaign.put("totalIssued", template.getIssuedQuantity());
                        campaign.put("totalQuota", template.getTotalQuantity());
                        campaign.put("remainingQuota",
                                template.getTotalQuantity() > 0
                                        ? template.getTotalQuantity() - template.getIssuedQuantity()
                                        : -1);

                        return campaign;
                    })
                    .collect(Collectors.toList());

            log.info("获取营销活动列表，总数: {}", campaigns.size());
            return ResponseEntity.ok(buildSuccessResponse(campaigns));
        } catch (Exception e) {
            log.error("获取营销活动失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse(500, "获取营销活动失败"));
        }
    }

    // ==================== 辅助方法 ====================

    /**
     * 构建成功响应
     */
    private Map<String, Object> buildSuccessResponse(Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "成功");
        response.put("data", data);
        return response;
    }

    /**
     * 构建错误响应
     */
    private Map<String, Object> buildErrorResponse(int code, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", code);
        response.put("message", message);
        response.put("data", null);
        return response;
    }
}
