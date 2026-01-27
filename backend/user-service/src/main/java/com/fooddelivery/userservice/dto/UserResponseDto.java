package com.fooddelivery.userservice.dto;

import com.fooddelivery.userservice.entity.User;
import lombok.Data;

@Data
public class UserResponseDto {
    private Long id;
    private String username;
    private String email;
    private String nickname;
    private String avatarUrl;
    private String phone;

    // 从Entity转换为DTO
    public static UserResponseDto fromEntity(User user) {
        UserResponseDto dto = new UserResponseDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setNickname(user.getNickname());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setPhone(user.getPhone());
        return dto;
    }
}