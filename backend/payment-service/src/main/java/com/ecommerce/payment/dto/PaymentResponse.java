package com.ecommerce.payment.dto;

import com.ecommerce.payment.entity.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaymentResponse {
    private Long paymentId;
    private String stripePaymentIntentId;
    private String clientSecret;
    private PaymentStatus status;
    private BigDecimal amount;
    private String currency;
}
