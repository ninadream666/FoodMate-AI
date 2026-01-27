package com.fooddelivery.userservice.dto;

import lombok.Data;

@Data
public class UpdateUserStatusDTO {
    private String status; // ACTIVE, DISABLED, SUSPENDED
    private String reason;
}
