package com.notification.notification.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Date;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "notifications")
public class NotificationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @JsonProperty("userId")
    private String toUserId;

    @Column(nullable = false)
    @JsonProperty("content")
    private String message;

    @Column
    @JsonProperty("isRead")
    private Boolean isRead;

    @Column
    @JsonProperty("createdAt")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private Date createdAt;

    @Column
    @JsonProperty("type")
    private String type = "notification";

    @Column
    @JsonProperty("relatedId")
    private String relatedId;

    @Column
    @JsonProperty("imgUrl")
    private String imgUrl;

    @Builder
    public NotificationEntity(String toUserId, String message, Boolean isRead, Date createdAt, String type, String relatedId, String imgUrl) {
        this.toUserId = toUserId;
        this.message = message;
        this.isRead = isRead != null ? isRead : false;
        this.createdAt = createdAt != null ? createdAt : new Date();
        this.type = type != null ? type : "notification";
        this.relatedId = relatedId;
        this.imgUrl = imgUrl;
    }

    public void markAsRead() {
        this.isRead = true;
    }

    // Additional getters for JSON serialization compatibility
    @JsonProperty("content")
    public String getContent() {
        return this.message;
    }

    @JsonProperty("userId")
    public String getUserId() {
        return this.toUserId;
    }
}
