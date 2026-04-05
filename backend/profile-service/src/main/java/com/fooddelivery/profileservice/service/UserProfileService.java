package com.fooddelivery.profileservice.service;

import com.fooddelivery.profileservice.entity.UserProfile;
import com.fooddelivery.profileservice.repository.UserProfileRepository;
import com.fooddelivery.profileservice.dto.UserContextDto;
import com.fooddelivery.profileservice.dto.OrderDto;
import com.fooddelivery.profileservice.client.OrderClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository repository;
    private final OrderClient orderClient;

    // 获取画像，没有则新建
    public UserProfile getOrCreateProfile(String username) {
        return repository.findByUsername(username)
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile();
                    newProfile.setUsername(username);
                    return repository.save(newProfile);
                });
    }

    // 更新画像
    public UserProfile updateProfile(String username, UserProfile updatedProfile) {
        UserProfile existing = getOrCreateProfile(username);
        
        // 更新偏好/标签/忌口
        if (updatedProfile.getPreferences() != null) {
            existing.setPreferences(updatedProfile.getPreferences());
        }
        if (updatedProfile.getAllergies() != null) {
            existing.setAllergies(updatedProfile.getAllergies());
        }
        if (updatedProfile.getTags() != null) {
            existing.setTags(updatedProfile.getTags());
        }

        // 更新收藏和历史
        if (updatedProfile.getFavoriteMerchantIds() != null) {
            existing.setFavoriteMerchantIds(updatedProfile.getFavoriteMerchantIds());
        }
        if (updatedProfile.getBrowseHistory() != null) {
            existing.setBrowseHistory(updatedProfile.getBrowseHistory());
        }
        if (updatedProfile.getStats() != null) {
            existing.setStats(updatedProfile.getStats());
        }

        // 更新健康饮食记录
        if (updatedProfile.getHealthRecords() != null) {
            existing.setHealthRecords(updatedProfile.getHealthRecords());
        }

        return repository.save(existing);
    }

    // 聚合查询：画像+订单历史
    public UserContextDto getUserContext(Long userId, String username) {
        UserContextDto context = new UserContextDto();

        // 获取静态画像
        UserProfile profile = getOrCreateProfile(username);
        context.setProfile(profile);

        // 获取订单历史
        try {
            // 调用Feign接口，FeignConfig会自动加上Authorization头
            List<OrderDto> orders = orderClient.getOrdersByUserId(userId);
            context.setRecentOrders(orders);
            log.info("Successfully fetched {} orders for user {}", orders.size(), userId);
        } catch (Exception e) {
            log.error("Failed to fetch orders for user {}: {}", userId, e.getMessage());
            // 降级处理：返回空列表，避免接口整体报错
            context.setRecentOrders(new ArrayList<>());
        }

        return context;
    }
}