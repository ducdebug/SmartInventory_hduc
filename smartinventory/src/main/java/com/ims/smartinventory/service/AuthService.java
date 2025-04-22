package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Request.LoginRequest;
import com.ims.smartinventory.dto.Request.RegisterRequest;
import com.ims.smartinventory.dto.Response.JwtResponse;
import jakarta.transaction.Transactional;

public interface AuthService {
    @Transactional
    JwtResponse login(LoginRequest request);

    @Transactional
    JwtResponse register(RegisterRequest request);
}
