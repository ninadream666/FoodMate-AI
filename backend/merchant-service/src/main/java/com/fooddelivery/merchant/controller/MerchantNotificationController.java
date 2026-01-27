package com.fooddelivery.merchant.controller;

import com.fooddelivery.merchant.entity.MerchantNotification;
import com.fooddelivery.merchant.repository.MerchantNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/merchants/{merchantId}/notifications")
@RequiredArgsConstructor
public class MerchantNotificationController {

    private final MerchantNotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<MerchantNotification>> getNotifications(@PathVariable Long merchantId) {
        return ResponseEntity.ok(notificationRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId));
    }
}