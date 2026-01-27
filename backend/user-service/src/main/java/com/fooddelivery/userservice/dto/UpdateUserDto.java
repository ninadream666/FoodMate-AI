package com.fooddelivery.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserDto {
    private String nickname;
    private String avatarUrl;
    private String phone;
    private String email;
}