package com.fooddelivery.platformservice.controller;

import com.fooddelivery.platformservice.dto.DashboardOverviewDTO;
import com.fooddelivery.platformservice.dto.SystemHealthDTO;
import com.fooddelivery.platformservice.dto.PlatformStatsDTO;
import com.fooddelivery.platformservice.dto.CommissionRecordDTO;
import com.fooddelivery.platformservice.service.DashboardService;
import com.fooddelivery.platformservice.service.CommissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "管理员端-仪表盘", description = "平台管理仪表盘数据")
public class AdminDashboardController {

    private final DashboardService dashboardService;
    private final CommissionService commissionService;

    @GetMapping("/dashboard/overview")
    @Operation(summary = "获取仪表盘概览数据", description = "包含订单、用户、商家、收入等核心统计")
    public ResponseEntity<DashboardOverviewDTO> getDashboardOverview() {
        DashboardOverviewDTO overview = dashboardService.getDashboardOverview();
        return ResponseEntity.ok(overview);
    }

    @GetMapping("/notifications")
    @Operation(summary = "获取系统通知", description = "获取待处理的系统通知列表")
    public ResponseEntity<List<Map<String, Object>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Map<String, Object>> notifications = dashboardService.getNotifications(page, size);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/platform/stats")
    @Operation(summary = "获取平台统计数据", description = "详细的平台运营统计")
    public ResponseEntity<PlatformStatsDTO> getPlatformStats() {
        PlatformStatsDTO stats = dashboardService.getPlatformStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/system/health")
    @Operation(summary = "系统健康检查", description = "检查所有微服务的健康状态")
    public ResponseEntity<SystemHealthDTO> getSystemHealth() {
        SystemHealthDTO health = dashboardService.getSystemHealth();
        return ResponseEntity.ok(health);
    }

    @GetMapping("/system/metrics")
    @Operation(summary = "系统指标", description = "获取系统性能指标")
    public ResponseEntity<Map<String, Object>> getSystemMetrics() {
        Map<String, Object> metrics = dashboardService.getSystemMetrics();
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/commissions")
    @Operation(summary = "获取分成记录列表", description = "分页查询所有分成记录，支持按状态筛选")
    public ResponseEntity<Page<CommissionRecordDTO>> getCommissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CommissionRecordDTO> commissions = commissionService.getAllCommissions(pageable, status);
        return ResponseEntity.ok(commissions);
    }
}
