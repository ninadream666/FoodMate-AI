package com.fooddelivery.userservice.controller;

import com.fooddelivery.userservice.dto.UserResponseDto;
import com.fooddelivery.userservice.dto.UserStatsDTO;
import com.fooddelivery.userservice.dto.UpdateUserStatusDTO;
import com.fooddelivery.userservice.entity.User;
import com.fooddelivery.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    /**
     * 检查当前用户是否是管理员
     */
    private void checkAdminRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_admin"))) {
            throw new RuntimeException("Forbidden: Admin access required");
        }
    }

    /**
     * 获取用户列表（分页）
     */
    @GetMapping
    public ResponseEntity<Page<UserResponseDto>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<User> users;

        if (role != null && !role.isEmpty()) {
            users = userRepository.findByRole(role, pageRequest);
        } else if (search != null && !search.isEmpty()) {
            users = userRepository.findByUsernameContainingOrNicknameContaining(search, search, pageRequest);
        } else {
            users = userRepository.findAll(pageRequest);
        }

        Page<UserResponseDto> dtoPage = users.map(UserResponseDto::fromEntity);
        return ResponseEntity.ok(dtoPage);
    }

    /**
     * 获取用户统计数据
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        long totalCount = userRepository.count();
        long customerCount = userRepository.countByRole("customer");
        long merchantCount = userRepository.countByRole("merchant");
        long adminCount = userRepository.countByRole("admin");

        // 今日新增
        long todayNewCount = 0L;
        long activeCount = totalCount;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCount", totalCount);
        stats.put("todayNewCount", todayNewCount);
        stats.put("activeCount", activeCount);
        stats.put("growthRate", 0.0);
        stats.put("customerCount", customerCount);
        stats.put("merchantCount", merchantCount);
        stats.put("adminCount", adminCount);

        return ResponseEntity.ok(stats);
    }

    /**
     * 获取用户总数
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUserCount() {
        long count = userRepository.count();
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * 获取用户详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(UserResponseDto.fromEntity(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 修改用户状态（启用/禁用）
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponseDto> updateUserStatus(
            @PathVariable Long id,
            @RequestBody UpdateUserStatusDTO dto) {
        return userRepository.findById(id)
                .map(user -> {
                    User saved = userRepository.save(user);
                    return ResponseEntity.ok(UserResponseDto.fromEntity(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 调整用户信用等级
     */
    @PatchMapping("/{id}/credit")
    public ResponseEntity<UserResponseDto> updateUserCredit(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {
        return userRepository.findById(id)
                .map(user -> {
                    Integer creditLevel = body.get("creditLevel");
                    if (creditLevel != null) {
                        user.setCreditLevel(creditLevel);
                    }
                    User saved = userRepository.save(user);
                    return ResponseEntity.ok(UserResponseDto.fromEntity(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 获取用户活动日志
     */
    @GetMapping("/{id}/activity")
    public ResponseEntity<Map<String, Object>> getUserActivity(@PathVariable Long id) {
        // 返回基本信息
        return userRepository.findById(id)
                .map(user -> {
                    Map<String, Object> activity = new HashMap<>();
                    activity.put("userId", user.getId());
                    activity.put("username", user.getUsername());
                    activity.put("lastLevelChangeAt", user.getLastLevelChangeAt());
                    activity.put("recentCancellations", user.getRecentCancellations());
                    return ResponseEntity.ok(activity);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
