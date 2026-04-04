package com.fooddelivery.merchant.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_change_proposals")
@Data
public class PriceChangeProposal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long merchantId;
    private Long menuItemId;

    // 提案来自AI的哪个proposal ID
    private Long externalProposalId;

    private BigDecimal currentPrice;
    private BigDecimal suggestedPrice;
    
    private String reason; // AI给出的理由
    
    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED, AUTO_APPLIED

    private LocalDateTime createdAt;
    private LocalDateTime handledAt; // 审批时间

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}