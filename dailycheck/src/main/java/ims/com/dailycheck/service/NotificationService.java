package ims.com.dailycheck.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Service for sending notifications to administrators via Kafka
 */
@Service
public class NotificationService {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    @Value("${spring.kafka.notification-topic}")
    private String notificationTopic;
    
    @Value("${admin.userId}")
    private String adminUserId;

    @Autowired
    public NotificationService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Send a notification to the system administrator
     *
     * @param message The notification message
     */
    public void notifyAdmin(String message) {
        String notificationMessage = adminUserId + ":" + message;
        kafkaTemplate.send(notificationTopic, notificationMessage);
    }
}
