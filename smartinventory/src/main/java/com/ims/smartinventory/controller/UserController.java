package com.ims.smartinventory.controller;

import com.ims.smartinventory.dto.Request.LoginRequest;
import com.ims.smartinventory.dto.Request.RegisterRequest;
import com.ims.smartinventory.dto.Response.AuthErrorResponse;
import com.ims.smartinventory.dto.Response.JwtResponse;
import com.ims.smartinventory.entity.UserEntity;
import com.ims.smartinventory.exception.AuthException;
import com.ims.smartinventory.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class UserController {
    private final AuthService authService;

    @Autowired
    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (AuthException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(new AuthErrorResponse("Username already exists"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@RequestBody LoginRequest request) {
        JwtResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserEntity currentUser) {
        return ResponseEntity.ok(currentUser);
    }
}
