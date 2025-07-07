package com.notification.notification.service;

import com.notification.notification.entity.NotificationEntity;
import com.notification.notification.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

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

    public NotificationEntity saveNotification(NotificationEntity notification) {
        NotificationEntity saved = notificationRepository.save(notification);
        System.out.println("💾 Notification saved to database with ID: " + saved.getId());
        return saved;
    }

    public List<NotificationEntity> getNotificationsForUser(String userId) {
        return notificationRepository.findByToUserIdOrderByCreatedAtDesc(userId);
    }

    public List<NotificationEntity> getUnreadNotificationsForUser(String userId) {
        return notificationRepository.findByToUserIdAndIsReadOrderByCreatedAtDesc(userId, false);
    }

    public NotificationEntity getNotificationById(Long notificationId) {
        return notificationRepository.findById(notificationId).orElse(null);
    }

    public boolean markNotificationAsRead(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .map(notification -> {
                    notification.markAsRead();
                    notificationRepository.save(notification);
                    return true;
                })
                .orElse(false);
    }

    public int markAllNotificationsAsRead(String userId) {
        List<NotificationEntity> unreadNotifications = getUnreadNotificationsForUser(userId);

        unreadNotifications.forEach(notification -> {
            notification.markAsRead();
            notificationRepository.save(notification);
        });

        return unreadNotifications.size();
    }

    public int getTotalNotificationCount(String userId) {
        return notificationRepository.countByToUserId(userId);
    }

    public int getUnreadNotificationCount(String userId) {
        return notificationRepository.countByToUserIdAndIsRead(userId, false);
    }
}
