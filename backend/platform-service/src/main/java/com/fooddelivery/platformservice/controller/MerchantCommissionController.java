package com.fooddelivery.platformservice.controller;

import com.fooddelivery.platformservice.dto.CommissionRecordDTO;
import com.fooddelivery.platformservice.dto.CommissionSummaryDTO;
import com.fooddelivery.platformservice.entity.CommissionStatus;
import com.fooddelivery.platformservice.filter.JwtAuthenticationFilter.AuthenticatedUser;
import com.fooddelivery.platformservice.service.CommissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/merchant/commissions")
@RequiredArgsConstructor
@Tag(name = "商家端-分成查询", description = "商家查看分成记录和统计")
public class MerchantCommissionController {

    private final CommissionService commissionService;

    @GetMapping
    @Operation(summary = "获取分成记录列表", description = "分页获取分成记录")
    public ResponseEntity<Page<CommissionRecordDTO>> getCommissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) CommissionStatus status,
            @RequestParam(required = false) Long merchantId,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Long effectiveMerchantId = merchantId != null ? merchantId : user.merchantId();
        Pageable pageable = PageRequest.of(page, size);
        Page<CommissionRecordDTO> records;

        if (status != null) {
            records = commissionService.getMerchantCommissionsByStatus(effectiveMerchantId, status, pageable);
        } else {
            records = commissionService.getMerchantCommissions(effectiveMerchantId, pageable);
        }

        return ResponseEntity.ok(records);
    }

    @GetMapping("/summary")
    @Operation(summary = "获取分成汇总", description = "获取指定时间范围内的分成统计")
    public ResponseEntity<CommissionSummaryDTO> getCommissionSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @AuthenticationPrincipal AuthenticatedUser user) {

        CommissionSummaryDTO summary = commissionService
                .getMerchantCommissionSummary(user.merchantId(), startTime, endTime);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/summary/today")
    @Operation(summary = "获取今日分成汇总")
    public ResponseEntity<CommissionSummaryDTO> getTodaySummary(
            @RequestParam(required = false) Long merchantId,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Long effectiveMerchantId = merchantId != null ? merchantId : user.merchantId();
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        CommissionSummaryDTO summary = commissionService
                .getMerchantCommissionSummary(effectiveMerchantId, startOfDay, endOfDay);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/summary/this-month")
    @Operation(summary = "获取本月分成汇总")
    public ResponseEntity<CommissionSummaryDTO> getThisMonthSummary(
            @RequestParam(required = false) Long merchantId,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Long effectiveMerchantId = merchantId != null ? merchantId : user.merchantId();
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1)
                .withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        CommissionSummaryDTO summary = commissionService
                .getMerchantCommissionSummary(effectiveMerchantId, startOfMonth, endOfMonth);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "获取订单分成详情", description = "查看某笔订单的分成明细")
    public ResponseEntity<?> getOrderCommissions(
            @PathVariable Long orderId,
            @AuthenticationPrincipal AuthenticatedUser user) {

        var records = commissionService.getOrderCommissions(orderId);

        // 验证订单是否属于当前商家
        if (!records.isEmpty() && !records.get(0).getMerchantId().equals(user.merchantId())) {
            return ResponseEntity.status(403).body("无权查看此订单的分成");
        }

        return ResponseEntity.ok(records);
    }
}
