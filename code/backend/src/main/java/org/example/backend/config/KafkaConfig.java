package org.example.backend.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Configuration
@ConditionalOnProperty(name = "app.events.publisher", havingValue = "kafka")
public class KafkaConfig {

    @Bean
    public NewTopic testRunJobsTopic() {
        return TopicBuilder.name("test-run-jobs")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public org.springframework.kafka.core.ProducerFactory<String, String> producerFactory() {
        java.util.Map<String, Object> configProps = new java.util.HashMap<>();
        configProps.put(org.apache.kafka.clients.producer.ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        configProps.put(org.apache.kafka.clients.producer.ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, org.apache.kafka.common.serialization.StringSerializer.class);
        configProps.put(org.apache.kafka.clients.producer.ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, org.apache.kafka.common.serialization.StringSerializer.class);
        return new org.springframework.kafka.core.DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public org.springframework.kafka.core.KafkaTemplate<String, String> kafkaTemplate(
            org.springframework.kafka.core.ProducerFactory<String, String> producerFactory) {
        return new org.springframework.kafka.core.KafkaTemplate<>(producerFactory);
    }
}
