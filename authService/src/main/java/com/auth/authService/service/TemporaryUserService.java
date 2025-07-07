package com.auth.authService.service;

import com.auth.authService.dto.request.CreateTemporaryUserRequest;
import com.auth.authService.dto.response.TemporaryUserResponse;
import com.ims.common.entity.UserEntity;

import java.util.List;

public interface TemporaryUserService {
    TemporaryUserResponse createTemporaryUser(CreateTemporaryUserRequest request, String supplierId);
    List<UserEntity> getTemporaryUsers();
}
