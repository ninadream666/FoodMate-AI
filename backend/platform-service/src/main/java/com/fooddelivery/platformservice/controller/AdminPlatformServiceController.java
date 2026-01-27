package com.fooddelivery.platformservice.controller;

import com.fooddelivery.platformservice.dto.*;
import com.fooddelivery.platformservice.service.CommissionScheduler;
import com.fooddelivery.platformservice.service.PlatformServiceService;
import com.fooddelivery.platformservice.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/platform-services")
@RequiredArgsConstructor
@Tag(name = "管理员端-平台服务管理", description = "平台服务的CRUD操作")
public class AdminPlatformServiceController {

    private final PlatformServiceService platformServiceService;
    private final SubscriptionService subscriptionService;
    private final CommissionScheduler commissionScheduler;

    @GetMapping
    @Operation(summary = "获取所有服务", description = "包括已下线的服务")
    public ResponseEntity<List<PlatformServiceDTO>> getAllServices() {
        List<PlatformServiceDTO> services = platformServiceService.getAllServices();
        return ResponseEntity.ok(services);
    }

    @PostMapping
    @Operation(summary = "创建服务")
    public ResponseEntity<PlatformServiceDTO> createService(
            @Valid @RequestBody CreatePlatformServiceRequest request) {
        PlatformServiceDTO service = platformServiceService.createService(request);
        return ResponseEntity.ok(service);
    }

    @PutMapping("/{serviceId}")
    @Operation(summary = "更新服务")
    public ResponseEntity<PlatformServiceDTO> updateService(
            @PathVariable Long serviceId,
            @Valid @RequestBody UpdatePlatformServiceRequest request) {
        PlatformServiceDTO service = platformServiceService.updateService(serviceId, request);
        return ResponseEntity.ok(service);
    }

    @PatchMapping("/{serviceId}/toggle-status")
    @Operation(summary = "上线/下线服务")
    public ResponseEntity<PlatformServiceDTO> toggleServiceStatus(@PathVariable Long serviceId) {
        PlatformServiceDTO service = platformServiceService.toggleServiceStatus(serviceId);
        return ResponseEntity.ok(service);
    }

    @GetMapping("/{serviceId}/subscriptions/count")
    @Operation(summary = "获取服务订阅数量")
    public ResponseEntity<Long> getSubscriptionCount(@PathVariable Long serviceId) {
        long count = platformServiceService.getSubscriptionCount(serviceId);
        return ResponseEntity.ok(count);
    }

    @PostMapping("/merchants/{merchantId}/init-mandatory")
    @Operation(summary = "为商家初始化强制订阅", description = "新商家入驻时调用")
    public ResponseEntity<Void> initMandatorySubscriptions(@PathVariable Long merchantId) {
        subscriptionService.initMandatorySubscriptions(merchantId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/commission/trigger")
    @Operation(summary = "手动触发分成计算", description = "测试用，手动触发分成计算定时任务")
    public ResponseEntity<String> triggerCommissionCalculation() {
        commissionScheduler.triggerManually();
        return ResponseEntity.ok("分成计算任务已触发");
    }
}
