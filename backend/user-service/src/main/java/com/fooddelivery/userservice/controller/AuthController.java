package com.fooddelivery.userservice.controller;

import com.fooddelivery.userservice.dto.AuthRequest;
import com.fooddelivery.userservice.dto.AuthResponse;
import com.fooddelivery.userservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
// 加上 /api 前缀，与前端保持一致
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        log.info("登录请求: username={}", request.getUsername());
        try {
            AuthResponse response = authService.login(request);
            log.info("登录成功: username={}, role={}", response.getUsername(), response.getRole());
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            log.warn("登录失败 - 密码错误: username={}", request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "用户名或密码错误"));
        } catch (Exception e) {
            log.error("登录失败: username={}, error={}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}