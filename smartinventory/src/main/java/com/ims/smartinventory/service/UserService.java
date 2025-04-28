package com.ims.smartinventory.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

public interface UserService {
    /**
     * Updates the profile image for a user
     * 
     * @param token The JWT token for authentication
     * @param profilePicture The new profile picture
     * @return A map containing the success message and the image URL
     * @throws IOException If an I/O error occurs
     */
    Map<String, String> updateProfileImage(String token, MultipartFile profilePicture) throws IOException;
    
    /**
     * Extracts the username from a JWT token
     * 
     * @param token The JWT token
     * @return The username
     */
    String extractUsername(String token);
}
