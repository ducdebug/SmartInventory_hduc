package com.ims.smartinventory.repository;

import com.ims.common.config.UserRole;
import com.ims.common.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByUsername(String username);
    List<UserEntity> findByRole(UserRole role);
}
