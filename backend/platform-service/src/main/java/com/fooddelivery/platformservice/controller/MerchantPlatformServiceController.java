package com.fooddelivery.platformservice.controller;

import com.fooddelivery.platformservice.dto.*;
import com.fooddelivery.platformservice.entity.ServiceCategory;
import com.fooddelivery.platformservice.filter.JwtAuthenticationFilter.AuthenticatedUser;
import com.fooddelivery.platformservice.service.PlatformServiceService;
import com.fooddelivery.platformservice.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/merchant/platform-services")
@RequiredArgsConstructor
@Tag(name = "商家端-平台服务", description = "商家查看和订阅平台服务")
public class MerchantPlatformServiceController {

    private final PlatformServiceService platformServiceService;
    private final SubscriptionService subscriptionService;

    @GetMapping
    @Operation(summary = "获取所有可用服务", description = "获取平台提供的所有服务列表，含订阅状态")
    public ResponseEntity<List<PlatformServiceDTO>> getAvailableServices(
            @RequestParam(required = false) Long merchantId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        Long effectiveMerchantId = merchantId != null ? merchantId : user.merchantId();
        List<PlatformServiceDTO> services = platformServiceService.getActiveServices(effectiveMerchantId);
        return ResponseEntity.ok(services);
    }

    @GetMapping("/grouped")
    @Operation(summary = "按类别分组获取服务", description = "返回按类别分组的服务列表")
    public ResponseEntity<Map<String, List<PlatformServiceDTO>>> getServicesGroupedByCategory(
            @AuthenticationPrincipal AuthenticatedUser user) {
        List<PlatformServiceDTO> services = platformServiceService.getActiveServices(user.merchantId());

        Map<String, List<PlatformServiceDTO>> grouped = services.stream()
                .collect(Collectors.groupingBy(s -> s.getCategoryName()));

        return ResponseEntity.ok(grouped);
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "按类别获取服务")
    public ResponseEntity<List<PlatformServiceDTO>> getServicesByCategory(
            @PathVariable ServiceCategory category,
            @AuthenticationPrincipal AuthenticatedUser user) {
        List<PlatformServiceDTO> services = platformServiceService
                .getServicesByCategory(category, user.merchantId());
        return ResponseEntity.ok(services);
    }

    @GetMapping("/optional")
    @Operation(summary = "获取可选服务", description = "获取非强制的可选订阅服务")
    public ResponseEntity<List<PlatformServiceDTO>> getOptionalServices(
            @AuthenticationPrincipal AuthenticatedUser user) {
        List<PlatformServiceDTO> services = platformServiceService.getOptionalServices(user.merchantId());
        return ResponseEntity.ok(services);
    }

    @GetMapping("/{serviceId}")
    @Operation(summary = "获取服务详情")
    public ResponseEntity<PlatformServiceDTO> getServiceDetail(
            @PathVariable Long serviceId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        PlatformServiceDTO service = platformServiceService.getServiceById(serviceId, user.merchantId());
        return ResponseEntity.ok(service);
    }

    // ==================== 订阅管理 ====================

    @GetMapping("/subscriptions")
    @Operation(summary = "获取我的订阅列表")
    public ResponseEntity<List<SubscriptionDTO>> getMySubscriptions(
            @RequestParam(required = false) Long merchantId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        Long effectiveMerchantId = merchantId != null ? merchantId : user.merchantId();
        List<SubscriptionDTO> subscriptions = subscriptionService.getActiveSubscriptions(effectiveMerchantId);
        return ResponseEntity.ok(subscriptions);
    }

    @GetMapping("/subscriptions/all")
    @Operation(summary = "获取全部订阅历史", description = "包括已取消和已过期的")
    public ResponseEntity<List<SubscriptionDTO>> getAllSubscriptions(
            @RequestParam(required = false) Long merchantId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        Long effectiveMerchantId = merchantId != null ? merchantId : user.merchantId();
        List<SubscriptionDTO> subscriptions = subscriptionService.getMerchantSubscriptions(effectiveMerchantId);
        return ResponseEntity.ok(subscriptions);
    }

    @PostMapping("/subscriptions")
    @Operation(summary = "订阅服务")
    public ResponseEntity<SubscriptionDTO> subscribeService(
            @Valid @RequestBody SubscribeServiceRequest request,
            @RequestParam(required = false) Long merchantId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        Long effectiveMerchantId = merchantId != null ? merchantId : user.merchantId();
        SubscriptionDTO subscription = subscriptionService.subscribeService(effectiveMerchantId, request);
        return ResponseEntity.ok(subscription);
    }

    @DeleteMapping("/subscriptions/{subscriptionId}")
    @Operation(summary = "取消订阅")
    public ResponseEntity<Void> cancelSubscription(
            @PathVariable Long subscriptionId,
            @RequestBody(required = false) CancelSubscriptionRequest request,
            @RequestParam(required = false) Long merchantId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        Long effectiveMerchantId = merchantId != null ? merchantId : user.merchantId();
        subscriptionService.cancelSubscription(effectiveMerchantId, subscriptionId, request);
        return ResponseEntity.noContent().build();
    }
}
