package com.ims.smartinventory.controller;

import com.ims.smartinventory.config.UserRole;
import com.ims.smartinventory.dto.Request.ChangePasswordRequest;
import com.ims.smartinventory.dto.Request.LoginRequest;
import com.ims.smartinventory.dto.Request.RegisterRequest;
import com.ims.smartinventory.dto.Response.AuthErrorResponse;
import com.ims.smartinventory.dto.Response.JwtResponse;
import com.ims.smartinventory.entity.UserEntity;
import com.ims.smartinventory.exception.AuthException;
import com.ims.smartinventory.service.AuthService;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

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
    
    @PostMapping(value = "/register-with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerWithImage(
            @RequestParam("username") String username,
            @RequestParam("password") String password,
            @RequestParam(value = "role", required = false) UserRole role,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {
        try {
            RegisterRequest request = new RegisterRequest();
            request.setUsername(username);
            request.setPassword(password);
            request.setRole(role);
            request.setProfileImage(profileImage);
            
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
    
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal UserEntity currentUser,
            @RequestBody ChangePasswordRequest request) {
        try {
            authService.changePassword(currentUser.getId(), request);
            return ResponseEntity.ok().body(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new AuthErrorResponse(e.getMessage()));
        }
    }
}
