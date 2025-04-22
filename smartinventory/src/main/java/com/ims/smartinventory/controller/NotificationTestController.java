package com.ims.smartinventory.controller;

import com.ims.smartinventory.service.impl.NotificationProducerServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class NotificationTestController {

    private final NotificationProducerServiceImpl notificationProducerService;

    @Autowired
    public NotificationTestController(NotificationProducerServiceImpl notificationProducerService) {
        this.notificationProducerService = notificationProducerService;
    }

    @PostMapping("/send-notification")
    public ResponseEntity<String> sendTestNotification(
            @RequestParam String userId,
            @RequestParam String message) {
        notificationProducerService.sendNotification(userId, message);
        return ResponseEntity.ok("Notification sent to user: " + userId);
    }
}