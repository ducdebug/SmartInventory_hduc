package com.auth.authService.dto.response;

import com.ims.common.config.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JwtResponse {
    private String token;
    private String id;
    private String username;
    private UserRole role;
    private String img_url;

    public JwtResponse(String token, String id, String username, UserRole role) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.role = role;
        this.img_url = null;
    }
}
