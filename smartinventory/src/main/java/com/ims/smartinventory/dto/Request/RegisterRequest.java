package com.ims.smartinventory.dto.Request;

import com.ims.smartinventory.config.UserRole;
import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private UserRole role;
}
