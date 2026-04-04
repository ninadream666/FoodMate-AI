package com.fooddelivery.marketingservice.service;

import com.fooddelivery.marketingservice.dto.CreateCouponTemplateRequest;
import com.fooddelivery.marketingservice.dto.CouponTemplateDTO;
import com.fooddelivery.marketingservice.dto.UpdateCouponTemplateRequest;
import com.fooddelivery.marketingservice.entity.CouponStatus;
import com.fooddelivery.marketingservice.entity.CouponTemplate;
import com.fooddelivery.marketingservice.entity.CouponType;
import com.fooddelivery.marketingservice.repository.CouponTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 优惠券模板管理服务
 * 运营系统通过此服务创建和管理优惠券
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CouponTemplateService {

    private final CouponTemplateRepository couponTemplateRepository;
    private static final DateTimeFormatter dateFormatter = DateTimeFormatter.ISO_DATE_TIME;

    /**
     * 创建优惠券模板
     * 运营系统创建新的优惠券
     * 
     * @param request 创建请求
     * @return 创建后的优惠券模板信息
     * @throws IllegalArgumentException 当参数不合法时
     */
    @Transactional
    public CouponTemplateDTO createTemplate(CreateCouponTemplateRequest request) {
        // 参数验证
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("优惠券名称不能为空");
        }

        if (request.getTotalQuantity() == null || request.getTotalQuantity() <= 0) {
            throw new IllegalArgumentException("发放总量必须大于0");
        }

        if (request.getDiscountValue() == null || request.getDiscountValue().signum() <= 0) {
            throw new IllegalArgumentException("优惠金额/折扣值必须大于0");
        }

        // 创建模板
        CouponTemplate template = new CouponTemplate();
        template.setName(request.getName());
        template.setType(CouponType.valueOf(request.getType()));
        template.setDiscountValue(request.getDiscountValue());
        template.setMaxDiscount(request.getMaxDiscount());
        template.setMinOrderAmount(request.getMinOrderAmount());
        template.setTotalQuantity(request.getTotalQuantity().intValue());
        template.setIssuedQuantity(0);
        template.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        template.setStackable(request.getStackable() != null ? request.getStackable() : true);

        // 解析有效期
        if (request.getValidFrom() != null) {
            template.setValidFrom(LocalDateTime.parse(request.getValidFrom(), dateFormatter));
        }
        if (request.getValidUntil() != null) {
            template.setValidUntil(LocalDateTime.parse(request.getValidUntil(), dateFormatter));
        }

        template.setExclusiveIds(request.getExclusiveIds());
        template.setApplicableMerchantIds(request.getApplicableMerchantIds());
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());

        CouponTemplate savedTemplate = couponTemplateRepository.save(template);
        log.info("优惠券模板已创建 - ID: {}, 名称: {}", savedTemplate.getId(), savedTemplate.getName());

        return convertToDTO(savedTemplate);
    }

    /**
     * 更新优惠券模板
     * 运营可以调整库存或修改启用状态
     * 
     * @param request 更新请求
     * @return 更新后的优惠券模板信息
     * @throws IllegalArgumentException 当模板不存在时
     */
    @Transactional
    public CouponTemplateDTO updateTemplate(UpdateCouponTemplateRequest request) {
        // 查找模板
        CouponTemplate template = couponTemplateRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("优惠券不存在，ID: " + request.getId()));

        // 更新名称
        if (request.getName() != null && !request.getName().isBlank()) {
            template.setName(request.getName());
        }

        // 更新启用状态
        if (request.getEnabled() != null) {
            template.setEnabled(request.getEnabled());
            log.info("优惠券 {} 状态已更新为: {}", request.getId(), request.getEnabled() ? "启用" : "禁用");
        }

        // 增加库存
        if (request.getAddQuantity() != null && request.getAddQuantity() > 0) {
            template.setTotalQuantity(template.getTotalQuantity() + request.getAddQuantity().intValue());
            log.info("优惠券 {} 库存增加了 {} 张，总库存: {}",
                    request.getId(), request.getAddQuantity(), template.getTotalQuantity());
        }

        template.setUpdatedAt(LocalDateTime.now());

        CouponTemplate savedTemplate = couponTemplateRepository.save(template);
        log.info("优惠券模板已更新 - ID: {}", request.getId());

        return convertToDTO(savedTemplate);
    }

    /**
     * 获取优惠券模板详情
     * 
     * @param templateId 模板ID
     * @return 优惠券模板信息
     * @throws IllegalArgumentException 当模板不存在时
     */
    @Transactional(readOnly = true)
    public CouponTemplateDTO getTemplate(Long templateId) {
        CouponTemplate template = couponTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("优惠券不存在，ID: " + templateId));

        return convertToDTO(template);
    }

    /**
     * 下架优惠券
     * 
     * @param templateId 模板ID
     * @return 更新后的优惠券模板信息
     */
    @Transactional
    public CouponTemplateDTO disableTemplate(Long templateId) {
        CouponTemplate template = couponTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("优惠券不存在，ID: " + templateId));

        template.setEnabled(false);
        template.setUpdatedAt(LocalDateTime.now());

        CouponTemplate savedTemplate = couponTemplateRepository.save(template);
        log.info("优惠券已下架 - ID: {}, 名称: {}", templateId, savedTemplate.getName());

        return convertToDTO(savedTemplate);
    }

    /**
     * 启用优惠券
     * 
     * @param templateId 模板ID
     * @return 更新后的优惠券模板信息
     */
    @Transactional
    public CouponTemplateDTO enableTemplate(Long templateId) {
        CouponTemplate template = couponTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("优惠券不存在，ID: " + templateId));

        template.setEnabled(true);
        template.setUpdatedAt(LocalDateTime.now());

        CouponTemplate savedTemplate = couponTemplateRepository.save(template);
        log.info("优惠券已启用 - ID: {}, 名称: {}", templateId, savedTemplate.getName());

        return convertToDTO(savedTemplate);
    }

    /**
     * 切换优惠券状态（启用/禁用）
     * 
     * @param templateId 模板ID
     * @return 更新后的优惠券模板信息
     */
    @Transactional
    public CouponTemplateDTO toggleTemplateStatus(Long templateId) {
        CouponTemplate template = couponTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("优惠券不存在，ID: " + templateId));

        template.setEnabled(!template.getEnabled());
        template.setUpdatedAt(LocalDateTime.now());

        CouponTemplate savedTemplate = couponTemplateRepository.save(template);
        log.info("优惠券状态已切换 - ID: {}, 名称: {}, 新状态: {}",
                templateId, savedTemplate.getName(), savedTemplate.getEnabled() ? "启用" : "禁用");

        return convertToDTO(savedTemplate);
    }

    /**
     * 删除优惠券模板
     * 
     * @param templateId 模板ID
     * @throws IllegalArgumentException 当模板不存在或已有用户领取时
     */
    @Transactional
    public void deleteTemplate(Long templateId) {
        CouponTemplate template = couponTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("优惠券不存在，ID: " + templateId));

        // 检查是否已有用户领取
        if (template.getIssuedQuantity() != null && template.getIssuedQuantity() > 0) {
            throw new IllegalArgumentException("该优惠券已有用户领取，无法删除。建议使用禁用功能。");
        }

        couponTemplateRepository.delete(template);
        log.info("优惠券模板已删除 - ID: {}, 名称: {}", templateId, template.getName());
    }

    /**
     * 转换为DTO
     */
    private CouponTemplateDTO convertToDTO(CouponTemplate template) {
        return CouponTemplateDTO.builder()
                .id(template.getId())
                .name(template.getName())
                .type(template.getType())
                .discountValue(template.getDiscountValue())
                .maxDiscount(template.getMaxDiscount())
                .minOrderAmount(template.getMinOrderAmount())
                .totalQuantity(template.getTotalQuantity())
                .issuedQuantity(template.getIssuedQuantity())
                .enabled(template.getEnabled())
                .stackable(template.getStackable())
                .validFrom(template.getValidFrom())
                .validUntil(template.getValidUntil())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
