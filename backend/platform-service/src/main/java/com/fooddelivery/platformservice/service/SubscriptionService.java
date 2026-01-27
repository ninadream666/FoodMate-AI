package com.fooddelivery.platformservice.service;

import com.fooddelivery.platformservice.dto.CancelSubscriptionRequest;
import com.fooddelivery.platformservice.dto.SubscribeServiceRequest;
import com.fooddelivery.platformservice.dto.SubscriptionDTO;
import com.fooddelivery.platformservice.entity.*;
import com.fooddelivery.platformservice.exception.BusinessException;
import com.fooddelivery.platformservice.repository.MerchantServiceSubscriptionRepository;
import com.fooddelivery.platformservice.repository.PlatformServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final MerchantServiceSubscriptionRepository subscriptionRepository;
    private final PlatformServiceRepository platformServiceRepository;

    /**
     * 获取商家的所有订阅
     */
    public List<SubscriptionDTO> getMerchantSubscriptions(Long merchantId) {
        return subscriptionRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId)
                .stream()
                .map(SubscriptionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 获取商家的有效订阅
     */
    public List<SubscriptionDTO> getActiveSubscriptions(Long merchantId) {
        return subscriptionRepository.findByMerchantIdAndStatus(merchantId, SubscriptionStatus.ACTIVE)
                .stream()
                .map(SubscriptionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 订阅服务
     */
    @Transactional
    public SubscriptionDTO subscribeService(Long merchantId, SubscribeServiceRequest request) {
        Long serviceId = request.getServiceId();

        // 检查服务是否存在且启用
        PlatformService service = platformServiceRepository.findById(serviceId)
                .orElseThrow(() -> new BusinessException("服务不存在"));

        if (service.getStatus() != ServiceStatus.ACTIVE) {
            throw new BusinessException("该服务当前不可用");
        }

        // 检查是否已订阅
        boolean alreadySubscribed = subscriptionRepository
                .existsByMerchantIdAndServiceIdAndStatus(merchantId, serviceId, SubscriptionStatus.ACTIVE);

        if (alreadySubscribed) {
            throw new BusinessException("您已订阅该服务");
        }

        // 创建订阅
        MerchantServiceSubscription subscription = MerchantServiceSubscription.builder()
                .merchantId(merchantId)
                .service(service)
                .status(SubscriptionStatus.ACTIVE)
                .subscribedAt(LocalDateTime.now())
                .build();

        // 如果是按月计费，设置过期时间
        if (service.getBillingCycle() == BillingCycle.MONTHLY) {
            subscription.setExpiresAt(LocalDateTime.now().plusMonths(1));
        }

        subscription = subscriptionRepository.save(subscription);
        log.info("Merchant {} subscribed to service {}", merchantId, service.getServiceCode());

        return SubscriptionDTO.fromEntity(subscription);
    }

    /**
     * 取消订阅
     */
    @Transactional
    public void cancelSubscription(Long merchantId, Long subscriptionId, CancelSubscriptionRequest request) {
        MerchantServiceSubscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new BusinessException("订阅记录不存在"));

        // 验证归属
        if (!subscription.getMerchantId().equals(merchantId)) {
            throw new BusinessException("无权操作此订阅");
        }

        // 检查状态
        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BusinessException("该订阅已取消或已过期");
        }

        // 检查是否是强制服务
        if (subscription.getService().getIsMandatory()) {
            throw new BusinessException("基础服务不可取消");
        }

        // 取消订阅
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancelReason(request != null ? request.getReason() : null);

        subscriptionRepository.save(subscription);
        log.info("Merchant {} cancelled subscription to service {}",
                merchantId, subscription.getService().getServiceCode());
    }

    /**
     * 为新商家初始化强制订阅
     * 当新商家入驻时调用
     */
    @Transactional
    public void initMandatorySubscriptions(Long merchantId) {
        List<PlatformService> mandatoryServices = platformServiceRepository
                .findByIsMandatoryTrueAndStatus(ServiceStatus.ACTIVE);

        for (PlatformService service : mandatoryServices) {
            // 检查是否已存在
            boolean exists = subscriptionRepository
                    .existsByMerchantIdAndServiceIdAndStatus(merchantId, service.getId(), SubscriptionStatus.ACTIVE);

            if (!exists) {
                MerchantServiceSubscription subscription = MerchantServiceSubscription.builder()
                        .merchantId(merchantId)
                        .service(service)
                        .status(SubscriptionStatus.ACTIVE)
                        .subscribedAt(LocalDateTime.now())
                        .build();

                subscriptionRepository.save(subscription);
                log.info("Auto-subscribed merchant {} to mandatory service {}",
                        merchantId, service.getServiceCode());
            }
        }
    }

    /**
     * 检查商家是否已订阅某服务
     */
    public boolean isSubscribed(Long merchantId, Long serviceId) {
        return subscriptionRepository
                .existsByMerchantIdAndServiceIdAndStatus(merchantId, serviceId, SubscriptionStatus.ACTIVE);
    }

    /**
     * 检查商家是否已订阅某服务（通过服务编码）
     */
    public boolean isSubscribedByCode(Long merchantId, String serviceCode) {
        return platformServiceRepository.findByServiceCode(serviceCode)
                .map(service -> subscriptionRepository
                        .existsByMerchantIdAndServiceIdAndStatus(merchantId, service.getId(), SubscriptionStatus.ACTIVE))
                .orElse(false);
    }
}
