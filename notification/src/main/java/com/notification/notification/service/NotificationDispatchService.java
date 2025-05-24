package com.notification.notification.service;

import com.notification.notification.entity.NotificationEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service responsible for dispatching notifications to appropriate channels
 * Follows Single Responsibility Principle - only handles notification routing/dispatching
 * Follows Open/Closed Principle - can be extended for new dispatch methods without modification
 */
@Service
public class NotificationDispatchService {

    private final WebSocketService webSocketService;

    @Autowired
    public NotificationDispatchService(WebSocketService webSocketService) {
        this.webSocketService = webSocketService;
    }

    /**
     * Dispatch notification to appropriate channel based on recipient type
     * 
     * @param notification The notification to dispatch
     */
    public void dispatch(NotificationEntity notification) {
        String userId = notification.getToUserId();
        
        if ("admin".equalsIgnoreCase(userId)) {
            System.out.println("🎯 Routing to ADMIN notification");
            dispatchToAdmin(notification);
        } else {
            System.out.println("🎯 Routing to USER notification for: " + userId);
            dispatchToUser(notification);
        }
    }

    /**
     * Dispatch notification to a specific user via WebSocket
     * 
     * @param notification The notification to send
     */
    private void dispatchToUser(NotificationEntity notification) {
        webSocketService.sendUserNotification(notification.getToUserId(), notification);
    }

    /**
     * Dispatch notification to admin channel via WebSocket
     * 
     * @param notification The notification to send
     */
    private void dispatchToAdmin(NotificationEntity notification) {
        webSocketService.sendAdminNotification(notification);
    }

    /**
     * Broadcast notification to all connected users
     * 
     * @param notification The notification to broadcast
     */
    public void broadcast(NotificationEntity notification) {
        webSocketService.broadcastNotification(notification);
    }
}
