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
     * 订阅服务 - 优先复用已有记录，避免触发唯一索引冲突
     */
    @Transactional
    public SubscriptionDTO subscribeService(Long merchantId, SubscribeServiceRequest request) {
        Long serviceId = request.getServiceId();

        PlatformService service = platformServiceRepository.findById(serviceId)
                .orElseThrow(() -> new BusinessException("服务不存在"));

        if (service.getStatus() != ServiceStatus.ACTIVE) {
            throw new BusinessException("该服务当前不可用");
        }

        // 查找历史是否留存过该记录（包含已取消、已过期）
        List<MerchantServiceSubscription> existingRecords = subscriptionRepository
                .findByMerchantIdAndServiceId(merchantId, serviceId);
        
        MerchantServiceSubscription subscription = null;

        for (MerchantServiceSubscription record : existingRecords) {
            if (record.getStatus() == SubscriptionStatus.ACTIVE) {
                throw new BusinessException("您已订阅该服务");
            }
            subscription = record; // 拿到最新的一条作为复用目标
        }

        // 如果完全没有历史，才Insert
        if (subscription == null) {
            subscription = MerchantServiceSubscription.builder()
                    .merchantId(merchantId)
                    .service(service)
                    .build();
        }

        // 复用该记录，状态置为 ACTIVE
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setSubscribedAt(LocalDateTime.now());
        subscription.setCancelledAt(null);
        subscription.setCancelReason(null);

        if (service.getBillingCycle() == BillingCycle.MONTHLY) {
            subscription.setExpiresAt(LocalDateTime.now().plusMonths(1));
        } else {
            subscription.setExpiresAt(null);
        }

        subscription = subscriptionRepository.save(subscription);
        log.info("Merchant {} subscribed to service {}", merchantId, service.getServiceCode());

        return SubscriptionDTO.fromEntity(subscription);
    }

    /**
     * 取消订阅 - 强制先Delete再Update，规避数据库约束碰撞
     */
    @Transactional
    public void cancelSubscription(Long merchantId, Long subscriptionId, CancelSubscriptionRequest request) {
        MerchantServiceSubscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new BusinessException("订阅记录不存在"));

        if (!subscription.getMerchantId().equals(merchantId)) {
            throw new BusinessException("无权操作此订阅");
        }

        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BusinessException("该订阅已取消或已过期");
        }

        if (subscription.getService().getIsMandatory()) {
            throw new BusinessException("基础服务不可取消");
        }

        // 解决Hibernate默认先Update后Delete导致的Unique索引冲突
        List<MerchantServiceSubscription> existingRecords = subscriptionRepository
                .findByMerchantIdAndServiceId(merchantId, subscription.getService().getId());
        
        for (MerchantServiceSubscription oldRecord : existingRecords) {
            if (!oldRecord.getId().equals(subscriptionId) && oldRecord.getStatus() == SubscriptionStatus.CANCELLED) {
                try {
                    subscriptionRepository.delete(oldRecord);
                    subscriptionRepository.flush(); // 强制立刻执行Delete SQL，为后面的更新腾出唯一索引空间
                } catch (Exception e) {
                    log.warn("无法物理删除旧订阅记录，转为软废弃: {}", e.getMessage());
                    oldRecord.setStatus(SubscriptionStatus.EXPIRED);
                    subscriptionRepository.saveAndFlush(oldRecord);
                }
            }
        }

        // 正常取消当前订阅
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancelReason(request != null ? request.getReason() : null);

        subscriptionRepository.save(subscription);
        log.info("Merchant {} cancelled subscription to service {}",
                merchantId, subscription.getService().getServiceCode());
    }

    /**
     * 初始化必须的基础服务订阅
     */
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