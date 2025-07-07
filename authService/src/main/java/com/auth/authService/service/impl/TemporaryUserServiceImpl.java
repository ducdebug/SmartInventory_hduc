package com.auth.authService.service.impl;

import com.auth.authService.dto.request.CreateTemporaryUserRequest;
import com.auth.authService.dto.response.TemporaryUserResponse;
import com.auth.authService.repository.UserRepository;
import com.auth.authService.service.TemporaryUserService;
import com.ims.common.config.UserRole;
import com.ims.common.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TemporaryUserServiceImpl implements TemporaryUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public TemporaryUserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public TemporaryUserResponse createTemporaryUser(CreateTemporaryUserRequest request, String supplierId) {
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

        UserEntity supplier;
        try {
            supplier = userRepository.findById(supplierId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supplier not found with ID: " + supplierId));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supplier not found with ID: " + supplierId);
        }

        if (supplier.getRole() != UserRole.SUPPLIER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only suppliers can create temporary users. User role: " + supplier.getRole());
        }

        Optional<UserEntity> existingUser = userRepository.findByUsername(request.getUsername());
        if (existingUser.isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists: " + request.getUsername());
        }
        UserEntity temporaryUser = new UserEntity();
        temporaryUser.setUsername(request.getUsername().trim());
        temporaryUser.setPassword(passwordEncoder.encode(request.getTemporarypassword()));
        temporaryUser.setRole(UserRole.TEMPORARY);
        temporaryUser.setName(request.getName().trim());
        temporaryUser.setEmail(request.getEmail().trim());
        temporaryUser.setCompany(request.getCompany().trim());
        temporaryUser.setEnabled(true);
        temporaryUser.setDeleted(false);
        temporaryUser.setTmpPassword(request.getTemporarypassword());
        temporaryUser.setRelated_userID(supplierId);

        UserEntity savedUser;
        try {
            savedUser = userRepository.save(temporaryUser);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create temporary user: " + e.getMessage());
        }

        return new TemporaryUserResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getCompany(),
                request.getTemporarypassword(),
                supplierId,
                savedUser.isEnabled()
        );
    }

    @Override
    public List<UserEntity> getTemporaryUsers() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.TEMPORARY)
                .collect(Collectors.toList());
    }

}
