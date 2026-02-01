package com.fooddelivery.merchant.repository;

import com.fooddelivery.merchant.entity.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, Long> {

    // 根据店铺ID和所有者用户ID查询
    // 用于权限验证
    Optional<Merchant> findByIdAndOwnerUserId(Long id, Long ownerUserId);

    // 查询某个用户拥有的所有店铺
    List<Merchant> findByOwnerUserId(Long ownerUserId);

    // 查询某个用户拥有的所有店铺（按ID排序，确保顺序确定性）
    List<Merchant> findByOwnerUserIdOrderByIdAsc(Long ownerUserId);

    // 查询所有开启了动态定价的商家
    List<Merchant> findByEnableDynamicPricing(Boolean enableDynamicPricing);

    // 根据外部 ID 查询（支持智能体返回的 ID）
    Optional<Merchant> findByExternalId(String externalId);

    // 检查外部 ID 是否存在
    boolean existsByExternalId(String externalId);

    // 根据来源查询
    List<Merchant> findBySource(String source);

    // 根据菜系类型查询
    List<Merchant> findByCuisineType(String cuisineType);

    // 根据评分范围查询
    List<Merchant> findByRatingGreaterThanEqual(Double minRating);

    // 查询未被认领的商家（owner_user_id 为 null）
    List<Merchant> findByOwnerUserIdIsNull();

    // 按名称关键字查询未被认领的商家
    List<Merchant> findByOwnerUserIdIsNullAndNameContainingIgnoreCase(String keyword);
}