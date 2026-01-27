package com.fooddelivery.merchant.repository;

import com.fooddelivery.merchant.entity.MerchantNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MerchantNotificationRepository extends JpaRepository<MerchantNotification, Long> {
    // 按时间倒序获取商户通知
    List<MerchantNotification> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);
}