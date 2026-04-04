package com.fooddelivery.merchant.dto;

import lombok.Data;

/**
 * 真实餐厅 DTO - 用于导入智能体/地图API返回的餐厅数据
 */
@Data
public class RealRestaurantDTO {
    
    // 外部ID，如B0LDM1F2K5（来自智能体/地图API）
    private String externalId;
    
    // 餐厅名称
    private String name;
    
    // 地址
    private String address;
    
    // 纬度
    private Double latitude;
    
    // 经度
    private Double longitude;
    
    // 图片URL
    private String imageUrl;
    
    // 评分（0-5）
    private Double rating;
    
    // 菜系类型
    private String cuisineType;
    
    // 电话
    private String phone;
    
    // 描述
    private String description;
}
