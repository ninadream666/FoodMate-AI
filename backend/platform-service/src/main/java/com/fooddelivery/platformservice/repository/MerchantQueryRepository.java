package com.fooddelivery.platformservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 商家查询Repository（只读）
 * 用于根据用户ID查询其拥有的店铺ID
 */
@Repository
public interface MerchantQueryRepository extends JpaRepository<MerchantEntity, Long> {

    /**
     * 根据店铺所有者ID查询店铺ID (如果有多个商家，返回第一个)
     */
    @Query("SELECT m.id FROM MerchantEntity m WHERE m.ownerId = :ownerId ORDER BY m.id ASC LIMIT 1")
    Optional<Long> findMerchantIdByOwnerId(@Param("ownerId") Long ownerId);
}
