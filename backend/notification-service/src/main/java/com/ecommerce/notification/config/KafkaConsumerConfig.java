package com.ecommerce.notification.config;

import com.ecommerce.common.event.OrderEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ConsumerFactory<String, OrderEvent> orderEventConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "notification-service");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        // Utiliser ErrorHandlingDeserializer pour wrapper JsonDeserializer
        ErrorHandlingDeserializer<OrderEvent> errorHandlingDeserializer = new ErrorHandlingDeserializer<>(
                createJsonDeserializer());

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                errorHandlingDeserializer);
    }

    private JsonDeserializer<OrderEvent> createJsonDeserializer() {
        JsonDeserializer<OrderEvent> deserializer = new JsonDeserializer<>(OrderEvent.class);
        deserializer.addTrustedPackages(
                "com.ecommerce.common.event",
                "com.ecommerce.order.event",
                "*" // Optionnel: permet de désérialiser tous les packages
        );
        deserializer.setUseTypeHeaders(false); // Important: ne pas utiliser les headers de type
        return deserializer;
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderEvent> orderEventKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, OrderEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(orderEventConsumerFactory());

        // Configurer le gestionnaire d'erreurs
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
                (consumerRecord, exception) -> {
                    // Loguer l'erreur
                    System.err.println("Erreur lors du traitement du message Kafka: " + exception.getMessage());
                },
                new FixedBackOff(1000L, 3) // 3 tentatives avec 1 seconde d'intervalle
        );

        // Ignorer les erreurs de désérialisation (ne pas réessayer)
        errorHandler.addNotRetryableExceptions(org.apache.kafka.common.errors.SerializationException.class);

        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }

    @Bean
    public ConsumerFactory<String, com.ecommerce.common.event.PasswordResetEvent> passwordResetConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "notification-service");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        JsonDeserializer<com.ecommerce.common.event.PasswordResetEvent> deserializer = new JsonDeserializer<>(
                com.ecommerce.common.event.PasswordResetEvent.class);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);

        ErrorHandlingDeserializer<com.ecommerce.common.event.PasswordResetEvent> errorHandlingDeserializer = new ErrorHandlingDeserializer<>(
                deserializer);

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                errorHandlingDeserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, com.ecommerce.common.event.PasswordResetEvent> passwordResetListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, com.ecommerce.common.event.PasswordResetEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(passwordResetConsumerFactory());
        return factory;
    }
}