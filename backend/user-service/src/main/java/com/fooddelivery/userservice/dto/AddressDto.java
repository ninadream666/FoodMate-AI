package com.fooddelivery.userservice.dto;

import lombok.Data;

@Data
public class AddressDto {
    private Long id;
    private String city;
    private String street;
    private String detail;
    private Boolean isDefault;
}