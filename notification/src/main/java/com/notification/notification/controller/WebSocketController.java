package com.notification.notification.controller;

import com.notification.notification.entity.NotificationEntity;
import com.notification.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

@Controller
public class WebSocketController {

    private final NotificationService notificationService;

    @Autowired
    public WebSocketController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @SubscribeMapping("/user/queue/notifications")
    public List<NotificationEntity> getUserNotifications(Principal principal) {
        String userId = principal.getName();
        return notificationService.getUnreadNotificationsForUser(userId);
    }

    @SubscribeMapping("/topic/admin/notifications")
    public List<NotificationEntity> getAdminNotifications() {
        return notificationService.getUnreadNotificationsForUser("admin");
    }

    @MessageMapping("/notifications/read/{notificationId}")
    @SendTo("/topic/notifications/read")
    public String markNotificationAsRead(@DestinationVariable Long notificationId, Principal principal) {
        NotificationEntity notification = notificationService.getNotificationById(notificationId);
        if (notification == null) {
            return "Notification not found";
        }

        String userId = principal.getName();
        if (!notification.getToUserId().equals(userId)) {
            return "Access denied";
        }

        boolean success = notificationService.markNotificationAsRead(notificationId);
        return success ? "Notification " + notificationId + " marked as read" : "Failed to mark notification as read";
    }
}
