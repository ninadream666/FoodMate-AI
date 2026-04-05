package com.fooddelivery.merchant.dto;

import lombok.Data;

@Data
public class MerchantDto {
    private Long id;
    private String externalId;  // 外部ID（智能体/地图API）
    private Long ownerUserId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String imageUrl;
    private Double rating;
    private String cuisineType;
    private String phone;
    private String description;
    private String source;
    private Boolean enableDynamicPricing;
    private Boolean enableAutoApproval;
    private Double autoApprovalThreshold;
}