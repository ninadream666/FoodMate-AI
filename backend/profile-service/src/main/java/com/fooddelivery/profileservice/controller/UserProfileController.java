package com.fooddelivery.profileservice.controller;

import com.fooddelivery.profileservice.entity.BrowseRecord;
import com.fooddelivery.profileservice.entity.UserProfile;
import com.fooddelivery.profileservice.service.UserProfileService;
import com.fooddelivery.profileservice.dto.UserContextDto;
import com.fooddelivery.profileservice.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService service;
    private final JwtUtil jwtUtil;
    
    // 聚合接口，供AI Agent调用
    @GetMapping("/context")
    public ResponseEntity<UserContextDto> getUserContext(@RequestHeader("Authorization") String authHeader) {
        String username = getCurrentUsername();
        
        // 解析Token获取UserId
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(service.getUserContext(userId, username));
    }

    // 获取我的完整画像
    @GetMapping
    public ResponseEntity<UserProfile> getMyProfile() {
        String username = getCurrentUsername();
        return ResponseEntity.ok(service.getOrCreateProfile(username));
    }

    // 更新/初始化我的画像
    @PostMapping
    public ResponseEntity<UserProfile> updateMyProfile(@RequestBody UserProfile profile) {
        String username = getCurrentUsername();
        return ResponseEntity.ok(service.updateProfile(username, profile));
    }

    // --- 收藏功能 ---
    // 添加收藏
    @PostMapping("/favorites/{merchantId}")
    public ResponseEntity<UserProfile> addFavorite(@PathVariable String merchantId) {
        String username = getCurrentUsername();
        UserProfile profile = service.getOrCreateProfile(username);
        
        if (!profile.getFavoriteMerchantIds().contains(merchantId)) {
            profile.getFavoriteMerchantIds().add(merchantId);
            service.updateProfile(username, profile); 
        }
        return ResponseEntity.ok(profile);
    }

    // 获取收藏列表
    @GetMapping("/favorites")
    public ResponseEntity<List<String>> getFavorites() {
        String username = getCurrentUsername();
        UserProfile profile = service.getOrCreateProfile(username);
        return ResponseEntity.ok(profile.getFavoriteMerchantIds());
    }

    // 取消收藏
    @DeleteMapping("/favorites/{merchantId}")
    public ResponseEntity<UserProfile> removeFavorite(@PathVariable String merchantId) {
        String username = getCurrentUsername();
        UserProfile profile = service.getOrCreateProfile(username);
        profile.getFavoriteMerchantIds().remove(merchantId);
        service.updateProfile(username, profile);
        return ResponseEntity.ok(profile);
    }

    // --- 浏览历史功能 ---
    // 记录浏览历史
    @PostMapping("/history")
    public ResponseEntity<Void> addBrowseHistory(@RequestBody BrowseRecord record) {
        String username = getCurrentUsername();
        UserProfile profile = service.getOrCreateProfile(username);
        
        // 生成唯一ID
        record.setRecordId(UUID.randomUUID().toString());
        record.setTimestamp(LocalDateTime.now());
        
        profile.getBrowseHistory().add(record);
        
        // 限制最近50条
        if (profile.getBrowseHistory().size() > 50) {
            profile.getBrowseHistory().remove(0);
        }
        
        service.updateProfile(username, profile);
        return ResponseEntity.ok().build();
    }

    // 获取浏览历史
    @GetMapping("/history")
    public ResponseEntity<List<BrowseRecord>> getBrowseHistory() {
        String username = getCurrentUsername();
        UserProfile profile = service.getOrCreateProfile(username);
        return ResponseEntity.ok(profile.getBrowseHistory());
    }

    // 删除单条历史
    @DeleteMapping("/history/{recordId}")
    public ResponseEntity<UserProfile> removeBrowseHistoryItem(@PathVariable String recordId) {
        String username = getCurrentUsername();
        UserProfile profile = service.getOrCreateProfile(username);
        
        // 精准删除：只删除ID匹配的那一条
        profile.getBrowseHistory().removeIf(record -> 
            record.getRecordId() != null && record.getRecordId().equals(recordId)
        );
        
        service.updateProfile(username, profile);
        return ResponseEntity.ok(profile);
    }

    // 清空浏览历史
    @DeleteMapping("/history")
    public ResponseEntity<UserProfile> clearBrowseHistory() {
        String username = getCurrentUsername();
        UserProfile profile = service.getOrCreateProfile(username);
        profile.getBrowseHistory().clear();
        service.updateProfile(username, profile);
        return ResponseEntity.ok(profile);
    }

    // --- 健康饮食记录 ---
    // 保存健康记录
    @PostMapping("/health-records")
    public ResponseEntity<?> addHealthRecord(@RequestBody java.util.Map<String, Object> record) {
        String username = getCurrentUsername();
        UserProfile profile = service.getOrCreateProfile(username);

        record.put("id", java.util.UUID.randomUUID().toString());
        record.put("createdAt", java.time.LocalDateTime.now().toString());

        profile.getHealthRecords().add(record);

        // 限制最多200条
        if (profile.getHealthRecords().size() > 200) {
            profile.getHealthRecords().remove(0);
        }

        service.updateProfile(username, profile);
        return ResponseEntity.ok(java.util.Map.of("success", true, "id", record.get("id")));
    }

    // 获取健康记录列表
    @GetMapping("/health-records")
    public ResponseEntity<?> getHealthRecords() {
        String username = getCurrentUsername();
        UserProfile profile = service.getOrCreateProfile(username);
        return ResponseEntity.ok(profile.getHealthRecords());
    }

    // 删除单条健康记录
    @DeleteMapping("/health-records/{recordId}")
    public ResponseEntity<?> deleteHealthRecord(@PathVariable String recordId) {
        String username = getCurrentUsername();
        UserProfile profile = service.getOrCreateProfile(username);
        profile.getHealthRecords().removeIf(r -> recordId.equals(r.get("id")));
        service.updateProfile(username, profile);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}