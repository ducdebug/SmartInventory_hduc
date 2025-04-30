package com.ims.smartinventory.dto.Request;

import com.ims.common.config.UserRole;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class RegisterRequest {
    private String username;
    private String password;
    private UserRole role;
    private MultipartFile profileImage;
}
