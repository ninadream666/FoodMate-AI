package com.fooddelivery.profileservice.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "user_profiles")
public class UserProfile {

    @Id
    private String id; // MongoDB自动生成的ObjectId

    @Indexed(unique = true)
    private String username; // 关联User Service的用户名

    // 存储口味偏好
    // example: "spicy": "high", "cuisine": "sichuan"
    private Map<String, String> preferences;

    // AI推断出的标签
    private List<String> tags;
    
    // 忌口
    private List<String> allergies;

    // 收藏的商家ID列表（支持数字ID和字符串外部ID）
    private List<String> favoriteMerchantIds = new ArrayList<>();

    // 浏览历史（内嵌对象列表）
    private List<BrowseRecord> browseHistory = new ArrayList<>();

    // 健康饮食记录
    private List<Map<String, Object>> healthRecords = new ArrayList<>();

    // 用户统计/画像数据
    private UserStats stats;
}