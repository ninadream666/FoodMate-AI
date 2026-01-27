package com.fooddelivery.platformservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthDTO {

    private String overallStatus; // HEALTHY, DEGRADED, UNHEALTHY
    private Long timestamp;
    private List<ServiceHealth> services;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceHealth {
        private String serviceName;
        private String status; // UP, DOWN, UNKNOWN
        private String url;
        private Long responseTime; // 响应时间（毫秒）
        private String message;
    }
}
