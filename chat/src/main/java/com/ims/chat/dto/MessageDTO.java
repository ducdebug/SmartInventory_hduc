package com.ims.chat.dto;

import com.ims.chat.entity.MessageEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private Long id;
    private String senderId;
    private String receiverId;
    private String content;
    private LocalDateTime timestamp;
    private boolean read;

    private String senderName;
    private String receiverName;

    public static MessageDTO fromEntity(MessageEntity entity) {
        return MessageDTO.builder()
                .id(entity.getId())
                .senderId(entity.getSenderId())
                .receiverId(entity.getReceiverId())
                .content(entity.getContent())
                .timestamp(entity.getTimestamp())
                .read(entity.isSeen())
                .build();
    }

    public MessageEntity toEntity() {
        MessageEntity entity = new MessageEntity();
        entity.setId(this.id);
        entity.setSenderId(this.senderId);
        entity.setReceiverId(this.receiverId);
        entity.setContent(this.content);
        entity.setTimestamp(this.timestamp);
        entity.setSeen(this.read);
        return entity;
    }
}
