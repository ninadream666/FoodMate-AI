package com.fooddelivery.platformservice.service;

import com.fooddelivery.platformservice.repository.MerchantQueryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 商家查询服务
 * 根据用户ID查询其拥有的店铺ID，带简单缓存
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MerchantQueryService {

    private final MerchantQueryRepository merchantQueryRepository;

    /**
     * 内存缓存：userId->merchantId
     */
    private final Map<Long, Long> merchantIdCache = new ConcurrentHashMap<>();

    /**
     * 根据用户ID获取其拥有的店铺ID
     * 
     * @param userId 用户ID
     * @return 店铺ID，如果用户没有店铺则返回null
     */
    public Long getMerchantIdByUserId(Long userId) {
        if (userId == null) {
            return null;
        }

        // 先查缓存
        Long cachedMerchantId = merchantIdCache.get(userId);
        if (cachedMerchantId != null) {
            return cachedMerchantId;
        }

        // 查数据库
        Long merchantId = merchantQueryRepository.findMerchantIdByOwnerId(userId).orElse(null);
        
        if (merchantId != null) {
            merchantIdCache.put(userId, merchantId);
            log.debug("Cached merchantId {} for userId {}", merchantId, userId);
        }

        return merchantId;
    }

    /**
     * 清除缓存（店铺归属变更时调用）
     */
    public void evictCache(Long userId) {
        merchantIdCache.remove(userId);
    }

    /**
     * 清除所有缓存
     */
    public void clearCache() {
        merchantIdCache.clear();
    }
}
