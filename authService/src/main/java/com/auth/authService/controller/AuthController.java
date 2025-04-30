package com.auth.authService.controller;

import com.auth.authService.dto.request.ChangePasswordRequest;
import com.auth.authService.dto.request.LoginRequest;
import com.auth.authService.dto.request.RegisterRequest;
import com.auth.authService.dto.response.AuthErrorResponse;
import com.auth.authService.dto.response.JwtResponse;
import com.auth.authService.exception.AuthException;
import com.auth.authService.service.AuthService;
import com.ims.common.config.UserRole;
import com.ims.common.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
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
