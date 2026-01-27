package com.fooddelivery.profileservice.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrowseRecord {
    private String recordId;
    private Long merchantId;
    private String merchantName; // 冗余存一个名字，方便前端展示
    private LocalDateTime timestamp;
}