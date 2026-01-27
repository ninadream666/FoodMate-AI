package com.fooddelivery.userservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    private String nickname;
    
    @Column(name = "avatar_url")
    private String avatarUrl;
    
    private String phone;

    @Column(nullable = false)
    private String role;

    // 信用等级字段
    @Column(name = "credit_level")
    private Integer creditLevel;

    @Column(name = "recent_cancellations")
    private Integer recentCancellations;

    @Column(name = "last_level_change_at")
    private LocalDateTime lastLevelChangeAt;
}
