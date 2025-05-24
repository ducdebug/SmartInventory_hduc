package com.ims.smartinventory.service.impl;

import com.ims.common.config.UserRole;
import com.ims.common.entity.UserEntity;
import com.ims.smartinventory.repository.UserRepository;
import com.ims.smartinventory.service.NotificationProducerService;
import com.ims.smartinventory.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final NotificationProducerService notificationProducerService;

    @Autowired
    public UserManagementServiceImpl(UserRepository userRepository, NotificationProducerService notificationProducerService) {
        this.userRepository = userRepository;
        this.notificationProducerService = notificationProducerService;
    }

    @Override
    public List<UserEntity> getAllUsers() {
        List<UserEntity> users = userRepository.findAll().stream()
                .filter(user -> user.getRole() != UserRole.ADMIN)
                .collect(Collectors.toList());

        // ✅ Debug with actual user IDs
        System.out.println("=== NOTIFICATION TEST ===");

        // List all available user IDs
        users.forEach(user ->
                System.out.println("Available user: " + user.getUsername() + " (ID: " + user.getId() + ")")
        );

        // Try sending to admin first (easier to test)
        try {
            notificationProducerService.sendNotification("f43739f6-b25c-4360-a38f-f8cf0fba558a",
                    "Test notification from getAllUsers() - " + new Date());
            System.out.println("✅ Notification sent to admin");
        } catch (Exception e) {
            System.err.println("❌ Failed: " + e.getMessage());
            e.printStackTrace();
        }

        return users;
    }

    @Override
    public UserEntity getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    public UserEntity updateUserBlockStatus(String userId, boolean blocked) {
        UserEntity user = getUserById(userId);

        if (user.getRole() == UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot block admin users");
        }

        user.setEnabled(!blocked);
        return userRepository.save(user);
    }

    @Override
    public UserEntity deleteUser(String userId) {
        UserEntity user = getUserById(userId);

        if (user.getRole() == UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete admin users");
        }

        user.setDeleted(true);
        return userRepository.save(user);
    }

    @Override
    public UserEntity restoreUser(String userId) {
        UserEntity user = getUserById(userId);

        if (!user.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not deleted");
        }

        user.setDeleted(false);
        return userRepository.save(user);
    }
}
