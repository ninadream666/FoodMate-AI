package com.fooddelivery.platformservice.repository;

import com.fooddelivery.platformservice.entity.MerchantSettlement;
import com.fooddelivery.platformservice.entity.SettlementStatus;
import com.fooddelivery.platformservice.entity.SettlementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantSettlementRepository extends JpaRepository<MerchantSettlement, Long> {

        /**
         * 根据结算单号查找
         */
        Optional<MerchantSettlement> findBySettlementNo(String settlementNo);

        /**
         * 查找商家的结算单（分页）
         */
        Page<MerchantSettlement> findByMerchantIdOrderByCreatedAtDesc(Long merchantId, Pageable pageable);

        /**
         * 按状态查找商家的结算单
         */
        Page<MerchantSettlement> findByMerchantIdAndStatusOrderByCreatedAtDesc(
                        Long merchantId, SettlementStatus status, Pageable pageable);

        /**
         * 检查某商家某周期是否已有结算单
         */
        boolean existsByMerchantIdAndSettlementTypeAndPeriodLabel(
                        Long merchantId, SettlementType settlementType, String periodLabel);

        /**
         * 查找某商家某周期的结算单
         */
        Optional<MerchantSettlement> findByMerchantIdAndSettlementTypeAndPeriodLabel(
                        Long merchantId, SettlementType settlementType, String periodLabel);

        /**
         * 查找需要自动确认的结算单（超过确认截止时间且状态为待确认）
         */
        @Query("SELECT s FROM MerchantSettlement s " +
                        "WHERE s.status = 'PENDING_CONFIRM' " +
                        "AND s.confirmDeadline < :now")
        List<MerchantSettlement> findExpiredPendingSettlements(@Param("now") LocalDateTime now);

        /**
         * 按状态统计结算单数量
         */
        long countByStatus(SettlementStatus status);

        /**
         * 按状态统计商家的结算单数量
         */
        long countByMerchantIdAndStatus(Long merchantId, SettlementStatus status);

        /**
         * 获取商家最新的结算单
         */
        Optional<MerchantSettlement> findFirstByMerchantIdOrderByCreatedAtDesc(Long merchantId);

        /**
         * 管理员查询：按状态筛选所有结算单
         */
        Page<MerchantSettlement> findByStatusOrderByCreatedAtDesc(SettlementStatus status, Pageable pageable);

        /**
         * 管理员查询：按类型筛选所有结算单
         */
        Page<MerchantSettlement> findBySettlementTypeOrderByCreatedAtDesc(SettlementType type, Pageable pageable);

        /**
         * 获取所有结算单（管理员）
         */
        Page<MerchantSettlement> findAllByOrderByCreatedAtDesc(Pageable pageable);

        /**
         * 统计待打款总金额
         */
        @Query("SELECT COALESCE(SUM(s.netIncome), 0) FROM MerchantSettlement s WHERE s.status = 'CONFIRMED'")
        java.math.BigDecimal sumPendingPaymentAmount();

        /**
         * 批量更新状态为已打款
         */
        @Modifying
        @Query("UPDATE MerchantSettlement s SET s.status = 'PAID', s.paidAt = :paidAt, s.updatedAt = :paidAt " +
                        "WHERE s.id IN :ids AND s.status = 'CONFIRMED'")
        int batchMarkAsPaid(@Param("ids") List<Long> ids, @Param("paidAt") LocalDateTime paidAt);

        /**
         * 查找某周期内有未结算分成的商家ID列表
         */
        @Query(value = "SELECT DISTINCT cr.merchant_id FROM commission_records cr " +
                        "WHERE cr.settlement_id IS NULL " +
                        "AND cr.status = 'PENDING' " +
                        "AND cr.created_at >= :startTime " +
                        "AND cr.created_at < :endTime", nativeQuery = true)
        List<Long> findMerchantsWithUnsettledCommissions(
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime);

        /**
         * 统计已结算总金额 (PAID状态)
         */
        @Query("SELECT COALESCE(SUM(s.netIncome), 0) FROM MerchantSettlement s WHERE s.status = com.fooddelivery.platformservice.entity.SettlementStatus.PAID")
        java.math.BigDecimal sumSettledAmount();

        /**
         * 统计总结算金额
         */
        @Query("SELECT COALESCE(SUM(s.netIncome), 0) FROM MerchantSettlement s")
        Optional<java.math.BigDecimal> sumTotalSettlementAmount();

        /**
         * 统计已打款金额
         */
        @Query("SELECT COALESCE(SUM(s.netIncome), 0) FROM MerchantSettlement s WHERE s.status = 'PAID'")
        Optional<java.math.BigDecimal> sumPaidAmount();

        /**
         * 按时间范围统计结算数据
         */
        @Query("SELECT COUNT(s), COALESCE(SUM(s.netIncome), 0), " +
                        "COALESCE(SUM(CASE WHEN s.status = 'PAID' THEN s.netIncome ELSE 0 END), 0), " +
                        "COUNT(DISTINCT s.merchantId) " +
                        "FROM MerchantSettlement s " +
                        "WHERE s.createdAt >= :startTime AND s.createdAt < :endTime")
        Object[] getSettlementStatsByDateRange(
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime);
}
