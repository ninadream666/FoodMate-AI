package com.fooddelivery.userservice.repository;

import com.fooddelivery.userservice.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {
    // 查询某用户的所有地址，并按“默认在前，ID倒序”排序
    List<Address> findByUserIdOrderByIsDefaultDescIdDesc(Long userId);

    // 查询某用户的默认地址
    Optional<Address> findByUserIdAndIsDefaultTrue(Long userId);
    
    // 统计用户地址数量
    long countByUserId(Long userId);
    
    // 查找用户最新的一个非默认地址（用于删除默认地址后的顺延）
    Optional<Address> findFirstByUserIdAndIsDefaultFalseOrderByCreatedAtDesc(Long userId);
}