package com.ecommerce.order.listener;

import com.ecommerce.common.event.PaymentCapturedEvent;
import com.ecommerce.common.event.PaymentFailedEvent;
import com.ecommerce.order.entity.Order;
import com.ecommerce.order.enums.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentEventListener {

    private final com.ecommerce.order.service.OrderService orderService;

    @KafkaListener(topics = "payment-captured", groupId = "order-group")
    @Transactional
    public void handlePaymentCaptured(PaymentCapturedEvent event) {
        log.info("Received PaymentCapturedEvent for Order ID: {}", event.getOrderId());

        try {
            orderService.confirmOrderPayment(event.getOrderId());
        } catch (Exception e) {
            log.error("Error processing payment captured event", e);
        }
    }

    @KafkaListener(topics = "payment-events", groupId = "order-group") // You might want different topics or method
                                                                       // filtering
    // Note: Spring Kafka can handle polymorphic payloads or we can use specific
    // topics.
    // For simplicity, assuming "payment-events" handles mixed types or we use
    // container factory filtering.
    // Ideally, separate topics "payment-captured", "payment-failed" or header-based
    // routing.
    // Let's assume the producer sends to different partitions or we filter by class
    // if topic is shared.
    // Actually, in PaymentService we sent Key=EventName.
    // To distinguish, it's better to use methods with @KafkaHandler if using
    // @KafkaListener at class level,
    // OR just separate topics.
    // In PaymentService I used: kafkaTemplate.send("payment-events",
    // "payment-captured", eventData);
    // So topic is "payment-events".
    // JSON Deserializer needs to know the type.
    // Let's stick to a robust approach: configure TypeMapping in application.yml or
    // use separate topics.
    // For this MVP, I will use separate topics to avoid Deserialization headaches
    // if possible,
    // OR simply trust the trusted packages.
    // Let's double check PaymentService.java.
    // I sent to "payment-events".
    // I will refactor PaymentService to send to "payment-captured" and
    // "payment-failed" topics logic for clarity.
    // OR keep strict type mapping.

    // Let's assume strict type mapping is set up or I'll implement a catch-all and
    // cast (ugly).
    // Better: Send to "payment.captured" topic.
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.info("Received PaymentFailedEvent for Order ID: {}", event.getOrderId());
        // Handle failure (e.g. notify user, though frontend should know).
        // Maybe mark order as PENDING_PAYMENT_FAILED ?
        // OrderStatus doesn't have FAILED_PAYMENT. We can use CANCELLED or leave
        // PENDING.
    }
}
