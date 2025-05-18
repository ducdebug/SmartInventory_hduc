package com.ims.chat.service.interfaces;

import java.util.List;
import java.util.Set;

import com.ims.chat.dto.ConversationDTO;
import com.ims.chat.dto.MessageDTO;
import com.ims.chat.entity.MessageEntity;

public interface MessageService {
    
    /**
     * Send a message to a user
     */
    MessageEntity sendMessage(MessageEntity message);
    
    /**
     * Send a message using DTO
     */
    MessageDTO sendMessage(MessageDTO messageDTO);
    
    /**
     * Get all messages between two users
     */
    List<MessageEntity> getMessagesBetweenUsers(String senderId, String receiverId);
    
    /**
     * Get all messages between two users as DTOs
     */
    List<MessageDTO> getMessagesBetweenUsersAsDTO(String senderId, String receiverId);
    
    /**
     * Get all messages for a user
     */
    List<MessageEntity> getAllMessagesForUser(String userId);
    
    /**
     * Get all conversations for a user
     */
    Set<String> getAllConversations(String userId);
    
    /**
     * Get all conversations for a user with detailed information
     */
    List<ConversationDTO> getConversationSummaries(String userId);
    
    /**
     * Mark messages as read
     */
    void markMessagesAsRead(String senderId, String receiverId);
    
    /**
     * Delete all messages for a user
     */
    void deleteAllUserMessage(Long userId);
}
