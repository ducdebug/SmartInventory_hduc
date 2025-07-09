package com.ims.smartinventory.service;

import com.ims.common.entity.UserEntity;

import java.util.List;

public interface UserManagementService {
    List<UserEntity> getAllUsers();

    UserEntity getUserById(String userId);

    UserEntity updateUserBlockStatus(String userId, boolean blocked);

    UserEntity deleteUser(String userId);

    UserEntity restoreUser(String userId);

}
