package com.notification.notification.controller;

import com.ims.common.entity.UserEntity;
import com.notification.notification.entity.NotificationEntity;
import com.notification.notification.service.NotificationService;
import com.notification.notification.service.WebSocketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final WebSocketService webSocketService;
    private final SimpUserRegistry userRegistry;

    @Autowired
    public NotificationController(NotificationService notificationService,
                                  WebSocketService webSocketService,
                                  SimpUserRegistry userRegistry) {
        this.notificationService = notificationService;
        this.webSocketService = webSocketService;
        this.userRegistry = userRegistry;
    }

    @GetMapping
    public ResponseEntity<List<NotificationEntity>> getNotifications(
            @AuthenticationPrincipal UserEntity currentUser) {
        List<NotificationEntity> notifications = notificationService.getNotificationsForUser(currentUser.getId());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationEntity>> getUnreadNotifications(
            @AuthenticationPrincipal UserEntity currentUser) {
        List<NotificationEntity> notifications = notificationService.getUnreadNotificationsForUser(currentUser.getId());
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<String> markNotificationAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal UserEntity currentUser) {

        NotificationEntity notification = notificationService.getNotificationById(notificationId);
        if (notification == null) {
            return ResponseEntity.notFound().build();
        }

        if (!notification.getToUserId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        boolean success = notificationService.markNotificationAsRead(notificationId);
        if (success) {
            return ResponseEntity.ok("Notification marked as read");
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<String> markAllNotificationsAsRead(
            @AuthenticationPrincipal UserEntity currentUser) {
        int markedCount = notificationService.markAllNotificationsAsRead(currentUser.getId());
        return ResponseEntity.ok("Marked " + markedCount + " notifications as read");
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Integer>> getNotificationCounts(
            @AuthenticationPrincipal UserEntity currentUser) {

        Map<String, Integer> counts = new HashMap<>();
        counts.put("total", notificationService.getTotalNotificationCount(currentUser.getId()));
        counts.put("unread", notificationService.getUnreadNotificationCount(currentUser.getId()));

        return ResponseEntity.ok(counts);
    }
}
