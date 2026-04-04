package com.fooddelivery.platformservice.repository;

import jakarta.persistence.*;
import lombok.Data;

/**
 * 商家实体（只读，仅用于查询merchantId）
 * 映射到已存在的merchants表
 */
@Entity
@Table(name = "merchants")
@Data
public class MerchantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 店铺所有者用户ID
     */
    @Column(name = "owner_user_id")
    private Long ownerId;

    /**
     * 店铺名称（可选，用于日志等）
     */
    @Column(name = "name")
    private String name;
}
