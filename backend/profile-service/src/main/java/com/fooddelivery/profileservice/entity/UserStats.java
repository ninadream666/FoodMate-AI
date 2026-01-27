package com.fooddelivery.profileservice.entity;

import lombok.Data;

@Data
public class UserStats {
    private String spendingLevel; // e.g. "High", "Medium"
    private String activeHours;   // e.g. "LateNight"
    private String frequentAddressCity; // e.g. "New York"
    private int totalOrders;
}