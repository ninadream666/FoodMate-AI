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

        // 如果前端指定了角色，检查是否与数据库一致（可选验证）
        String requestedRole = request.getRole();
        if (requestedRole != null && !requestedRole.isEmpty() && !requestedRole.equals(user.getRole())) {
            throw new RuntimeException("Role mismatch! You are registered as " + user.getRole());
        }

        // 生成Token，包含role信息
        String token = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole());

        // 返回完整的用户信息
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .build();
    }
}