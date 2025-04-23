package com.ims.smartinventory.controller;

import com.ims.smartinventory.config.UserRole;
import com.ims.smartinventory.entity.UserEntity;
import com.ims.smartinventory.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasAuthority('ADMIN')")
public class UserManagementController {

    private final UserRepository userRepository;

    @Autowired
    public UserManagementController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }

    @PutMapping("/{userId}/block")
    public ResponseEntity<?> blockUser(@PathVariable String userId, @RequestBody Map<String, Boolean> request) {
        Boolean blocked = request.get("blocked");
        if (blocked == null) {
            return ResponseEntity.badRequest().body("'blocked' field is required");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setEnabled(!blocked);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", blocked ? "User blocked successfully" : "User unblocked successfully",
                "userId", userId
        ));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setDeleted(true);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "User deleted successfully",
                "userId", userId
        ));
    }

    @PutMapping("/{userId}/restore")
    public ResponseEntity<?> restoreUser(@PathVariable String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!user.isDeleted()) {
            return ResponseEntity.badRequest().body("User is not deleted");
        }

        user.setDeleted(false);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "User restored successfully",
                "userId", userId
        ));
    }

    @GetMapping("/{userId}")
    public UserEntity getUserById(@PathVariable String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
