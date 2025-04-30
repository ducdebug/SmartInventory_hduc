package com.auth.authService.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

public interface UserService {

    Map<String, String> updateProfileImage(String token, MultipartFile profilePicture) throws IOException;
}
