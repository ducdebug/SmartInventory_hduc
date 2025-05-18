package com.ims.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {
    private String userId;           // The ID of the other user in the conversation
    private String userName;         // Name of the other user (can be populated from a user service)
    private String lastMessage;      // The content of the last message
    private LocalDateTime lastMessageTime; // When the last message was sent
    private boolean hasUnread;       // Whether there are unread messages
    private int unreadCount;         // Count of unread messages
}
