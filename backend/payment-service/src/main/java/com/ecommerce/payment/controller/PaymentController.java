package com.ecommerce.payment.controller;

import com.ecommerce.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<com.ecommerce.payment.dto.PaymentResponse> initiatePayment(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody Map<String, Object> request) {

        Long orderId = Long.valueOf(request.get("orderId").toString());
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        String currency = (String) request.get("currency");

        com.ecommerce.payment.dto.PaymentResponse response = paymentService.initiatePayment(orderId, amount, currency,
                idempotencyKey);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        paymentService.handleWebhook(payload, sigHeader);
        return ResponseEntity.ok("Received");
    }

    @PostMapping("/verify/{orderId}")
    public ResponseEntity<Boolean> verifyPayment(@PathVariable Long orderId) {
        boolean isPaid = paymentService.verifyPaymentStatus(orderId);
        return ResponseEntity.ok(isPaid);
    }
}
