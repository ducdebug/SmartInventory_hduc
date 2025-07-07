package com.auth.authService.controller;

import com.auth.authService.dto.request.CreateTemporaryUserRequest;
import com.auth.authService.dto.response.TemporaryUserResponse;
import com.auth.authService.service.TemporaryUserService;
import com.ims.common.entity.UserEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/temporary-users")
public class TemporaryUserController {

    private final TemporaryUserService temporaryUserService;

    public TemporaryUserController(TemporaryUserService temporaryUserService) {
        this.temporaryUserService = temporaryUserService;
    }

    @PostMapping("/create")
    public ResponseEntity<TemporaryUserResponse> createTemporaryUser(
            @RequestBody CreateTemporaryUserRequest request,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        if (currentUser == null) {
            System.err.println("CreateTemporaryUser: No authenticated user found");
            return ResponseEntity.status(401).build();
        }

        if (!"SUPPLIER".equals(currentUser.getRole().name())) {
            System.err.println("CreateTemporaryUser: User role is not SUPPLIER: " + currentUser.getRole().name());
            return ResponseEntity.status(403).build();
        }

        try {
            TemporaryUserResponse temporaryUser = temporaryUserService.createTemporaryUser(request, currentUser.getId());
            return ResponseEntity.ok(temporaryUser);
        } catch (Exception e) {
            e.printStackTrace();

            if (e.getMessage().contains("Username already exists")) {
                return ResponseEntity.status(400).body(null);
            } else if (e.getMessage().contains("Only suppliers can create temporary users")) {
                return ResponseEntity.status(403).body(null);
            } else {
                return ResponseEntity.status(500).body(null);
            }
        }
    }

    @GetMapping
    public ResponseEntity<List<UserEntity>> getTemporaryUsers(
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        if (!"SUPPLIER".equals(currentUser.getRole().name()) && !"ADMIN".equals(currentUser.getRole().name())) {
            return ResponseEntity.status(403).build();
        }

        try {
            List<UserEntity> temporaryUsers = temporaryUserService.getTemporaryUsers();
            return ResponseEntity.ok(temporaryUsers);
        } catch (Exception e) {
            System.err.println("Error retrieving temporary users: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
