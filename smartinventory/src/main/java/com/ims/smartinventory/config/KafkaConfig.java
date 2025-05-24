package com.ims.smartinventory.config;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

import java.util.HashMap;
import java.util.Map;

@EnableKafka
@Configuration
public class KafkaConfig {

    @Value(value = "${spring.kafka.server-config}")
    private String serversConfig;

    @Bean
    public ProducerFactory<String, Object> notiProducerFactory() {
        Map<String, Object> configMap = new HashMap<>();
        configMap.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, serversConfig);
        configMap.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configMap.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        
        // Add timeout configurations to prevent hanging
        configMap.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 5000); // 5 seconds
        configMap.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 10000); // 10 seconds
        configMap.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, 3000); // 3 seconds max wait
        configMap.put(ProducerConfig.RETRIES_CONFIG, 0); // Don't retry on failure
        
        return new DefaultKafkaProducerFactory<>(configMap);
    }

    @Bean
    public KafkaTemplate<String, Object> notiKafkaTemplate() {
        return new KafkaTemplate<>(notiProducerFactory());
    }
}