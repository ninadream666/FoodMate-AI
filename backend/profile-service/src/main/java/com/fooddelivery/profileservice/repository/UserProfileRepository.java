package com.fooddelivery.profileservice.repository;

import com.fooddelivery.profileservice.entity.UserProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserProfileRepository extends MongoRepository<UserProfile, String> {
    Optional<UserProfile> findByUsername(String username);
}