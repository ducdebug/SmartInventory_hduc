package com.ims.smartinventory.service;

import com.ims.common.entity.UserEntity;
import com.ims.smartinventory.dto.Request.CreateTemporaryUserRequest;
import com.ims.smartinventory.dto.Response.TemporaryUserResponse;

import java.util.List;

public interface UserManagementService {
    List<UserEntity> getAllUsers();

    UserEntity getUserById(String userId);

    UserEntity updateUserBlockStatus(String userId, boolean blocked);

    UserEntity deleteUser(String userId);

    UserEntity restoreUser(String userId);
    
    TemporaryUserResponse createTemporaryUser(CreateTemporaryUserRequest request, String supplierId);
}
