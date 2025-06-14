package com.ims.chat.service.interfaces;

import java.util.List;

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
     * Get all messages between two users as DTOs
     */
    List<MessageDTO> getMessagesBetweenUsersAsDTO(String senderId, String receiverId);
    
    /**
     * Get all conversations for a user with detailed information
     */
    List<ConversationDTO> getConversationSummaries(String userId);
    
    /**
     * Mark messages as read between two users
     */
    void markMessagesAsRead(String receiverId, String senderId);
}
