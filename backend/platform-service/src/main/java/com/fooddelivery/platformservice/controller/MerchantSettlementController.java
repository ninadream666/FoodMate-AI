package com.fooddelivery.platformservice.controller;

import com.fooddelivery.platformservice.dto.*;
import com.fooddelivery.platformservice.entity.SettlementStatus;
import com.fooddelivery.platformservice.filter.JwtAuthenticationFilter.AuthenticatedUser;
import com.fooddelivery.platformservice.service.SettlementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/merchant/settlements")
@RequiredArgsConstructor
@Tag(name = "商家端-结算单", description = "商家查看和确认结算单")
public class MerchantSettlementController {

    private final SettlementService settlementService;

    @GetMapping
    @Operation(summary = "获取结算单列表", description = "分页获取商家的结算单")
    public ResponseEntity<Page<MerchantSettlementDTO>> getSettlements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) SettlementStatus status,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Pageable pageable = PageRequest.of(page, size);
        Page<MerchantSettlementDTO> settlements;

        if (status != null) {
            settlements = settlementService.getMerchantSettlementsByStatus(user.merchantId(), status, pageable);
        } else {
            settlements = settlementService.getMerchantSettlements(user.merchantId(), pageable);
        }

        return ResponseEntity.ok(settlements);
    }

    @GetMapping("/{settlementId}")
    @Operation(summary = "获取结算单详情", description = "包含按服务分组的分成明细")
    public ResponseEntity<MerchantSettlementDTO> getSettlementDetail(
            @PathVariable Long settlementId,
            @AuthenticationPrincipal AuthenticatedUser user) {

        MerchantSettlementDTO settlement = settlementService.getSettlementDetail(settlementId, user.merchantId());
        return ResponseEntity.ok(settlement);
    }

    @GetMapping("/{settlementId}/commissions")
    @Operation(summary = "获取结算单内的分成记录", description = "分页获取结算单关联的分成明细")
    public ResponseEntity<Page<CommissionRecordDTO>> getSettlementCommissions(
            @PathVariable Long settlementId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Pageable pageable = PageRequest.of(page, size);
        Page<CommissionRecordDTO> records = settlementService.getSettlementCommissions(
                settlementId, user.merchantId(), pageable);
        return ResponseEntity.ok(records);
    }

    @PostMapping("/{settlementId}/confirm")
    @Operation(summary = "确认结算单")
    public ResponseEntity<MerchantSettlementDTO> confirmSettlement(
            @PathVariable Long settlementId,
            @AuthenticationPrincipal AuthenticatedUser user) {

        MerchantSettlementDTO settlement = settlementService.confirmSettlement(settlementId, user.merchantId());
        return ResponseEntity.ok(settlement);
    }

    @PostMapping("/{settlementId}/dispute")
    @Operation(summary = "提交异议", description = "对结算单有异议，提交后请联系客服处理")
    public ResponseEntity<MerchantSettlementDTO> disputeSettlement(
            @PathVariable Long settlementId,
            @Valid @RequestBody DisputeSettlementRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        MerchantSettlementDTO settlement = settlementService.disputeSettlement(
                settlementId, user.merchantId(), request);
        return ResponseEntity.ok(settlement);
    }

    @GetMapping("/pending-count")
    @Operation(summary = "获取待确认结算单数量")
    public ResponseEntity<Long> getPendingCount(@AuthenticationPrincipal AuthenticatedUser user) {
        Page<MerchantSettlementDTO> pending = settlementService.getMerchantSettlementsByStatus(
                user.merchantId(), SettlementStatus.PENDING_CONFIRM, PageRequest.of(0, 1));
        return ResponseEntity.ok(pending.getTotalElements());
    }
}
