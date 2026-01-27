package com.fooddelivery.profileservice.dto;

import com.fooddelivery.profileservice.entity.UserProfile;
import lombok.Data;
import java.util.List;

@Data
public class UserContextDto {
    // 静态画像
    private UserProfile profile;
    
    // 动态订单历史 (如果服务不可用，可能为空)
    private List<OrderDto> recentOrders;
}