package com.ims.smartinventory.dto.Request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateTemporaryUserRequest {
    private String username;
    private String name;
    private String email;
    private String company;
}
