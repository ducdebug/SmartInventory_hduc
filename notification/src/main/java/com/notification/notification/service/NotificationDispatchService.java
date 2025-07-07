package com.notification.notification.service;

import com.notification.notification.entity.NotificationEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class NotificationDispatchService {

    private final WebSocketService webSocketService;

    @Autowired
    public NotificationDispatchService(WebSocketService webSocketService) {
        this.webSocketService = webSocketService;
    }

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

    private void dispatchToUser(NotificationEntity notification) {
        webSocketService.sendUserNotification(notification.getToUserId(), notification);
    }

    private void dispatchToAdmin(NotificationEntity notification) {
        webSocketService.sendAdminNotification(notification);
    }

    public void broadcast(NotificationEntity notification) {
        webSocketService.broadcastNotification(notification);
    }
}
