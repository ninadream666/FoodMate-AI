package com.fooddelivery.merchant.repository;

import com.fooddelivery.merchant.entity.PriceChangeProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PriceChangeProposalRepository extends JpaRepository<PriceChangeProposal, Long> {
    List<PriceChangeProposal> findByMerchantIdAndStatus(Long merchantId, String status);
    
    // 查询商家所有提案，按时间倒序
    List<PriceChangeProposal> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);
}