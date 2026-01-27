package com.fooddelivery.platformservice.service;

import com.fooddelivery.platformservice.dto.*;
import com.fooddelivery.platformservice.entity.*;
import com.fooddelivery.platformservice.exception.BusinessException;
import com.fooddelivery.platformservice.repository.MerchantServiceSubscriptionRepository;
import com.fooddelivery.platformservice.repository.PlatformServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlatformServiceService {

    private final PlatformServiceRepository platformServiceRepository;
    private final MerchantServiceSubscriptionRepository subscriptionRepository;

    /**
     * 获取所有启用的服务（商家端）
     */
    public List<PlatformServiceDTO> getActiveServices(Long merchantId) {
        List<PlatformService> services = platformServiceRepository
                .findByStatusOrderBySortOrderAsc(ServiceStatus.ACTIVE);

        // 获取商家的订阅信息
        Map<Long, MerchantServiceSubscription> subscriptionMap = subscriptionRepository
                .findByMerchantIdAndStatus(merchantId, SubscriptionStatus.ACTIVE)
                .stream()
                .collect(Collectors.toMap(s -> s.getService().getId(), s -> s));

        return services.stream()
                .map(s -> {
                    MerchantServiceSubscription sub = subscriptionMap.get(s.getId());
                    return PlatformServiceDTO.fromEntity(s,
                            sub != null,
                            sub != null ? sub.getId() : null);
                })
                .collect(Collectors.toList());
    }

    /**
     * 按类别获取服务
     */
    public List<PlatformServiceDTO> getServicesByCategory(ServiceCategory category, Long merchantId) {
        List<PlatformService> services = platformServiceRepository
                .findByCategoryAndStatusOrderBySortOrderAsc(category, ServiceStatus.ACTIVE);

        Map<Long, MerchantServiceSubscription> subscriptionMap = subscriptionRepository
                .findByMerchantIdAndStatus(merchantId, SubscriptionStatus.ACTIVE)
                .stream()
                .collect(Collectors.toMap(s -> s.getService().getId(), s -> s));

        return services.stream()
                .map(s -> {
                    MerchantServiceSubscription sub = subscriptionMap.get(s.getId());
                    return PlatformServiceDTO.fromEntity(s,
                            sub != null,
                            sub != null ? sub.getId() : null);
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取可选服务（非强制）
     */
    public List<PlatformServiceDTO> getOptionalServices(Long merchantId) {
        List<PlatformService> services = platformServiceRepository
                .findByIsMandatoryFalseAndStatusOrderBySortOrderAsc(ServiceStatus.ACTIVE);

        Map<Long, MerchantServiceSubscription> subscriptionMap = subscriptionRepository
                .findByMerchantIdAndStatus(merchantId, SubscriptionStatus.ACTIVE)
                .stream()
                .collect(Collectors.toMap(s -> s.getService().getId(), s -> s));

        return services.stream()
                .map(s -> {
                    MerchantServiceSubscription sub = subscriptionMap.get(s.getId());
                    return PlatformServiceDTO.fromEntity(s,
                            sub != null,
                            sub != null ? sub.getId() : null);
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取服务详情
     */
    public PlatformServiceDTO getServiceById(Long serviceId, Long merchantId) {
        PlatformService service = platformServiceRepository.findById(serviceId)
                .orElseThrow(() -> new BusinessException("服务不存在"));

        var subscription = subscriptionRepository
                .findByMerchantIdAndServiceIdAndStatus(merchantId, serviceId, SubscriptionStatus.ACTIVE)
                .orElse(null);

        return PlatformServiceDTO.fromEntity(service,
                subscription != null,
                subscription != null ? subscription.getId() : null);
    }

    // ==================== 管理员接口 ====================

    /**
     * 获取所有服务（管理员）
     */
    public List<PlatformServiceDTO> getAllServices() {
        return platformServiceRepository.findAll().stream()
                .map(PlatformServiceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 创建服务
     */
    @Transactional
    public PlatformServiceDTO createService(CreatePlatformServiceRequest request) {
        // 检查编码是否已存在
        if (platformServiceRepository.existsByServiceCode(request.getServiceCode())) {
            throw new BusinessException("服务编码已存在: " + request.getServiceCode());
        }

        PlatformService service = PlatformService.builder()
                .serviceCode(request.getServiceCode())
                .serviceName(request.getServiceName())
                .category(request.getCategory())
                .description(request.getDescription())
                .feeType(request.getFeeType())
                .feeValue(request.getFeeValue())
                .billingCycle(request.getBillingCycle() != null ? request.getBillingCycle() : BillingCycle.PER_ORDER)
                .minOrderAmount(request.getMinOrderAmount())
                .isMandatory(request.getIsMandatory() != null ? request.getIsMandatory() : false)
                .status(ServiceStatus.ACTIVE)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        service = platformServiceRepository.save(service);
        log.info("Created platform service: {}", service.getServiceCode());

        return PlatformServiceDTO.fromEntity(service);
    }

    /**
     * 更新服务
     */
    @Transactional
    public PlatformServiceDTO updateService(Long serviceId, UpdatePlatformServiceRequest request) {
        PlatformService service = platformServiceRepository.findById(serviceId)
                .orElseThrow(() -> new BusinessException("服务不存在"));

        if (request.getServiceName() != null) {
            service.setServiceName(request.getServiceName());
        }
        if (request.getCategory() != null) {
            service.setCategory(request.getCategory());
        }
        if (request.getDescription() != null) {
            service.setDescription(request.getDescription());
        }
        if (request.getFeeType() != null) {
            service.setFeeType(request.getFeeType());
        }
        if (request.getFeeValue() != null) {
            service.setFeeValue(request.getFeeValue());
        }
        if (request.getBillingCycle() != null) {
            service.setBillingCycle(request.getBillingCycle());
        }
        if (request.getMinOrderAmount() != null) {
            service.setMinOrderAmount(request.getMinOrderAmount());
        }
        if (request.getIsMandatory() != null) {
            service.setIsMandatory(request.getIsMandatory());
        }
        if (request.getStatus() != null) {
            service.setStatus(request.getStatus());
        }
        if (request.getSortOrder() != null) {
            service.setSortOrder(request.getSortOrder());
        }

        service = platformServiceRepository.save(service);
        log.info("Updated platform service: {}", service.getServiceCode());

        return PlatformServiceDTO.fromEntity(service);
    }

    /**
     * 上线/下线服务
     */
    @Transactional
    public PlatformServiceDTO toggleServiceStatus(Long serviceId) {
        PlatformService service = platformServiceRepository.findById(serviceId)
                .orElseThrow(() -> new BusinessException("服务不存在"));

        service.setStatus(service.getStatus() == ServiceStatus.ACTIVE ?
                ServiceStatus.INACTIVE : ServiceStatus.ACTIVE);

        service = platformServiceRepository.save(service);
        log.info("Toggled service status: {} -> {}", service.getServiceCode(), service.getStatus());

        return PlatformServiceDTO.fromEntity(service);
    }

    /**
     * 获取服务的订阅统计
     */
    public long getSubscriptionCount(Long serviceId) {
        return subscriptionRepository.countByServiceIdAndStatus(serviceId, SubscriptionStatus.ACTIVE);
    }
}
