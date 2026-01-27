package com.fooddelivery.marketingservice.repository;

import com.fooddelivery.marketingservice.entity.CouponTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 优惠券模板仓储接口
 */
@Repository
public interface CouponTemplateRepository extends JpaRepository<CouponTemplate, Long> {

    /**
     * 查找所有启用且有效的优惠券模板
     */
    @Query("SELECT c FROM CouponTemplate c WHERE c.enabled = true " +
            "AND c.validFrom <= :now AND c.validUntil > :now " +
            "AND (c.totalQuantity = 0 OR c.issuedQuantity < c.totalQuantity)")
    List<CouponTemplate> findActiveAndAvailable(@Param("now") LocalDateTime now);

    /**
     * 查找指定ID的优惠券模板
     */
    Optional<CouponTemplate> findByIdAndEnabled(Long id, Boolean enabled);

    /**
     * 查找所有启用的优惠券
     */
    List<CouponTemplate> findAllByEnabled(Boolean enabled);

    /**
     * 按类型查找优惠券
     */
    @Query("SELECT c FROM CouponTemplate c WHERE c.type = :type AND c.enabled = true")
    List<CouponTemplate> findByType(@Param("type") String type);

    /**
     * 统计启用的模板数量
     */
    Long countByEnabledTrue();

    /**
     * 按类型统计模板数量
     */
    Long countByType(com.fooddelivery.marketingservice.entity.CouponType type);
}
