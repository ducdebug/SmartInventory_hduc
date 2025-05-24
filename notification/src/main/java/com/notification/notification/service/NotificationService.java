package com.notification.notification.service;

import com.notification.notification.entity.NotificationEntity;
import com.notification.notification.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/**
 * Service for managing notifications following SOLID principles
 * Single Responsibility: Handles notification business logic
 * Open/Closed: Can be extended for new notification types
 * Liskov Substitution: Can be substituted by other notification implementations
 * Interface Segregation: Focused on notification operations only
 * Dependency Inversion: Depends on abstractions (Repository interfaces)
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationDispatchService dispatchService;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, 
                             NotificationDispatchService dispatchService) {
        this.notificationRepository = notificationRepository;
        this.dispatchService = dispatchService;
    }

    /**
     * Listen for Kafka messages and process notifications
     * Delegated parsing and dispatching to separate services
     */
    @KafkaListener(topics = "notification-topic", groupId = "${spring.kafka.group-noti-id}",
            containerFactory = "notiListenerContainerFactory")
    public void processIncomingNotification(String message) {
        System.out.println("\n🔔 === KAFKA NOTIFICATION RECEIVED ===");
        System.out.println("📥 Raw message: " + message);

        try {
            NotificationEntity notification = parseKafkaMessage(message);
            NotificationEntity savedNotification = saveNotification(notification);
            dispatchService.dispatch(savedNotification);
            System.out.println("=== KAFKA PROCESSING COMPLETE ===\n");
        } catch (Exception e) {
            System.err.println("❌ Failed to process notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Parse Kafka message into NotificationEntity
     * Single Responsibility: Message parsing logic
     */
    private NotificationEntity parseKafkaMessage(String message) {
        String[] parts = message.split(":", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid message format. Expected: userId:message");
        }

        String userId = parts[0];
        String messageContent = parts[1];
        
        System.out.println("👤 Parsed User ID: '" + userId + "'");
        System.out.println("💬 Parsed Message: '" + messageContent + "'");

        return NotificationEntity.builder()
                .toUserId(userId)
                .message(messageContent)
                .isRead(false)
                .createdAt(new Date())
                .build();
    }

    /**
     * Save notification to database
     */
    public NotificationEntity saveNotification(NotificationEntity notification) {
        NotificationEntity saved = notificationRepository.save(notification);
        System.out.println("💾 Notification saved to database with ID: " + saved.getId());
        return saved;
    }

    /**
     * Retrieve notifications for a specific user
     */
    public List<NotificationEntity> getNotificationsForUser(String userId) {
        return notificationRepository.findByToUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Retrieve unread notifications for a specific user
     */
    public List<NotificationEntity> getUnreadNotificationsForUser(String userId) {
        return notificationRepository.findByToUserIdAndIsReadOrderByCreatedAtDesc(userId, false);
    }

    /**
     * Get notification by ID
     */
    public NotificationEntity getNotificationById(Long notificationId) {
        return notificationRepository.findById(notificationId).orElse(null);
    }

    /**
     * Mark a single notification as read
     */
    public boolean markNotificationAsRead(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .map(notification -> {
                    notification.markAsRead();
                    notificationRepository.save(notification);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Mark all notifications as read for a user
     */
    public int markAllNotificationsAsRead(String userId) {
        List<NotificationEntity> unreadNotifications = getUnreadNotificationsForUser(userId);
        
        unreadNotifications.forEach(notification -> {
            notification.markAsRead();
            notificationRepository.save(notification);
        });
        
        return unreadNotifications.size();
    }

    /**
     * Get total notification count for user
     */
    public int getTotalNotificationCount(String userId) {
        return notificationRepository.countByToUserId(userId);
    }

    /**
     * Get unread notification count for user
     */
    public int getUnreadNotificationCount(String userId) {
        return notificationRepository.countByToUserIdAndIsRead(userId, false);
    }
}
