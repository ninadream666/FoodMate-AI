package com.fooddelivery.platformservice.controller;

import com.fooddelivery.platformservice.dto.*;
import com.fooddelivery.platformservice.entity.SettlementStatus;
import com.fooddelivery.platformservice.entity.SettlementType;
import com.fooddelivery.platformservice.service.SettlementScheduler;
import com.fooddelivery.platformservice.service.SettlementService;
import com.fooddelivery.platformservice.service.SettlementStatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settlements")
@RequiredArgsConstructor
@Tag(name = "管理员端-结算单管理", description = "结算单生成、调整、打款")
public class AdminSettlementController {

    private final SettlementService settlementService;
    private final SettlementStatisticsService settlementStatisticsService;
    private final SettlementScheduler settlementScheduler;

    @GetMapping
    @Operation(summary = "获取所有结算单", description = "支持按状态筛选")
    public ResponseEntity<Page<MerchantSettlementDTO>> getAllSettlements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) SettlementStatus status) {

        Pageable pageable = PageRequest.of(page, size);
        Page<MerchantSettlementDTO> settlements;

        if (status != null) {
            settlements = settlementService.getSettlementsByStatus(status, pageable);
        } else {
            settlements = settlementService.getAllSettlements(pageable);
        }

        return ResponseEntity.ok(settlements);
    }

    @GetMapping("/stats")
    @Operation(summary = "获取分成管理统计概览")
    public ResponseEntity<SettlementStatsDTO> getSettlementStats() {
        SettlementStatsDTO stats = settlementStatisticsService.getSettlementStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/trend")
    @Operation(summary = "获取分成趋势分析")
    public ResponseEntity<List<SettlementTrendDTO>> getSettlementTrend(
            @RequestParam(defaultValue = "month") String period) {
        List<SettlementTrendDTO> trends = settlementStatisticsService.getSettlementTrend(period);
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/{settlementId}")
    @Operation(summary = "获取结算单详情")
    public ResponseEntity<MerchantSettlementDTO> getSettlementDetail(@PathVariable Long settlementId) {
        MerchantSettlementDTO settlement = settlementService.getSettlementDetail(settlementId, null);
        return ResponseEntity.ok(settlement);
    }

    @GetMapping("/{settlementId}/commissions")
    @Operation(summary = "获取结算单内的分成记录")
    public ResponseEntity<Page<CommissionRecordDTO>> getSettlementCommissions(
            @PathVariable Long settlementId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<CommissionRecordDTO> records = settlementService.getSettlementCommissions(settlementId, null, pageable);
        return ResponseEntity.ok(records);
    }

    @PostMapping("/generate")
    @Operation(summary = "生成结算单", description = "手动触发生成结算单，可指定类型和周期")
    public ResponseEntity<List<MerchantSettlementDTO>> generateSettlements(
            @Valid @RequestBody GenerateSettlementRequest request) {

        List<MerchantSettlementDTO> settlements = settlementService.generateSettlements(request);
        return ResponseEntity.ok(settlements);
    }

    @PostMapping("/{settlementId}/adjust")
    @Operation(summary = "调整结算单金额")
    public ResponseEntity<MerchantSettlementDTO> adjustSettlement(
            @PathVariable Long settlementId,
            @Valid @RequestBody AdjustSettlementRequest request) {

        MerchantSettlementDTO settlement = settlementService.adjustSettlement(settlementId, request);
        return ResponseEntity.ok(settlement);
    }

    @PostMapping("/batch-pay")
    @Operation(summary = "批量标记已打款")
    public ResponseEntity<Map<String, Integer>> batchMarkAsPaid(@Valid @RequestBody BatchPayRequest request) {
        int count = settlementService.batchMarkAsPaid(request);
        return ResponseEntity.ok(Map.of("updatedCount", count));
    }

    @PostMapping("/{settlementId}/cancel")
    @Operation(summary = "作废结算单")
    public ResponseEntity<Void> cancelSettlement(@PathVariable Long settlementId) {
        settlementService.cancelSettlement(settlementId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/top-merchants")
    @Operation(summary = "获取佣金贡献TOP商家", description = "返回平台佣金收入最高的商家列表")
    public ResponseEntity<Map<String, Object>> getTopCommissionMerchants(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String period) {
        Map<String, Object> result = settlementService.getTopCommissionMerchants(limit, period);
        return ResponseEntity.ok(result);
    }

    // ==================== 测试/调试接口 ====================

    @PostMapping("/trigger/monthly")
    @Operation(summary = "手动触发月结算", description = "测试用，手动触发生成上月结算单")
    public ResponseEntity<String> triggerMonthlySettlement() {
        settlementScheduler.triggerSettlementGeneration(SettlementType.MONTHLY);
        return ResponseEntity.ok("月结算任务已触发");
    }

    @PostMapping("/trigger/weekly")
    @Operation(summary = "手动触发周结算", description = "测试用，手动触发生成上周结算单")
    public ResponseEntity<String> triggerWeeklySettlement() {
        settlementScheduler.triggerSettlementGeneration(SettlementType.WEEKLY);
        return ResponseEntity.ok("周结算任务已触发");
    }

    @PostMapping("/trigger/auto-confirm")
    @Operation(summary = "手动触发自动确认", description = "测试用，手动触发确认超时的结算单")
    public ResponseEntity<String> triggerAutoConfirm() {
        settlementScheduler.triggerAutoConfirm();
        return ResponseEntity.ok("自动确认任务已触发");
    }
}
