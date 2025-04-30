package com.ims.smartinventory.controller;

import com.ims.common.entity.UserEntity;
import com.ims.smartinventory.service.UserService;
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
public class UserProfileController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserEntity currentUser) {
        System.out.println("GET /user/profile endpoint called");
        if (currentUser == null) {
            System.out.println("Current user is null");
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        System.out.println("Returning user: " + currentUser.getUsername());
        return ResponseEntity.ok(currentUser);
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> updateProfileImage(
            @RequestHeader("Authorization") String token,
            @RequestPart("profileImage") MultipartFile profileImage) throws IOException {
        System.out.println("POST /user/profile/image endpoint called");
        System.out.println("Token: " + (token != null ? token.substring(0, Math.min(token.length(), 20)) + "..." : "null"));
        System.out.println("Profile image name: " + (profileImage != null ? profileImage.getOriginalFilename() : "null"));
        System.out.println("Profile image size: " + (profileImage != null ? profileImage.getSize() : "null"));
        System.out.println("Profile image content type: " + (profileImage != null ? profileImage.getContentType() : "null"));

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
            System.out.println("Profile image updated successfully");
            System.out.println("Response: " + result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.out.println("Error updating profile image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}