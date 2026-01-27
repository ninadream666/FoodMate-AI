package com.fooddelivery.merchant.service;

import com.fooddelivery.merchant.dto.UpdateMenuItemRequest;
import com.fooddelivery.merchant.entity.PriceChangeProposal;
import com.fooddelivery.merchant.repository.PriceChangeProposalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PriceProposalService {

    private final PriceChangeProposalRepository repository;
    private final MenuService menuService;

    // 获取商家的待审批提案
    public List<PriceChangeProposal> getPendingProposals(Long merchantId) {
        return repository.findByMerchantIdAndStatus(merchantId, "PENDING");
    }

    // 获取商家的所有提案历史 (包括自动审批、已批准、已拒绝)
    public List<PriceChangeProposal> getProposalHistory(Long merchantId) {
        return repository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
    }

    // 批准提案
    @Transactional
    public void approveProposal(Long proposalId) {
        PriceChangeProposal proposal = repository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        if (!"PENDING".equals(proposal.getStatus())) {
            throw new RuntimeException("Proposal is not in PENDING status");
        }

        // 调用 MenuService 更新真实价格
        UpdateMenuItemRequest request = new UpdateMenuItemRequest();
        request.setPrice(proposal.getSuggestedPrice());
        menuService.updateMenuItem(proposal.getMenuItemId(), request);

        // 更新提案状态
        proposal.setStatus("APPROVED");
        proposal.setHandledAt(LocalDateTime.now());
        repository.save(proposal);
    }

    // 拒绝提案
    @Transactional
    public void rejectProposal(Long proposalId) {
        PriceChangeProposal proposal = repository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        if (!"PENDING".equals(proposal.getStatus())) {
            throw new RuntimeException("Proposal is not in PENDING status");
        }

        proposal.setStatus("REJECTED");
        proposal.setHandledAt(LocalDateTime.now());
        repository.save(proposal);
    }
}