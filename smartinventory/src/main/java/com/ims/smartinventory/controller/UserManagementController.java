package com.ims.smartinventory.controller;

import com.ims.smartinventory.entity.UserEntity;
import com.ims.smartinventory.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasAuthority('ADMIN')")
public class UserManagementController {

    private final UserManagementService userManagementService;

    @Autowired
    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public List<UserEntity> getAllUsers() {
        return userManagementService.getAllUsers();
    }

    @PutMapping("/{userId}/block")
    public ResponseEntity<?> blockUser(@PathVariable String userId, @RequestBody Map<String, Boolean> request) {
        Boolean blocked = request.get("blocked");
        if (blocked == null) {
            return ResponseEntity.badRequest().body("'blocked' field is required");
        }

        userManagementService.updateUserBlockStatus(userId, blocked);

        return ResponseEntity.ok(Map.of(
                "message", blocked ? "User blocked successfully" : "User unblocked successfully",
                "userId", userId
        ));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        userManagementService.deleteUser(userId);

        return ResponseEntity.ok(Map.of(
                "message", "User deleted successfully",
                "userId", userId
        ));
    }

    @PutMapping("/{userId}/restore")
    public ResponseEntity<?> restoreUser(@PathVariable String userId) {
        userManagementService.restoreUser(userId);

        return ResponseEntity.ok(Map.of(
                "message", "User restored successfully",
                "userId", userId
        ));
    }

    @GetMapping("/{userId}")
    public UserEntity getUserById(@PathVariable String userId) {
        return userManagementService.getUserById(userId);
    }
}
