package com.ecommerce.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCapturedEvent {
    private Long orderId;
    private String paymentId;
    private BigDecimal amount;
    private String currency;
    private String stripePaymentIntentId;
}
