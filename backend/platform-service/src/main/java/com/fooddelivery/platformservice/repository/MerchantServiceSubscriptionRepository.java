package com.fooddelivery.platformservice.repository;

import com.fooddelivery.platformservice.entity.BillingCycle;
import com.fooddelivery.platformservice.entity.MerchantServiceSubscription;
import com.fooddelivery.platformservice.entity.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantServiceSubscriptionRepository extends JpaRepository<MerchantServiceSubscription, Long> {

    /**
     * 查找商家的所有订阅
     */
    List<MerchantServiceSubscription> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);

    /**
     * 查找商家的有效订阅
     */
    List<MerchantServiceSubscription> findByMerchantIdAndStatus(Long merchantId, SubscriptionStatus status);

    /**
     * 查找商家对某服务的有效订阅
     */
    Optional<MerchantServiceSubscription> findByMerchantIdAndServiceIdAndStatus(
            Long merchantId, Long serviceId, SubscriptionStatus status);

    /**
     * 检查商家是否已订阅某服务
     */
    boolean existsByMerchantIdAndServiceIdAndStatus(Long merchantId, Long serviceId, SubscriptionStatus status);

    /**
     * 查找某个商家对某个服务的所有历史记录（无视状态，用于复用记录，防500报错）
     */
    List<MerchantServiceSubscription> findByMerchantIdAndServiceId(Long merchantId, Long serviceId);

    /**
     * 查找商家的有效且按单计费的订阅（用于分成计算）
     */
    @Query("SELECT s FROM MerchantServiceSubscription s " +
           "JOIN FETCH s.service ps " +
           "WHERE s.merchantId = :merchantId " +
           "AND s.status = 'ACTIVE' " +
           "AND ps.billingCycle = :billingCycle " +
           "AND ps.status = 'ACTIVE'")
    List<MerchantServiceSubscription> findActivePerOrderSubscriptions(
            @Param("merchantId") Long merchantId,
            @Param("billingCycle") BillingCycle billingCycle);

    /**
     * 统计某服务的订阅数量
     */
    long countByServiceIdAndStatus(Long serviceId, SubscriptionStatus status);

    /**
     * 查找所有商家的有效订阅（用于批量处理）
     */
    @Query("SELECT DISTINCT s.merchantId FROM MerchantServiceSubscription s WHERE s.status = 'ACTIVE'")
    List<Long> findAllActiveMerchantIds();
}