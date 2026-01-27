package com.fooddelivery.userservice.repository;

import com.fooddelivery.userservice.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // 用于登录时查找用户
    Optional<User> findByUsername(String username);

    // 用于注册时检查是否重名
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    // 按角色分页查询
    Page<User> findByRole(String role, Pageable pageable);

    // 搜索用户（用户名或昵称）
    Page<User> findByUsernameContainingOrNicknameContaining(String username, String nickname, Pageable pageable);

    // 按角色统计用户数量
    long countByRole(String role);
}