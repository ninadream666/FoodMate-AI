package com.fooddelivery.platformservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 订阅服务请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscribeServiceRequest {

    @NotNull(message = "服务ID不能为空")
    private Long serviceId;
}
