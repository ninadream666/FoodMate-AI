package com.fooddelivery.userservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserCreditDto {
    private Long userId;
    private Integer creditLevel;       // 1-5，5为最高
    private Integer recentCancellations; // 7天内取消次数
    private LocalDateTime lastLevelChangeAt;
}
