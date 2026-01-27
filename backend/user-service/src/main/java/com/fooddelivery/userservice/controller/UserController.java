package com.fooddelivery.userservice.controller;

import com.fooddelivery.userservice.dto.UpdateUserDto;
import com.fooddelivery.userservice.dto.UserResponseDto;
import com.fooddelivery.userservice.entity.User;
import com.fooddelivery.userservice.repository.UserRepository;
import com.fooddelivery.userservice.service.CreditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final CreditService creditService;

    // 获取我的完整信息
    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getCurrentUser() {
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 使用DTO转换，不直接暴露实体
        return ResponseEntity.ok(UserResponseDto.fromEntity(user));
    }

    // 更新我的信息
    @PutMapping("/me")
    public ResponseEntity<UserResponseDto> updateProfile(@RequestBody UpdateUserDto dto) {
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getNickname() != null)
            user.setNickname(dto.getNickname());
        if (dto.getPhone() != null)
            user.setPhone(dto.getPhone());
        if (dto.getAvatarUrl() != null)
            user.setAvatarUrl(dto.getAvatarUrl());
        if (dto.getEmail() != null)
            user.setEmail(dto.getEmail());

        User saved = userRepository.save(user);

        // 使用DTO返回
        return ResponseEntity.ok(UserResponseDto.fromEntity(saved));
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }

    // 获取用户信用信息
    @GetMapping("/{userId}/credit")
    public ResponseEntity<?> getUserCredit(@PathVariable Long userId) {
        return creditService.getUserCredit(userId);
    }

    // 内部接口：记录取消事件并更新信用等级
    @PostMapping("/{userId}/cancellations/record")
    public ResponseEntity<?> recordCancellation(
            @PathVariable Long userId,
            @RequestParam Long orderId) {
        try {
            creditService.recordCancellationAndUpdateCredit(userId, orderId);
            return ResponseEntity.ok(java.util.Map.of("message", "取消事件已记录"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // 内部接口：尝试升级信用等级
    @PostMapping("/{userId}/credit/upgrade")
    public ResponseEntity<?> tryUpgradeCredit(@PathVariable Long userId) {
        try {
            creditService.tryUpgradeCredit(userId);
            return ResponseEntity.ok(java.util.Map.of("message", "信用等级已更新"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }
}