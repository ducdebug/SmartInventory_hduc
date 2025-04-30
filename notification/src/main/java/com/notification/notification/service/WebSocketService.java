package com.notification.notification.service;

import com.notification.notification.entity.NotificationEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Service for sending notifications via WebSocket
 */
@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Send notification to a specific user via WebSocket
     *
     * @param userId       The user ID to send notification to
     * @param notification The notification entity
     */
    public void sendUserNotification(String userId, NotificationEntity notification) {
        // Send to user-specific queue
        messagingTemplate.convertAndSend("/queue/notifications/" + userId, notification);
    }

    /**
     * Broadcast notification to all connected clients
     *
     * @param notification The notification entity
     */
    public void broadcastNotification(NotificationEntity notification) {
        // Send to public topic
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    /**
     * Send notification to admin users
     *
     * @param notification The notification entity
     */
    public void sendAdminNotification(NotificationEntity notification) {
        // Send to admin topic
        messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
    }
}
