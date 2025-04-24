package com.auth.authService.dto.request;

import com.auth.authService.config.UserRole;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    private String username;
    private String password;
    private UserRole role;
}