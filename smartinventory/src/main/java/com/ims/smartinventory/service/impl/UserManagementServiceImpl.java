package com.ims.smartinventory.service.impl;

import com.ims.common.config.UserRole;
import com.ims.common.entity.UserEntity;
import com.ims.smartinventory.dto.Request.CreateTemporaryUserRequest;
import com.ims.smartinventory.dto.Response.TemporaryUserResponse;
import com.ims.smartinventory.repository.UserRepository;
import com.ims.smartinventory.service.NotificationProducerService;
import com.ims.smartinventory.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final NotificationProducerService notificationProducerService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserManagementServiceImpl(UserRepository userRepository,
                                     NotificationProducerService notificationProducerService,
                                     PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.notificationProducerService = notificationProducerService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<UserEntity> getAllUsers() {
        List<UserEntity> users = userRepository.findAll().stream()
                .filter(user -> user.getRole() != UserRole.ADMIN)
                .collect(Collectors.toList());
        return users;
    }

    @Override
    public UserEntity getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    public UserEntity updateUserBlockStatus(String userId, boolean blocked) {
        UserEntity user = getUserById(userId);

        if (user.getRole() == UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot block admin users");
        }

        user.setEnabled(!blocked);
        return userRepository.save(user);
    }

    @Override
    public UserEntity deleteUser(String userId) {
        UserEntity user = getUserById(userId);

        if (user.getRole() == UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete admin users");
        }

        user.setDeleted(true);
        return userRepository.save(user);
    }

    @Override
    public UserEntity restoreUser(String userId) {
        UserEntity user = getUserById(userId);

        if (!user.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not deleted");
        }

        user.setDeleted(false);
        return userRepository.save(user);
    }

    @Override
    public TemporaryUserResponse createTemporaryUser(CreateTemporaryUserRequest request, String supplierId) {
        // Validate input parameters
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request cannot be null");
        }

        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        if (request.getCompany() == null || request.getCompany().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company is required");
        }

        if (supplierId == null || supplierId.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supplier ID is required");
        }

        // Validate that the supplier exists and has SUPPLIER role
        UserEntity supplier;
        try {
            supplier = getUserById(supplierId);
        } catch (ResponseStatusException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supplier not found with ID: " + supplierId);
        }

        if (supplier.getRole() != UserRole.SUPPLIER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only suppliers can create temporary users. User role: " + supplier.getRole());
        }

        // Check if username already exists
        Optional<UserEntity> existingUser = userRepository.findByUsername(request.getUsername());
        if (existingUser.isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists: " + request.getUsername());
        }

        // Generate a temporary password
        String temporaryPassword = generateTemporaryPassword();

        // Create new temporary user
        UserEntity temporaryUser = new UserEntity();
        temporaryUser.setUsername(request.getUsername().trim());
        temporaryUser.setPassword(passwordEncoder.encode(temporaryPassword));
        temporaryUser.setRole(UserRole.TEMPORARY);
        temporaryUser.setName(request.getName().trim());
        temporaryUser.setEmail(request.getEmail().trim());
        temporaryUser.setCompany(request.getCompany().trim());
        temporaryUser.setEnabled(true);
        temporaryUser.setDeleted(false);
        temporaryUser.setRelated_userID(supplierId); // Set the supplier ID as the related user ID

        UserEntity savedUser;
        try {
            savedUser = userRepository.save(temporaryUser);
            System.out.println("Successfully saved temporary user with ID: " + savedUser.getId());
        } catch (Exception e) {
            System.err.println("Failed to save temporary user to database: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create temporary user: " + e.getMessage());
        }

        try {
            notificationProducerService.sendNotification(supplierId,
                    "Temporary user '" + request.getUsername() + "' has been created and authorized to withdraw your products.");
        } catch (Exception e) {
            System.err.println("Failed to send notification about temporary user creation: " + e.getMessage());
            // Don't fail the entire operation if notification fails
        }

        // Return response with temporary password
        return new TemporaryUserResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getCompany(),
                temporaryPassword, // Include the plain text password in response for one-time access
                supplierId,
                savedUser.isEnabled()
        );
    }

    private String generateTemporaryPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();

        for (int i = 0; i < 8; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }

        return password.toString();
    }
}
