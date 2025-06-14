package com.ims.chat.controller;

import com.ims.chat.dto.ApiResponse;
import com.ims.chat.dto.ConversationDTO;
import com.ims.chat.dto.MessageDTO;
import com.ims.chat.entity.MessageEntity;
import com.ims.chat.service.interfaces.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat")
public class ChatController {

    private final MessageService messageService;

    public ChatController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/private-message")
    public void receiveMessage(@Payload MessageEntity message) {
        messageService.sendMessage(message);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "chat-service");
        response.put("timestamp", System.currentTimeMillis());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            response.put("authenticated", true);
            response.put("principal", auth.getName());
            response.put("authorities", auth.getAuthorities());
        } else {
            response.put("authenticated", false);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversation-summaries")
    public ResponseEntity<ApiResponse<List<ConversationDTO>>> getConversationSummaries(@AuthenticationPrincipal String currentUserId) {
        List<ConversationDTO> summaries = messageService.getConversationSummaries(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(summaries));
    }

    @GetMapping("/conversation-dto")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getConversationAsDTO(
            @RequestParam String receiverId,
            @AuthenticationPrincipal String senderId) {
        List<MessageDTO> messages = messageService.getMessagesBetweenUsersAsDTO(senderId, receiverId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/send-dto")
    public ResponseEntity<ApiResponse<MessageDTO>> sendMessageDTO(@RequestBody MessageDTO messageDTO) {
        MessageDTO sentMessage = messageService.sendMessage(messageDTO);
        return ResponseEntity.ok(ApiResponse.success(sentMessage));
    }

    @PostMapping("/mark-messages-read")
    public ResponseEntity<ApiResponse<Void>> markMessagesAsRead(
            @RequestParam String senderId,
            @AuthenticationPrincipal String currentUserId) {

        messageService.markMessagesAsRead(currentUserId, senderId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
