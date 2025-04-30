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
    private final WebSocketService webSocketService;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, WebSocketService webSocketService) {
        this.notificationRepository = notificationRepository;
        this.webSocketService = webSocketService;
    }

    @KafkaListener(topics = "notification-topic", groupId = "${spring.kafka.group-noti-id}",
            containerFactory = "notiListenerContainerFactory")
    public void listenNotification(String message) {
        System.out.println("Received notification message: " + message);

        String[] parts = message.split(":", 2);
        if (parts.length == 2) {
            String userId = parts[0];
            String messageContent = parts[1];

            NotificationEntity notification = NotificationEntity.builder()
                    .toUserId(userId)
                    .message(messageContent)
                    .isRead(false)
                    .createdAt(new Date())
                    .build();

            notification = notificationRepository.save(notification);
            System.out.println("Notification saved for user: " + userId);

            // Send via WebSocket
            if ("admin".equalsIgnoreCase(userId)) {
                // Send to admin topic
                webSocketService.sendAdminNotification(notification);
            } else {
                // Send to specific user
                webSocketService.sendUserNotification(userId, notification);
            }
        } else {
            System.out.println("Invalid message format: " + message);
        }
    }

    public List<NotificationEntity> getNotificationsForUser(String userId) {
        return notificationRepository.findByToUserIdOrderByCreatedAtDesc(userId);
    }

    public List<NotificationEntity> getUnreadNotificationsForUser(String userId) {
        return notificationRepository.findByToUserIdAndIsReadOrderByCreatedAtDesc(userId, false);
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
}