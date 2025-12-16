package com.ecommerce.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderEvent {
    private String eventId;
    private String eventType; // OrderCreated, PaymentCompleted, OrderShipped
    private LocalDateTime timestamp;
    private String orderId;      // Changed from UUID to String
    private String userId;       // Changed from UUID to String
    private BigDecimal totalAmount;
    private String status;
}
