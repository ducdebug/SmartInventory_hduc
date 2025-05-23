package com.auth.authService.service.impl;

import com.auth.authService.repository.UserRepository;
import com.auth.authService.security.JwtUtil;
import com.auth.authService.service.UserService;
import com.auth.authService.util.ImageUtil;
import com.ims.common.entity.UserEntity;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final String USER_NOT_FOUND = "User not found with username: ";

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    private String extractUsername(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        String userId = jwtUtil.extractUserId(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with ID: " + userId))
                .getUsername();
    }

    @Override
    @Transactional
    public Map<String, String> updateProfileImage(String token, MultipartFile profilePicture) throws IOException {
        if (profilePicture == null || profilePicture.isEmpty()) {
            throw new IllegalArgumentException("Profile picture is required");
        }
        String username = extractUsername(token);
        UserEntity userEntity = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException(USER_NOT_FOUND + username));

        String base64Image;
        try {
            base64Image = ImageUtil.convertToBase64(profilePicture);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }

        userEntity.setImg_url(base64Image);
        userRepository.save(userEntity);

        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("message", "Profile image updated successfully");
        responseBody.put("img_url", base64Image);
        return responseBody;
    }
}
