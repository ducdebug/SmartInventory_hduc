package com.auth.authService.dto.request;

import com.ims.common.config.UserRole;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
public class RegisterRequest {
    private String username;
    private String password;
    private UserRole role;
    private MultipartFile profileImage;
}
