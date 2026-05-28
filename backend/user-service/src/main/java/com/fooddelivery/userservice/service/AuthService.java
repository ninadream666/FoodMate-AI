package com.fooddelivery.userservice.service;

import com.fooddelivery.userservice.dto.AuthRequest;
import com.fooddelivery.userservice.dto.AuthResponse;
import com.fooddelivery.userservice.entity.User;
import com.fooddelivery.userservice.repository.UserRepository;
import com.fooddelivery.userservice.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    // 注册
    public String register(AuthRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists!");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // 默认角色
        user.setRole(request.getRole() != null ? request.getRole() : "customer");

        userRepository.save(user);
        return "User registered successfully";
    }

    // 登录
    public AuthResponse login(AuthRequest request) {
        // 校验用户名密码
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        // 查出用户实体
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 一个账号支持多种身份：顾客、商家。前端指定 role 时直接使用，否则用 user 表里的默认 role
        // 商家身份允许通过关联的 merchants 表存在性自动获得，不再强制要求 user.role=merchant
        String requestedRole = request.getRole();
        String effectiveRole;
        if (requestedRole != null && !requestedRole.isEmpty()) {
            // 前端指定了角色，直接使用（不再做强校验）
            // 这样同一账号可以以 customer / merchant 多个身份登录
            effectiveRole = requestedRole;
        } else {
            effectiveRole = user.getRole();
        }

        // 生成 Token，role 字段反映本次登录的身份
        String token = jwtUtil.generateToken(user.getUsername(), user.getId(), effectiveRole);

        // 返回完整的用户信息
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .role(effectiveRole)
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .build();
    }
}