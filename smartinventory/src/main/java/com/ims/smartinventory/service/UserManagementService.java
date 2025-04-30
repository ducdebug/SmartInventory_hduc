package com.ims.smartinventory.service;

import com.ims.common.entity.UserEntity;

import java.util.List;

public interface UserManagementService {
    /**
     * Get all users except those with ADMIN role
     *
     * @return List of users excluding admins
     */
    List<UserEntity> getAllUsers();

    /**
     * Get user by ID
     *
     * @param userId ID of the user to retrieve
     * @return The user entity if found
     * @throws org.springframework.web.server.ResponseStatusException if user not found
     */
    UserEntity getUserById(String userId);

    /**
     * Block or unblock a user
     *
     * @param userId  ID of the user to update
     * @param blocked true to block the user, false to unblock
     * @return The updated user entity
     * @throws org.springframework.web.server.ResponseStatusException if user not found
     */
    UserEntity updateUserBlockStatus(String userId, boolean blocked);

    /**
     * Mark a user as deleted (soft delete)
     *
     * @param userId ID of the user to delete
     * @return The updated user entity
     * @throws org.springframework.web.server.ResponseStatusException if user not found
     */
    UserEntity deleteUser(String userId);

    /**
     * Restore a previously deleted user
     *
     * @param userId ID of the user to restore
     * @return The updated user entity
     * @throws org.springframework.web.server.ResponseStatusException if user not found or not deleted
     */
    UserEntity restoreUser(String userId);
}
