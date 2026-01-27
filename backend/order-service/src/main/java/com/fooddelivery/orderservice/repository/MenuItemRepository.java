package com.fooddelivery.orderservice.repository;

import com.fooddelivery.orderservice.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByMerchantId(Long merchantId);
}
