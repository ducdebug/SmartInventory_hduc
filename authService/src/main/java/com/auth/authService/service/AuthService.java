package com.auth.authService.service;

import com.auth.authService.dto.request.ChangePasswordRequest;
import com.auth.authService.dto.request.LoginRequest;
import com.auth.authService.dto.request.RegisterRequest;
import com.auth.authService.dto.response.JwtResponse;
import com.ims.common.entity.UserEntity;
import jakarta.transaction.Transactional;

public interface AuthService {
    @Transactional
    JwtResponse login(LoginRequest request);

    @Transactional
    JwtResponse register(RegisterRequest request);

    @Transactional
    void changePassword(String userId, ChangePasswordRequest request);
    
    UserEntity getUserById(String userId);
}
