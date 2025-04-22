package com.ims.smartinventory.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationProducerService {

    @Value("${spring.kafka.notification-topic}")
    private String notificationTopic;

    private final KafkaTemplate<String, Object> notiKafkaTemplate;

    @Autowired
    public NotificationProducerService(KafkaTemplate<String, Object> notiKafkaTemplate) {
        this.notiKafkaTemplate = notiKafkaTemplate;
    }

    public void sendNotification(String userId, String message) {
        String notificationMessage = userId + ":" + message;
        notiKafkaTemplate.send(notificationTopic, notificationMessage);
    }
}