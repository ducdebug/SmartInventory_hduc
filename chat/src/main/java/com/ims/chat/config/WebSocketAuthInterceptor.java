package com.ims.chat.config;

import com.ims.chat.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    public WebSocketAuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authorization = accessor.getNativeHeader("Authorization");
            
            if (authorization != null && !authorization.isEmpty()) {
                String bearerToken = authorization.get(0);
                if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                    String token = bearerToken.substring(7);
                    try {
                        String username = jwtUtil.extractUsername(token);
                        if (username != null) {
                            Claims claims = jwtUtil.extractAllClaims(token);
                            
                            // Extract roles from token if available
                            List<String> roles = claims.get("roles", List.class);
                            List<SimpleGrantedAuthority> authorities;
                            
                            if (roles != null) {
                                authorities = roles.stream()
                                        .map(SimpleGrantedAuthority::new)
                                        .collect(Collectors.toList());
                            } else {
                                // Default role if not specified in token
                                authorities = List.of(new SimpleGrantedAuthority("USER"));
                            }
                            
                            // Create authentication token with authorities from JWT
                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    username, null, authorities
                            );
                            accessor.setUser(auth);
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    } catch (Exception e) {
                        // Invalid token, just continue without authentication
                    }
                }
            }
        }
        return message;
    }
}
