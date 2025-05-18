package com.ims.chat.service.impl;

import com.ims.chat.dto.ConversationDTO;
import com.ims.chat.dto.MessageDTO;
import com.ims.chat.entity.MessageEntity;
import com.ims.chat.repository.MessageRepository;
import com.ims.chat.service.interfaces.MessageService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public List<MessageEntity> getMessagesBetweenUsers(String senderId, String receiverId) {
        return messageRepository.findAllMessagesBetweenUsers(senderId, receiverId);
    }

    @Override
    public List<MessageDTO> getMessagesBetweenUsersAsDTO(String senderId, String receiverId) {
        return getMessagesBetweenUsers(senderId, receiverId).stream()
                .map(MessageDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<MessageEntity> getAllMessagesForUser(String userId) {
        return messageRepository.findAllMessagesForUser(userId);
    }

    @Override
    public Set<String> getAllConversations(String userId) {
        List<MessageEntity> messages = getAllMessagesForUser(userId);
        Set<String> conversationIds = new HashSet<>();

        for (MessageEntity message : messages) {
            if (message.getSenderId().equals(userId)) {
                conversationIds.add(message.getReceiverId());
            } else {
                conversationIds.add(message.getSenderId());
            }
        }

        return conversationIds;
    }

    @Override
    public List<ConversationDTO> getConversationSummaries(String userId) {
        Set<String> conversationIds = getAllConversations(userId);
        List<ConversationDTO> conversations = new ArrayList<>();

        for (String partnerId : conversationIds) {
            List<MessageEntity> messages = messageRepository.findAllMessagesBetweenUsers(userId, partnerId);

            if (!messages.isEmpty()) {
                MessageEntity lastMessage = messages.get(messages.size() - 1);

                long unreadCount = messages.stream()
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
    @Transactional
    public void markMessagesAsRead(String senderId, String receiverId) {
        List<MessageEntity> messages = messageRepository.findAllMessagesBetweenUsers(senderId, receiverId);

        for (MessageEntity message : messages) {
            if (message.getReceiverId().equals(receiverId) && !message.isSeen()
            ) {
                message.setSeen(true);
                messageRepository.save(message);
            }
        }
    }

    @Override
    @Transactional
    public void deleteAllUserMessage(Long userId) {
        String user_id = userId.toString();
        messageRepository.deleteAllMessagesForUser(user_id);
    }
}
