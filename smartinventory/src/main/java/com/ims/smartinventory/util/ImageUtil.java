package com.ims.smartinventory.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

public class ImageUtil {

    /**
     * Converts a MultipartFile to a Base64 encoded string
     * 
     * @param file The MultipartFile to be converted
     * @return The Base64 encoded string
     * @throws IOException If an I/O error occurs
     */
    public static String convertToBase64(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        return Base64.getEncoder().encodeToString(file.getBytes());
    }
}
