package com.notification.notification.entity;

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
    private String toUserId;

    @Column(nullable = false)
    private String message;

    @Column
    private Boolean isRead;

    @Column
    private Date createdAt;
    
    @Builder
    public NotificationEntity(String toUserId, String message, Boolean isRead, Date createdAt) {
        this.toUserId = toUserId;
        this.message = message;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }
    
    public void markAsRead() {
        this.isRead = true;
    }
}