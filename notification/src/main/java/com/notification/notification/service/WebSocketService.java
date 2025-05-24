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
        System.out.println("🔧 WebSocketService initialized successfully");
        System.out.println("📡 SimpMessagingTemplate: " + (messagingTemplate != null ? "✅ Available" : "❌ NULL"));
        System.out.println("👥 SimpUserRegistry: " + (userRegistry != null ? "✅ Available" : "❌ NULL"));
    }

    public void sendUserNotification(String userId, NotificationEntity notification) {
        System.out.println("\n=== WEBSOCKET DEBUG START ===");
        System.out.println("🎯 Target User ID: " + userId);
        System.out.println("📋 Notification ID: " + notification.getId());
        System.out.println("💬 Message: " + notification.getMessage());
        System.out.println("🕒 Created At: " + notification.getCreatedAt());
        
        // Check connected users
        System.out.println("👥 Currently connected users: " + userRegistry.getUserCount());
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
            System.out.println("🚀 Attempting to send WebSocket message...");
            System.out.println("📍 Destination: /user/" + userId + "/queue/notifications");
            
            // Send the notification
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notification);
            
            System.out.println("✅ WebSocket message sent successfully!");
            System.out.println("📤 Message dispatched to Spring's message broker");
            
        } catch (Exception e) {
            System.err.println("❌ WEBSOCKET SEND FAILED!");
            System.err.println("🚨 Error: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("=== WEBSOCKET DEBUG END ===\n");
    }

    public void broadcastNotification(NotificationEntity notification) {
        System.out.println("📢 Broadcasting notification to all users");
        System.out.println("📍 Destination: /topic/notifications");
        System.out.println("💬 Message: " + notification.getMessage());
        
        try {
            messagingTemplate.convertAndSend("/topic/notifications", notification);
            System.out.println("✅ Broadcast sent successfully");
        } catch (Exception e) {
            System.err.println("❌ Broadcast failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendAdminNotification(NotificationEntity notification) {
        System.out.println("👨‍💼 Sending admin notification");
        System.out.println("📍 Destination: /topic/admin/notifications");
        System.out.println("💬 Message: " + notification.getMessage());
        
        // Check if any admin users are connected
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
