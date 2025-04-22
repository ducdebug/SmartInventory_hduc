package com.ims.smartinventory.service.impl;

import com.ims.smartinventory.config.UserRole;
import com.ims.smartinventory.dto.Request.LoginRequest;
import com.ims.smartinventory.dto.Request.RegisterRequest;
import com.ims.smartinventory.dto.Response.JwtResponse;
import com.ims.smartinventory.entity.UserEntity;
import com.ims.smartinventory.exception.AuthException;
import com.ims.smartinventory.repository.UserRepository;
import com.ims.smartinventory.security.JwtUtil;
import com.ims.smartinventory.service.AuthService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

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

        String token = jwtUtil.generateToken(user);

        return new JwtResponse(token, user.getUsername(), user.getRole());
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
        user.setRole(request.getRole() != null ? request.getRole() : UserRole.BUYER);
        user.setEnabled(true);
        user.setDeleted(false);

        userRepository.save(user);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(request.getUsername());
        loginRequest.setPassword(request.getPassword());
        return login(loginRequest);
    }
}
