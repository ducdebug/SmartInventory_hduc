package com.notification.notification.config;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Component
public class WebSocketEventListener {

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        System.out.println("🔌 === NEW WEBSOCKET CONNECTION ===");
        System.out.println("📋 Session ID: " + sessionId);
        System.out.println("👤 User: " + headerAccessor.getUser());
        System.out.println("🏷️ Headers: " + headerAccessor.toNativeHeaderMap());
        System.out.println("🎯 Principal: " + (headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : "NULL"));
        System.out.println("=== CONNECTION ESTABLISHED ===\n");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String username = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : "Unknown";
        
        System.out.println("❌ === WEBSOCKET DISCONNECTION ===");
        System.out.println("📋 Session ID: " + sessionId);
        System.out.println("👤 User: " + username);
        System.out.println("=== DISCONNECTION COMPLETE ===\n");
    }

    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String destination = headerAccessor.getDestination();
        String username = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : "Unknown";
        
        System.out.println("📡 === NEW SUBSCRIPTION ===");
        System.out.println("📋 Session ID: " + sessionId);
        System.out.println("👤 User: " + username);
        System.out.println("🎯 Destination: " + destination);
        System.out.println("=== SUBSCRIPTION REGISTERED ===\n");
    }
}
