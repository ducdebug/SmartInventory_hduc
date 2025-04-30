package com.ims.smartinventory.service.impl;

import com.ims.common.entity.UserEntity;
import com.ims.smartinventory.repository.UserRepository;
import com.ims.smartinventory.security.JwtUtil;
import com.ims.smartinventory.service.UserService;
import com.ims.smartinventory.util.ImageUtil;
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

    @Override
    public String extractUsername(String token) {
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

        System.out.println("Updating profile image");
        System.out.println("Token: " + (token != null ? token.substring(0, Math.min(token.length(), 20)) + "..." : "null"));
        System.out.println("File name: " + profilePicture.getOriginalFilename());
        System.out.println("File size: " + profilePicture.getSize());
        System.out.println("File content type: " + profilePicture.getContentType());

        String username = extractUsername(token);
        System.out.println("Extracted username: " + username);

        UserEntity userEntity = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException(USER_NOT_FOUND + username));

        System.out.println("Found user: " + userEntity.getId());

        String base64Image;
        try {
            base64Image = ImageUtil.convertToBase64(profilePicture);
            System.out.println("Converted image to base64, length: " + base64Image.length());
        } catch (Exception e) {
            System.out.println("Error converting image to base64: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        userEntity.setImg_url(base64Image);
        UserEntity savedEntity = userRepository.save(userEntity);
        System.out.println("User entity saved with updated image");

        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("message", "Profile image updated successfully");
        responseBody.put("img_url", base64Image);
        return responseBody;
    }
}
