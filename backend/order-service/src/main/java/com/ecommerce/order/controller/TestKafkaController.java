package com.ecommerce.order.controller;

import com.ecommerce.common.event.OrderEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class TestKafkaController {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    @PostMapping("/test-kafka")
    public Map<String, String> testKafka() {
        String orderId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();

        OrderEvent event = OrderEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("OrderCreated")
                .timestamp(LocalDateTime.now())
                .orderId(orderId)           // ✅ String
                .userId(userId)             // ✅ String
                .totalAmount(new BigDecimal("199.99"))
                .status("PENDING")
                .build();

        kafkaTemplate.send("order-events", event);

        return Map.of(
                "status", "SUCCESS",
                "message", "Event published to Kafka!",
                "eventId", event.getEventId(),
                "orderId", orderId
        );
    }
}
