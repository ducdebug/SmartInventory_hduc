package com.ims.smartinventory.dto.Response;

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
