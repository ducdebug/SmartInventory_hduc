package com.ims.smartinventory.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

public class ImageUtil {

    /**
     * Converts a MultipartFile to a Base64 encoded string
     * with appropriate data URL prefix based on content type
     *
     * @param file The MultipartFile to be converted
     * @return The Base64 encoded string with data URL prefix
     * @throws IOException If an I/O error occurs
     */
    public static String convertToBase64(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        String contentType = file.getContentType();

        // Add data URL prefix based on content type
        if (contentType != null) {
            String dataUrl = "data:" + contentType + ";base64," + base64;
            System.out.println("Converted image to data URL, content type: " + contentType);
            return dataUrl;
        }

        // Fallback to just the base64 string
        return base64;
    }
}