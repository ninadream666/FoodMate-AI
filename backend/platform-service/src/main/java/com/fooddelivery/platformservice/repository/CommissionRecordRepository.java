package com.fooddelivery.platformservice.repository;

import com.fooddelivery.platformservice.entity.CommissionRecord;
import com.fooddelivery.platformservice.entity.CommissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommissionRecordRepository extends JpaRepository<CommissionRecord, Long> {

       /**
        * 查找订单的所有分成记录
        */
       List<CommissionRecord> findByOrderId(Long orderId);

       /**
        * 检查订单是否已计算分成
        */
       boolean existsByOrderId(Long orderId);

       /**
        * 查找商家的分成记录（分页）
        */
       Page<CommissionRecord> findByMerchantIdOrderByCreatedAtDesc(Long merchantId, Pageable pageable);

       /**
        * 按状态查找商家的分成记录
        */
       Page<CommissionRecord> findByMerchantIdAndStatusOrderByCreatedAtDesc(
                     Long merchantId, CommissionStatus status, Pageable pageable);

       /**
        * 按时间范围查找商家的分成记录
        */
       @Query("SELECT c FROM CommissionRecord c " +
                     "WHERE c.merchantId = :merchantId " +
                     "AND c.createdAt BETWEEN :startTime AND :endTime " +
                     "ORDER BY c.createdAt DESC")
       Page<CommissionRecord> findByMerchantIdAndTimeRange(
                     @Param("merchantId") Long merchantId,
                     @Param("startTime") LocalDateTime startTime,
                     @Param("endTime") LocalDateTime endTime,
                     Pageable pageable);

       /**
        * 统计商家的分成汇总
        */
       @Query("SELECT SUM(c.commissionAmount), COUNT(DISTINCT c.orderId), SUM(c.orderAmount) " +
                     "FROM CommissionRecord c " +
                     "WHERE c.merchantId = :merchantId AND c.status = :status")
       Object[] sumCommissionByMerchantAndStatus(
                     @Param("merchantId") Long merchantId,
                     @Param("status") CommissionStatus status);

       /**
        * 统计商家指定时间范围内的分成
        */
       @Query("SELECT SUM(c.commissionAmount), COUNT(DISTINCT c.orderId), SUM(c.orderAmount) " +
                     "FROM CommissionRecord c " +
                     "WHERE c.merchantId = :merchantId " +
                     "AND c.createdAt BETWEEN :startTime AND :endTime")
       Object[] sumCommissionByMerchantAndTimeRange(
                     @Param("merchantId") Long merchantId,
                     @Param("startTime") LocalDateTime startTime,
                     @Param("endTime") LocalDateTime endTime);

       /**
        * 按服务类型统计商家的分成
        */
       @Query("SELECT c.service.category, SUM(c.commissionAmount), COUNT(c) " +
                     "FROM CommissionRecord c " +
                     "WHERE c.merchantId = :merchantId " +
                     "AND c.createdAt BETWEEN :startTime AND :endTime " +
                     "GROUP BY c.service.category")
       List<Object[]> sumCommissionByMerchantGroupByCategory(
                     @Param("merchantId") Long merchantId,
                     @Param("startTime") LocalDateTime startTime,
                     @Param("endTime") LocalDateTime endTime);

       /**
        * 平台总分成统计
        */
       @Query("SELECT SUM(c.commissionAmount), COUNT(DISTINCT c.orderId), COUNT(DISTINCT c.merchantId) " +
                     "FROM CommissionRecord c " +
                     "WHERE c.createdAt BETWEEN :startTime AND :endTime")
       Object[] sumPlatformCommission(
                     @Param("startTime") LocalDateTime startTime,
                     @Param("endTime") LocalDateTime endTime);

       /**
        * 批量更新分成状态为已结算
        */
       @Query("UPDATE CommissionRecord c SET c.status = 'SETTLED', c.settledAt = :settledAt " +
                     "WHERE c.merchantId = :merchantId AND c.status = 'PENDING'")
       int settleCommissionByMerchant(
                     @Param("merchantId") Long merchantId,
                     @Param("settledAt") LocalDateTime settledAt);

       // ==================== 结算单相关查询 ====================

       /**
        * 查找商家未结算的分成记录（指定时间范围）
        */
       @Query("SELECT c FROM CommissionRecord c " +
                     "WHERE c.merchantId = :merchantId " +
                     "AND c.settlement IS NULL " +
                     "AND c.status = 'PENDING' " +
                     "AND c.createdAt >= :startTime " +
                     "AND c.createdAt < :endTime")
       List<CommissionRecord> findUnsettledByMerchantAndTimeRange(
                     @Param("merchantId") Long merchantId,
                     @Param("startTime") LocalDateTime startTime,
                     @Param("endTime") LocalDateTime endTime);

       /**
        * 统计商家未结算分成（指定时间范围）
        */
       @Query("SELECT COALESCE(SUM(c.commissionAmount), 0), " +
                     "COUNT(DISTINCT c.orderId), " +
                     "COALESCE(SUM(c.orderAmount), 0) " +
                     "FROM CommissionRecord c " +
                     "WHERE c.merchantId = :merchantId " +
                     "AND c.settlement IS NULL " +
                     "AND c.status = 'PENDING' " +
                     "AND c.createdAt >= :startTime " +
                     "AND c.createdAt < :endTime")
       Object[] sumUnsettledByMerchantAndTimeRange(
                     @Param("merchantId") Long merchantId,
                     @Param("startTime") LocalDateTime startTime,
                     @Param("endTime") LocalDateTime endTime);

       /**
        * 批量关联结算单
        */
       @Modifying
       @Query("UPDATE CommissionRecord c SET c.settlement.id = :settlementId, c.status = 'SETTLED', c.settledAt = :settledAt "
                     +
                     "WHERE c.merchantId = :merchantId " +
                     "AND c.settlement IS NULL " +
                     "AND c.status = 'PENDING' " +
                     "AND c.createdAt >= :startTime " +
                     "AND c.createdAt < :endTime")
       int linkToSettlement(
                     @Param("merchantId") Long merchantId,
                     @Param("settlementId") Long settlementId,
                     @Param("startTime") LocalDateTime startTime,
                     @Param("endTime") LocalDateTime endTime,
                     @Param("settledAt") LocalDateTime settledAt);

       /**
        * 查找结算单内的分成记录
        */
       List<CommissionRecord> findBySettlementIdOrderByCreatedAtDesc(Long settlementId);

       /**
        * 查找结算单内的分成记录（分页）
        */
       Page<CommissionRecord> findBySettlementIdOrderByCreatedAtDesc(Long settlementId, Pageable pageable);

       /**
        * 按服务分组统计结算单内的分成
        */
       @Query("SELECT c.serviceName, c.service.category, SUM(c.commissionAmount), COUNT(c) " +
                     "FROM CommissionRecord c " +
                     "WHERE c.settlement.id = :settlementId " +
                     "GROUP BY c.serviceName, c.service.category")
       List<Object[]> sumCommissionBySettlementGroupByService(@Param("settlementId") Long settlementId);

       /**
        * 解除分成记录与结算单的关联（结算单作废时使用）
        */
       @Modifying
       @Query("UPDATE CommissionRecord c SET c.settlement = NULL, c.status = 'PENDING', c.settledAt = NULL " +
                     "WHERE c.settlement.id = :settlementId")
       int unlinkFromSettlement(@Param("settlementId") Long settlementId);

       /**
        * 按时间范围统计佣金总额（用于Dashboard）
        */
       @Query("SELECT COALESCE(SUM(c.commissionAmount), 0) FROM CommissionRecord c " +
                     "WHERE c.createdAt BETWEEN :startTime AND :endTime")
       Optional<BigDecimal> sumCommissionByDateRange(
                     @Param("startTime") LocalDateTime startTime,
                     @Param("endTime") LocalDateTime endTime);

       /**
        * 获取佣金贡献最高的商家列表（用于top-merchants）
        */
       @Query("SELECT c.merchantId, SUM(c.commissionAmount) as totalCommission, COUNT(DISTINCT c.orderId) as orderCount "
                     +
                     "FROM CommissionRecord c " +
                     "GROUP BY c.merchantId " +
                     "ORDER BY totalCommission DESC")
       List<Object[]> findTopMerchantsByCommission(Pageable pageable);

       /**
        * 按时间范围获取佣金贡献最高的商家列表
        */
       @Query("SELECT c.merchantId, SUM(c.commissionAmount) as totalCommission, COUNT(DISTINCT c.orderId) as orderCount "
                     +
                     "FROM CommissionRecord c " +
                     "WHERE c.createdAt BETWEEN :startTime AND :endTime " +
                     "GROUP BY c.merchantId " +
                     "ORDER BY totalCommission DESC")
       List<Object[]> findTopMerchantsByCommissionInRange(
                     @Param("startTime") LocalDateTime startTime,
                     @Param("endTime") LocalDateTime endTime,
                     Pageable pageable);

       /**
        * 分页查询所有分成记录（管理员用）
        */
       Page<CommissionRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);

       /**
        * 按状态分页查询分成记录
        */
       Page<CommissionRecord> findByStatusOrderByCreatedAtDesc(CommissionStatus status, Pageable pageable);

       /**
        * 按时间范围统计佣金数据（用于趋势分析）
        */
       @Query("SELECT COALESCE(SUM(c.commissionAmount), 0), COUNT(c), COUNT(DISTINCT c.merchantId) " +
                     "FROM CommissionRecord c " +
                     "WHERE c.createdAt >= :startTime AND c.createdAt < :endTime")
       Object[] getCommissionStatsByDateRange(
                     @Param("startTime") LocalDateTime startTime,
                     @Param("endTime") LocalDateTime endTime);
}
