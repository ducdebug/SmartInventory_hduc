package com.notification.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.security.Principal;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:3001", "*")
                .addInterceptors(new WebSocketHandshakeInterceptor())
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/queue", "/user", "/topic");
        registry.setUserDestinationPrefix("/user");
    }

    // Custom handshake interceptor to extract user information
    private static class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                     WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
            
            System.out.println("🤝 === WEBSOCKET HANDSHAKE START ===");
            System.out.println("🌐 Request URI: " + request.getURI());
            System.out.println("🏷️ Headers: " + request.getHeaders());
            
            // Extract user ID from request parameters or headers
            String userId = null;
            
            // Try to get userId from query parameters
            String query = request.getURI().getQuery();
            if (query != null && query.contains("userId=")) {
                userId = extractUserIdFromQuery(query);
            }
            
            // Try to get userId from Authorization header
            if (userId == null) {
                String authHeader = request.getHeaders().getFirst("Authorization");
                if (authHeader != null) {
                    System.out.println("🔑 Auth header found: " + authHeader);
                    // You could decode JWT token here to extract userId
                    // For now, we'll use a simple approach
                }
            }
            
            System.out.println("👤 Extracted User ID: " + userId);
            
            if (userId != null) {
                attributes.put("userId", userId);
                // Create a simple principal
                attributes.put("principal", new SimplePrincipal(userId));
                System.out.println("✅ User ID stored in session attributes");
            } else {
                System.out.println("⚠️ No user ID found in handshake");
            }
            
            System.out.println("=== HANDSHAKE COMPLETE ===\n");
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                 WebSocketHandler wsHandler, Exception exception) {
            if (exception != null) {
                System.err.println("❌ Handshake failed: " + exception.getMessage());
            }
        }

        private String extractUserIdFromQuery(String query) {
            String[] params = query.split("&");
            for (String param : params) {
                if (param.startsWith("userId=")) {
                    return param.substring("userId=".length());
                }
            }
            return null;
        }
    }

    // Simple Principal implementation
    private static class SimplePrincipal implements Principal {
        private final String name;

        public SimplePrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}
