package com.notification.notification.service;

import com.notification.notification.entity.NotificationEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final SimpUserRegistry userRegistry;

    @Autowired
    public WebSocketService(SimpMessagingTemplate messagingTemplate, SimpUserRegistry userRegistry) {
        this.messagingTemplate = messagingTemplate;
        this.userRegistry = userRegistry;
    }

    public void sendUserNotification(String userId, NotificationEntity notification) {
        userRegistry.getUsers().forEach(user -> {
            System.out.println("   - Connected user: " + user.getName() + " (Sessions: " + user.getSessions().size() + ")");
        });

        // Check if target user is connected
        boolean userConnected = userRegistry.getUser(userId) != null;
        System.out.println("🔌 Target user '" + userId + "' connected: " + (userConnected ? "✅ YES" : "❌ NO"));

        if (!userConnected) {
            System.out.println("⚠️  USER NOT CONNECTED - Notification will not be delivered in real-time");
            System.out.println("💡 User needs to refresh/reconnect to see this notification");
        }
        try {
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notification);


        } catch (Exception e) {
            System.err.println("🚨 Error: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("=== WEBSOCKET DEBUG END ===\n");
    }

    public void broadcastNotification(NotificationEntity notification) {
        try {
            messagingTemplate.convertAndSend("/topic/notifications", notification);
        } catch (Exception e) {
            System.err.println("❌ Broadcast failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendAdminNotification(NotificationEntity notification) {
        long adminConnections = userRegistry.getUsers().stream()
                .filter(user -> "admin".equalsIgnoreCase(user.getName()))
                .count();
        System.out.println("👨‍💼 Admin connections found: " + adminConnections);

        try {
            messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
            System.out.println("✅ Admin notification sent successfully");
        } catch (Exception e) {
            System.err.println("❌ Admin notification failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
