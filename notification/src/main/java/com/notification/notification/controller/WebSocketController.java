package com.notification.notification.controller;

import com.notification.notification.entity.NotificationEntity;
import com.notification.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

/**
 * Controller for WebSocket connections
 */
@Controller
public class WebSocketController {

    private final NotificationService notificationService;

    @Autowired
    public WebSocketController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Handle subscription to user's notifications
     * Returns all unread notifications for the user when they subscribe
     *
     * @param userId The user ID from the subscription path
     * @return List of unread notifications
     */
    @SubscribeMapping("/queue/notifications/{userId}")
    public List<NotificationEntity> getUnreadUserNotifications(@DestinationVariable String userId) {
        return notificationService.getUnreadNotificationsForUser(userId);
    }

    /**
     * Handle subscription to admin notifications
     * Returns all unread admin notifications when they subscribe
     *
     * @return List of unread admin notifications
     */
    @SubscribeMapping("/topic/admin/notifications")
    public List<NotificationEntity> getUnreadAdminNotifications() {
        return notificationService.getUnreadNotificationsForUser("admin");
    }

    /**
     * Allow clients to mark notifications as read via WebSocket
     *
     * @param notificationId The ID of the notification to mark as read
     * @return Success message
     */
    @MessageMapping("/notifications/read/{notificationId}")
    @SendTo("/topic/notifications/read")
    public String markNotificationAsRead(@DestinationVariable Long notificationId) {
        boolean success = notificationService.markNotificationAsRead(notificationId);
        return success ? "Notification " + notificationId + " marked as read" : "Notification not found";
    }
}
