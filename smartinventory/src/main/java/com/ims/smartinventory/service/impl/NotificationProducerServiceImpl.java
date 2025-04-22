package com.ims.smartinventory.service.impl;

import com.ims.smartinventory.service.NotificationProducerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import javax.management.Notification;

@Service
public class NotificationProducerServiceImpl implements NotificationProducerService {

    @Value("${spring.kafka.notification-topic}")
    private String notificationTopic;

    private final KafkaTemplate<String, Object> notiKafkaTemplate;

    @Autowired
    public NotificationProducerServiceImpl(KafkaTemplate<String, Object> notiKafkaTemplate) {
        this.notiKafkaTemplate = notiKafkaTemplate;
    }

    @Override
    public void sendNotification(String userId, String message) {
        String notificationMessage = userId + ":" + message;
        notiKafkaTemplate.send(notificationTopic, notificationMessage);
    }
}