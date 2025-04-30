package com.auth.authService.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

public class ImageUtil {
    public static String convertToBase64(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        byte[] bytes = file.getBytes();
        String base64 = Base64.getEncoder().encodeToString(bytes);

        // Include the file type in the base64 string for proper rendering in frontend
        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = "image/jpeg"; // Default to JPEG if content type is not available
        }

        return "data:" + contentType + ";base64," + base64;
    }
}
