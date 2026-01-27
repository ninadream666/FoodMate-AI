package com.fooddelivery.merchant.repository;

import com.fooddelivery.merchant.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    // 商家/管理员视图：查询所有（包括下架）
    List<MenuItem> findByMerchantId(Long merchantId);
    
    // 顾客视图：查询仅上架
    List<MenuItem> findByMerchantIdAndIsAvailableTrue(Long merchantId);
}