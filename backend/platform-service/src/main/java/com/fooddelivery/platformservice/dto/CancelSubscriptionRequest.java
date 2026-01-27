package com.fooddelivery.platformservice.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 取消订阅请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelSubscriptionRequest {

    @Size(max = 200, message = "取消原因最多200个字符")
    private String reason;
}
