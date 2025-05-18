package com.ims.chat.service;

import com.ims.chat.entity.MessageEntity;
import com.ims.chat.repository.MessageRepository;
import com.ims.chat.service.impl.MessageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceImplTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private MessageServiceImpl messageService;

    @BeforeEach
    void setUp() {
        messageService = new MessageServiceImpl(messageRepository, messagingTemplate);
    }

    @Test
    void testSendMessage() {
        // Given
        MessageEntity message = new MessageEntity();
        message.setSenderId("sender1");
        message.setReceiverId("receiver1");
        message.setContent("Hello!");

        // When
        messageService.sendMessage(message);

        // Then
        verify(messageRepository, times(1)).save(message);
        verify(messagingTemplate, times(1)).convertAndSendToUser(eq("receiver1"), eq("/private"), eq(message));
    }

    @Test
    void testGetAllConversations() {
        // Given
        String userId = "user1";
        MessageEntity message1 = new MessageEntity(1L, "user1", "user2", "Hello", LocalDateTime.now(), false);
        MessageEntity message2 = new MessageEntity(2L, "user3", "user1", "Hi there", LocalDateTime.now(), false);
        
        when(messageRepository.findAllMessagesForUser(userId)).thenReturn(Arrays.asList(message1, message2));

        // When
        Set<String> conversations = messageService.getAllConversations(userId);

        // Then
        assertEquals(2, conversations.size());
        assertTrue(conversations.contains("user2"));
        assertTrue(conversations.contains("user3"));
    }

    @Test
    void testGetMessagesBetweenUsers() {
        // Given
        String senderId = "user1";
        String receiverId = "user2";
        List<MessageEntity> expectedMessages = Arrays.asList(
            new MessageEntity(1L, senderId, receiverId, "Hello", LocalDateTime.now(), false),
            new MessageEntity(2L, receiverId, senderId, "Hi", LocalDateTime.now(), false)
        );
        
        when(messageRepository.findAllMessagesBetweenUsers(senderId, receiverId)).thenReturn(expectedMessages);

        // When
        List<MessageEntity> actualMessages = messageService.getMessagesBetweenUsers(senderId, receiverId);

        // Then
        assertEquals(expectedMessages, actualMessages);
    }
}
