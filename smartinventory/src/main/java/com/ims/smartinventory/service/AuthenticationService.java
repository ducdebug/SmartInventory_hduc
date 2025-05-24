package com.ims.smartinventory.service;

import com.ims.common.entity.UserEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

    /**
     * Gets the currently authenticated user from the security context
     *
     * @return UserEntity of the currently authenticated user
     * @throws RuntimeException if no user is authenticated
     */
    public UserEntity getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user found");
        }

        if (authentication.getPrincipal() instanceof UserEntity) {
            return (UserEntity) authentication.getPrincipal();
        }

        throw new RuntimeException("Unexpected authentication principal type");
    }

    /**
     * Gets the currently authenticated user's ID
     *
     * @return String userId of the currently authenticated user
     * @throws RuntimeException if no user is authenticated
     */
    public String getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * Gets the currently authenticated user's name
     *
     * @return String name of the currently authenticated user
     * @throws RuntimeException if no user is authenticated
     */
    public String getCurrentUserName() {
        return getCurrentUser().getUsername();
    }

    /**
     * Safely gets the current user ID, returns null if no user is authenticated
     *
     * @return String userId or null if not authenticated
     */
    public String getCurrentUserIdSafely() {
        try {
            return getCurrentUserId();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Safely gets the current user name, returns "Unknown User" if no user is authenticated
     *
     * @return String user name or "Unknown User" if not authenticated
     */
    public String getCurrentUserNameSafely() {
        try {
            return getCurrentUserName();
        } catch (Exception e) {
            return "Unknown User";
        }
    }
}
