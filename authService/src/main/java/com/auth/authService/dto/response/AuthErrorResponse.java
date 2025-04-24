package com.auth.authService.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthErrorResponse {
    private String message;

    public AuthErrorResponse(String message) {
        this.message = message;
    }

}
