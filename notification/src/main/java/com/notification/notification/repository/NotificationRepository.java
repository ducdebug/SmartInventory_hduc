package com.notification.notification.repository;

import com.notification.notification.entity.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    
    /**
     * Find all notifications for a user ordered by creation date (newest first)
     */
    List<NotificationEntity> findByToUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Find notifications for a user filtered by read status, ordered by creation date (newest first)
     */
    List<NotificationEntity> findByToUserIdAndIsReadOrderByCreatedAtDesc(String userId, Boolean isRead);
    
    /**
     * Count total notifications for a user
     */
    int countByToUserId(String userId);
    
    /**
     * Count notifications for a user filtered by read status
     */
    int countByToUserIdAndIsRead(String userId, Boolean isRead);
}