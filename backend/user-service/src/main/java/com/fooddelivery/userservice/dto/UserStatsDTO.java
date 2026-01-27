package com.fooddelivery.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDTO {
    private Long totalCount;
    private Long todayNewCount;
    private Long activeCount;
    private Double growthRate;
    private Map<String, Long> roleDistribution;
    private Map<String, Long> creditDistribution;
}
