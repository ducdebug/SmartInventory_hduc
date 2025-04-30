package com.ims.smartinventory.dto.Response;

import com.ims.common.config.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String username;
    private UserRole role;
}
