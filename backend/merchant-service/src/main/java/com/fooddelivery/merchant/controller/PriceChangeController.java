package com.fooddelivery.merchant.controller;

import com.fooddelivery.merchant.entity.PriceChangeProposal;
import com.fooddelivery.merchant.service.PriceProposalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
// 将 price-proposals 挂载在具体的 merchantId 下
@RequestMapping("/merchants/{merchantId}/price-proposals")
@RequiredArgsConstructor
public class PriceChangeController {

    private final PriceProposalService priceProposalService;

    // GET /merchants/{merchantId}/price-proposals/pending
    @GetMapping("/pending")
    public ResponseEntity<List<PriceChangeProposal>> getPendingProposals(@PathVariable Long merchantId) {
        return ResponseEntity.ok(priceProposalService.getPendingProposals(merchantId));
    }

    // GET /merchants/{merchantId}/price-proposals/history
    @GetMapping("/history")
    public ResponseEntity<List<PriceChangeProposal>> getProposalHistory(@PathVariable Long merchantId) {
        return ResponseEntity.ok(priceProposalService.getProposalHistory(merchantId));
    }

    // POST /merchants/{merchantId}/price-proposals/{proposalId}/approve
    @PostMapping("/{proposalId}/approve")
    public ResponseEntity<?> approveProposal(@PathVariable Long merchantId, @PathVariable Long proposalId) {
        // 这里虽然方法里没用到 merchantId，但路径上带上它可以确保通过 Security 校验
        priceProposalService.approveProposal(proposalId);
        return ResponseEntity.ok(Map.of("message", "Proposal approved and price updated"));
    }

    // POST /merchants/{merchantId}/price-proposals/{proposalId}/reject
    @PostMapping("/{proposalId}/reject")
    public ResponseEntity<?> rejectProposal(@PathVariable Long merchantId, @PathVariable Long proposalId) {
        priceProposalService.rejectProposal(proposalId);
        return ResponseEntity.ok(Map.of("message", "Proposal rejected"));
    }
}