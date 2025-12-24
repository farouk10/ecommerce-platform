package com.ecommerce.payment.service;

import com.ecommerce.common.event.PaymentCapturedEvent;
import com.ecommerce.common.event.PaymentFailedEvent;
import com.ecommerce.payment.entity.Payment;
import com.ecommerce.payment.entity.PaymentStatus;
import com.ecommerce.payment.repository.PaymentRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    // 1. Initiate Payment (Idempotent)
    @Transactional
    public com.ecommerce.payment.dto.PaymentResponse initiatePayment(Long orderId, BigDecimal amount, String currency,
            String idempotencyKey) {
        log.info("Initiating payment for Order ID: {}", orderId);

        // Idempotency Check
        Optional<Payment> existing = paymentRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            log.info("Returning existing payment for key: {}", idempotencyKey);
            Payment p = existing.get();
            // We need to retrieve the intent again to get the client_secret if needed for
            // frontend re-render
            // Or we assume the frontend has it. For safety, let's retrieve it if status is
            // not final.
            String clientSecret = "";
            if (p.getStatus() == PaymentStatus.INITIATED) {
                try {
                    PaymentIntent pi = PaymentIntent.retrieve(p.getStripePaymentIntentId());
                    clientSecret = pi.getClientSecret();
                } catch (StripeException e) {
                    log.error("Failed to retrieve existing intent", e);
                }
            }

            return com.ecommerce.payment.dto.PaymentResponse.builder()
                    .paymentId(p.getId())
                    .stripePaymentIntentId(p.getStripePaymentIntentId())
                    .clientSecret(clientSecret)
                    .status(p.getStatus())
                    .amount(p.getAmount())
                    .currency(p.getCurrency())
                    .build();
        }

        try {
            // Create Stripe PaymentIntent
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amount.multiply(new BigDecimal("100")).longValue()) // Stripe expects cents
                    .setCurrency(currency.toLowerCase())
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build())
                    .putMetadata("orderId", orderId.toString())
                    .build();

            PaymentIntent intent = PaymentIntent.create(params,
                    com.stripe.net.RequestOptions.builder().setIdempotencyKey(idempotencyKey).build());

            // Save Local State: INITIATED
            Payment payment = Payment.builder()
                    .orderId(orderId)
                    .amount(amount)
                    .currency(currency)
                    .paymentMethod("stripe")
                    .status(PaymentStatus.INITIATED)
                    .stripePaymentIntentId(intent.getId())
                    .idempotencyKey(idempotencyKey)
                    .build();

            paymentRepository.save(payment);

            return com.ecommerce.payment.dto.PaymentResponse.builder()
                    .paymentId(payment.getId())
                    .stripePaymentIntentId(intent.getId())
                    .clientSecret(intent.getClientSecret())
                    .status(payment.getStatus())
                    .amount(payment.getAmount())
                    .currency(payment.getCurrency())
                    .build();

        } catch (StripeException e) {
            log.error("Stripe Error: ", e);
            throw new RuntimeException("Failed to initiate payment with Stripe", e);
        }
    }

    // 2. Handle Stripe Webhook (Async State Update)
    @Transactional
    public void handleWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (Exception e) {
            log.error("Webhook Signature Verification Failed", e);
            throw new RuntimeException("Invalid Webhook Signature");
        }

        switch (event.getType()) {
            case "payment_intent.succeeded":
                handlePaymentSucceeded(event);
                break;
            case "payment_intent.payment_failed":
                handlePaymentFailed(event);
                break;
            default:
                log.info("Unhandled event type: {}", event.getType());
        }
    }

    private void handlePaymentSucceeded(Event event) {
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
        if (intent == null)
            return;

        processSucceededPayment(intent.getId());
    }

    // Refactored to be reusable by manual verification
    private void processSucceededPayment(String stripePaymentIntentId) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(stripePaymentIntentId)
                .orElseThrow(() -> new RuntimeException("Payment not found for Intent ID: " + stripePaymentIntentId));

        if (payment.getStatus() == PaymentStatus.CAPTURED) {
            log.info("Payment already captured: {}", payment.getId());
            return;
        }

        // State Transition: AUTHORIZED -> CAPTURED
        payment.setStatus(PaymentStatus.CAPTURED);
        paymentRepository.save(payment);

        // Publish Event for Order Service
        PaymentCapturedEvent eventData = new PaymentCapturedEvent(
                payment.getOrderId(),
                payment.getId().toString(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStripePaymentIntentId());
        kafkaTemplate.send("payment-captured", eventData); // Key, Value
        log.info("Published PaymentCapturedEvent for Order: {}", payment.getOrderId());
    }

    private void handlePaymentFailed(Event event) {
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
        if (intent == null)
            return;

        paymentRepository.findByStripePaymentIntentId(intent.getId())
                .ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setErrorMessage(
                            intent.getLastPaymentError() != null ? intent.getLastPaymentError().getMessage()
                                    : "Unknown Error");
                    paymentRepository.save(payment);

                    // Publish Failed Event
                    kafkaTemplate.send("payment-failed", new PaymentFailedEvent(payment.getOrderId(),
                            payment.getId().toString(), payment.getErrorMessage()));
                });
    }

    // 3. Manual Verification Endpoint Logic
    @Transactional
    public boolean verifyPaymentStatus(Long orderId) {
        // Find the latest payment attempt for this order
        Optional<Payment> paymentOpt = paymentRepository.findByOrderId(orderId).stream()
                .sorted((p1, p2) -> p2.getId().compareTo(p1.getId())) // Get latest
                .findFirst();

        if (paymentOpt.isEmpty()) {
            log.warn("No payment found for order {}", orderId);
            return false;
        }
        Payment payment = paymentOpt.get();

        if (payment.getStatus() == PaymentStatus.CAPTURED) {
            return true;
        }

        try {
            PaymentIntent intent = PaymentIntent.retrieve(payment.getStripePaymentIntentId());
            if ("succeeded".equals(intent.getStatus())) {
                log.info("Manually verified payment success for order {}", orderId);
                processSucceededPayment(intent.getId());
                return true;
            } else {
                log.info("Payment status for order {} is {}", orderId, intent.getStatus());
            }
        } catch (StripeException e) {
            log.error("Error retrieving Stripe Intent for verification", e);
        }
        return false;
    }
}
