package com.auth.authService.service.impl;

import com.auth.authService.dto.request.ChangePasswordRequest;
import com.auth.authService.dto.request.LoginRequest;
import com.auth.authService.dto.request.RegisterRequest;
import com.auth.authService.dto.response.JwtResponse;
import com.auth.authService.exception.AuthException;
import com.auth.authService.repository.UserRepository;
import com.auth.authService.security.JwtUtil;
import com.auth.authService.service.AuthService;
import com.auth.authService.util.ImageUtil;
import com.ims.common.config.UserRole;
import com.ims.common.entity.UserEntity;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    @Override
    public JwtResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        if (!user.isEnabled()) {
            if (user.isDeleted()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "This account has been deleted");
            } else if (!user.isEnabled()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "This account has been blocked");
            }
        }

        String token = jwtUtil.generateToken(user);

        return new JwtResponse(token, user.getId(), user.getUsername(), user.getRole(), user.getImg_url());
    }

    @Transactional
    @Override
    public JwtResponse register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AuthException("Username already exists");
        }

        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : UserRole.SUPPLIER);
        user.setEnabled(true);
        user.setDeleted(false);

        try {
            if (request.getProfileImage() != null && !request.getProfileImage().isEmpty()) {
                String base64Image = ImageUtil.convertToBase64(request.getProfileImage());
                user.setImg_url(base64Image);
            }
        } catch (IOException e) {
            throw new AuthException("Failed to process profile image: " + e.getMessage());
        }

        userRepository.save(user);

        String token = jwtUtil.generateToken(user);
        return new JwtResponse(token, user.getId(), user.getUsername(), user.getRole(), user.getImg_url());
    }

    @Transactional
    @Override
    public void changePassword(String userId, ChangePasswordRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public UserEntity getUserById(String userId) {
        return userRepository.findById(userId).orElse(null);
    }
}
