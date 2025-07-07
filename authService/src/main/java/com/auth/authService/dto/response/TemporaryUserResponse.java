package com.auth.authService.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TemporaryUserResponse {
    private String id;
    private String username;
    private String name;
    private String email;
    private String company;
    private String temporaryPassword;
    private String supplierId;
    private boolean enabled;
    
    public TemporaryUserResponse(String id, String username, String name, String email, 
                               String company, String temporaryPassword, String supplierId, boolean enabled) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.email = email;
        this.company = company;
        this.temporaryPassword = temporaryPassword;
        this.supplierId = supplierId;
        this.enabled = enabled;
    }
}
