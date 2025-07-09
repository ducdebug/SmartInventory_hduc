package com.ims.smartinventory.service.impl;

import com.ims.common.config.UserRole;
import com.ims.common.entity.UserEntity;
import com.ims.smartinventory.repository.UserRepository;
import com.ims.smartinventory.service.NotificationProducerService;
import com.ims.smartinventory.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final NotificationProducerService notificationProducerService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserManagementServiceImpl(UserRepository userRepository,
                                     NotificationProducerService notificationProducerService,
                                     PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.notificationProducerService = notificationProducerService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<UserEntity> getAllUsers() {
        List<UserEntity> users = userRepository.findAll().stream()
                .filter(user -> user.getRole() != UserRole.ADMIN)
                .collect(Collectors.toList());
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
