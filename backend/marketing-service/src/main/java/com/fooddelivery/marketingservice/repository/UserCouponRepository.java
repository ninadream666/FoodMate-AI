package com.fooddelivery.marketingservice.repository;

import com.fooddelivery.marketingservice.entity.UserCoupon;
import com.fooddelivery.marketingservice.entity.CouponStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 用户优惠券仓储接口
 */
@Repository
public interface UserCouponRepository extends JpaRepository<UserCoupon, Long> {

        /**
         * 查找用户的所有可用优惠券
         */
        @Query("SELECT uc FROM UserCoupon uc WHERE uc.userId = :userId " +
                        "AND uc.status = 'AVAILABLE' " +
                        "AND uc.expiresAt > :now")
        List<UserCoupon> findAvailableCouponsByUser(
                        @Param("userId") Long userId,
                        @Param("now") LocalDateTime now);

        /**
         * 查找用户的特定状态优惠券
         */
        List<UserCoupon> findByUserIdAndStatus(Long userId, CouponStatus status);

        /**
         * 查找用户和模板指定的优惠券
         */
        Optional<UserCoupon> findByUserIdAndCouponTemplateId(Long userId, Long couponTemplateId);

        /**
         * 查找用户的所有优惠券
         */
        List<UserCoupon> findByUserId(Long userId);

        /**
         * 统计用户的可用优惠券数量
         */
        @Query("SELECT COUNT(uc) FROM UserCoupon uc WHERE uc.userId = :userId " +
                        "AND uc.status = 'AVAILABLE' AND uc.expiresAt > :now")
        Long countAvailableCoupons(
                        @Param("userId") Long userId,
                        @Param("now") LocalDateTime now);

        /**
         * 查找已过期但仍标记为AVAILABLE的优惠券
         */
        @Query("SELECT uc FROM UserCoupon uc WHERE uc.status = 'AVAILABLE' " +
                        "AND uc.expiresAt <= :now")
        List<UserCoupon> findExpiredCoupons(@Param("now") LocalDateTime now);

        /**
         * 统计各状态的优惠券数量
         */
        long countByStatus(CouponStatus status);

        /**
         * 统计今日发放的优惠券数量
         */
        @Query("SELECT COUNT(uc) FROM UserCoupon uc WHERE uc.obtainedAt >= :startOfDay")
        long countIssuedToday(@Param("startOfDay") LocalDateTime startOfDay);

        /**
         * 统计今日使用的优惠券数量
         */
        @Query("SELECT COUNT(uc) FROM UserCoupon uc WHERE uc.status = 'USED' AND uc.usedAt >= :startOfDay")
        long countUsedToday(@Param("startOfDay") LocalDateTime startOfDay);

        /**
         * 按时间范围统计发放数量
         */
        Long countByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime);

        /**
         * 按状态和使用时间统计
         */
        Long countByStatusAndUsedAtBetween(CouponStatus status, LocalDateTime startTime, LocalDateTime endTime);

        /**
         * 统计时间范围内的去重用户数
         */
        @Query("SELECT COUNT(DISTINCT uc.userId) FROM UserCoupon uc WHERE uc.obtainedAt BETWEEN :startTime AND :endTime")
        Long countDistinctUsersByDateRange(@Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime);

        /**
         * 按类型统计发放和使用数据
         */
        @Query("SELECT COUNT(uc), COUNT(CASE WHEN uc.status = 'USED' THEN 1 END) " +
                        "FROM UserCoupon uc JOIN CouponTemplate ct ON uc.couponTemplateId = ct.id WHERE ct.type = :type")
        Object[] getStatsByType(@Param("type") com.fooddelivery.marketingservice.entity.CouponType type);

        /**
         * 获取平均优惠值（简化估算）
         */
        @Query("SELECT AVG(ct.discountValue) FROM UserCoupon uc JOIN CouponTemplate ct ON uc.couponTemplateId = ct.id WHERE uc.status = 'USED'")
        Object[] getAverageDiscountValue();

        /**
         * 按类型获取平均优惠值
         */
        @Query("SELECT AVG(ct.discountValue) FROM UserCoupon uc JOIN CouponTemplate ct ON uc.couponTemplateId = ct.id WHERE uc.status = 'USED' AND ct.type = :type")
        Object[] getAverageDiscountValueByType(@Param("type") com.fooddelivery.marketingservice.entity.CouponType type);

        /**
         * 按状态和模板类型统计数量
         */
        @Query("SELECT COUNT(uc) FROM UserCoupon uc JOIN CouponTemplate ct ON uc.couponTemplateId = ct.id WHERE uc.status = :status AND ct.type = :type")
        Long countByStatusAndCouponTemplateType(@Param("status") CouponStatus status,
                        @Param("type") com.fooddelivery.marketingservice.entity.CouponType type);
}
