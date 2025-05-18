package com.ims.chat.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private LocalDateTime timestamp = LocalDateTime.now();
    private int status;
    private String message;
    private T data;
    
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(LocalDateTime.now(), 200, "Success", data);
    }
    
    public static <T> ApiResponse<T> error(int status, String message) {
        return new ApiResponse<>(LocalDateTime.now(), status, message, null);
    }
}
