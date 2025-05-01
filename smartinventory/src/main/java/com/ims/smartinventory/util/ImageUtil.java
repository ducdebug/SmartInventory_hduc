package com.ims.smartinventory.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

public class ImageUtil {

    public static String convertToBase64(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        String contentType = file.getContentType();

        if (contentType != null) {
            String dataUrl = "data:" + contentType + ";base64," + base64;
            System.out.println("Converted image to data URL, content type: " + contentType);
            return dataUrl;
        }

        return base64;
    }
}