package com.auth.authService.controller;

import com.auth.authService.service.UserService;
import com.ims.common.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/user/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(currentUser);
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> updateProfileImage(
            @RequestHeader("Authorization") String token,
            @RequestPart("profileImage") MultipartFile profileImage) throws IOException {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                System.out.println("Invalid or missing Authorization header");
                return ResponseEntity.status(401).body(Map.of("error", "Invalid or missing Authorization header"));
            }

            if (profileImage == null || profileImage.isEmpty()) {
                System.out.println("No image file provided");
                return ResponseEntity.badRequest().body(Map.of("error", "No image file provided"));
            }
            Map<String, String> result = userService.updateProfileImage(token, profileImage);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}