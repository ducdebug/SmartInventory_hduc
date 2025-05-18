package com.ims.chat.controller;

import com.ims.chat.dto.ApiResponse;
import com.ims.chat.dto.ConversationDTO;
import com.ims.chat.dto.MessageDTO;
import com.ims.chat.entity.MessageEntity;
import com.ims.chat.service.interfaces.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ChatController {

    private final MessageService messageService;

    public ChatController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/private-message")
    public void receiveMessage(@Payload MessageEntity message) {
        messageService.sendMessage(message);
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<Set<String>>> getConversations(@RequestParam String userId) {
        Set<String> conversations = messageService.getAllConversations(userId);
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/conversation-summaries")
    public ResponseEntity<ApiResponse<List<ConversationDTO>>> getConversationSummaries(@RequestParam String userId) {
        List<ConversationDTO> summaries = messageService.getConversationSummaries(userId);
        return ResponseEntity.ok(ApiResponse.success(summaries));
    }

    @GetMapping("/conversation")
    public ResponseEntity<ApiResponse<List<MessageEntity>>> getConversation(
            @RequestParam String senderId,
            @RequestParam String receiverId) {
        List<MessageEntity> messages = messageService.getMessagesBetweenUsers(senderId, receiverId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/conversation-dto")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getConversationAsDTO(
            @RequestParam String senderId,
            @RequestParam String receiverId) {
        List<MessageDTO> messages = messageService.getMessagesBetweenUsersAsDTO(senderId, receiverId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<List<MessageEntity>>> getAllMessagesForUser(@RequestParam String userId) {
        List<MessageEntity> messages = messageService.getAllMessagesForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<MessageEntity>> sendMessage(@RequestBody MessageEntity message) {
        MessageEntity sentMessage = messageService.sendMessage(message);
        return ResponseEntity.ok(ApiResponse.success(sentMessage));
    }

    @PostMapping("/send-dto")
    public ResponseEntity<ApiResponse<MessageDTO>> sendMessageDTO(@RequestBody MessageDTO messageDTO) {
        MessageDTO sentMessage = messageService.sendMessage(messageDTO);
        return ResponseEntity.ok(ApiResponse.success(sentMessage));
    }

    @PostMapping("/mark-read")
    public ResponseEntity<ApiResponse<Void>> markMessagesAsRead(
            @RequestParam String senderId,
            @RequestParam String receiverId) {
        messageService.markMessagesAsRead(senderId, receiverId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteAllUserMessages(@PathVariable Long userId) {
        messageService.deleteAllUserMessage(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
