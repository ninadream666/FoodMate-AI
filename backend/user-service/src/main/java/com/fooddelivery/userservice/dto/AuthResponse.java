package com.fooddelivery.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String username;
    private String email;
    private String nickname;
    private String role;
    private String avatarUrl;
    private String phone;
}