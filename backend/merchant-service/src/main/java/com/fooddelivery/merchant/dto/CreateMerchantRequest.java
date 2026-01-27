package com.fooddelivery.merchant.dto;

import lombok.Data;

@Data
public class CreateMerchantRequest {
    private String name;
    private String address;
}