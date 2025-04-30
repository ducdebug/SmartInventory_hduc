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

        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = "image/jpeg";
        }

        return "data:" + contentType + ";base64," + base64;
    }
}
