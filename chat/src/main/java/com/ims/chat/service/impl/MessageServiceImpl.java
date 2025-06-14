package com.ims.chat.service.impl;

import com.ims.chat.dto.ConversationDTO;
import com.ims.chat.dto.MessageDTO;
import com.ims.chat.entity.MessageEntity;
import com.ims.chat.repository.MessageRepository;
import com.ims.chat.service.interfaces.MessageService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageServiceImpl(MessageRepository messageRepository, SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public MessageEntity sendMessage(MessageEntity message) {
        message.setTimestamp(LocalDateTime.now());
        MessageEntity savedMessage = messageRepository.save(message);
        messagingTemplate.convertAndSendToUser(message.getReceiverId(), "/private", savedMessage);
        return savedMessage;
    }

    @Override
    public MessageDTO sendMessage(MessageDTO messageDTO) {
        if (messageDTO.getTimestamp() == null) {
            messageDTO.setTimestamp(LocalDateTime.now());
        }

        MessageEntity message = messageDTO.toEntity();
        MessageEntity savedMessage = messageRepository.save(message);

        MessageDTO savedDTO = MessageDTO.fromEntity(savedMessage);
        messagingTemplate.convertAndSendToUser(savedDTO.getReceiverId(), "/private", savedDTO);

        return savedDTO;
    }

    @Override
    public List<MessageDTO> getMessagesBetweenUsersAsDTO(String senderId, String receiverId) {
        return messageRepository.findAllMessagesBetweenUsers(senderId, receiverId).stream()
                .map(MessageDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<ConversationDTO> getConversationSummaries(String userId) {
        List<MessageEntity> messages = messageRepository.findAllMessagesForUser(userId);
        Set<String> conversationIds = new HashSet<>();

        for (MessageEntity message : messages) {
            if (message.getSenderId().equals(userId)) {
                conversationIds.add(message.getReceiverId());
            } else {
                conversationIds.add(message.getSenderId());
            }
        }

        List<ConversationDTO> conversations = new ArrayList<>();

        for (String partnerId : conversationIds) {
            List<MessageEntity> conversationMessages = messageRepository.findAllMessagesBetweenUsers(userId, partnerId);

            if (!conversationMessages.isEmpty()) {
                MessageEntity lastMessage = conversationMessages.get(conversationMessages.size() - 1);

                long unreadCount = conversationMessages.stream()
                        .filter(m -> m.getReceiverId().equals(userId) && !m.isSeen())
                        .count();

                ConversationDTO conversation = ConversationDTO.builder()
                        .userId(partnerId)
                        .userName("User " + partnerId)
                        .lastMessage(lastMessage.getContent())
                        .lastMessageTime(lastMessage.getTimestamp())
                        .hasUnread(unreadCount > 0)
                        .unreadCount((int) unreadCount)
                        .build();

                conversations.add(conversation);
            }
        }

        conversations.sort(Comparator.comparing(ConversationDTO::getLastMessageTime).reversed());

        return conversations;
    }

    @Override
    public void markMessagesAsRead(String receiverId, String senderId) {
        // Mark all messages from senderId to receiverId as read
        List<MessageEntity> unreadMessages = messageRepository.findAllMessagesBetweenUsers(receiverId, senderId)
                .stream()
                .filter(message -> message.getSenderId().equals(senderId) && message.getReceiverId().equals(receiverId) && !message.isSeen())
                .collect(Collectors.toList());

        for (MessageEntity message : unreadMessages) {
            message.setSeen(true);
        }

        if (!unreadMessages.isEmpty()) {
            messageRepository.saveAll(unreadMessages);
        }
    }
}
