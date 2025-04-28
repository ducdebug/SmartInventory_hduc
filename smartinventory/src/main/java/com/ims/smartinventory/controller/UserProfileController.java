package com.ims.smartinventory.controller;

import com.ims.smartinventory.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserService userService;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> updateProfileImage(
            @RequestHeader("Authorization") String token,
            @RequestPart("profileImage") MultipartFile profileImage) throws IOException {
        return ResponseEntity.ok(userService.updateProfileImage(token, profileImage));
    }
}
