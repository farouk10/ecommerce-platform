package com.ecommerce.notification.service;

//import com.ecommerce.notification.event.OrderEvent;
import com.ecommerce.common.event.OrderEvent;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderEventListener {

    private final com.ecommerce.notification.service.EmailService emailService;
    private final com.ecommerce.notification.client.UserClient userClient;

    @KafkaListener(topics = "order-events", groupId = "notification-service", containerFactory = "orderEventKafkaListenerContainerFactory")
    public void handleOrderEvent(OrderEvent event) {
        log.info("📩 Received order event: {}", event.getEventType());
        log.info("Order ID: {}, User ID: {}, Amount: {}",
                event.getOrderId(), event.getUserId(), event.getTotalAmount());

        try {
            switch (event.getEventType()) {
                case "OrderCreated":
                    sendOrderConfirmationEmail(event);
                    break;
                case "PaymentCompleted":
                    sendPaymentConfirmationEmail(event);
                    break;
                case "OrderShipped":
                    sendShippingNotificationEmail(event);
                    break;
                default:
                    log.warn("Unknown event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error processing order event: {}", e.getMessage(), e);
        }
    }

    private void sendOrderConfirmationEmail(OrderEvent event) {
        log.info("✉️  Processing order confirmation for order: {}", event.getOrderId());

        try {
            // 1. Fetch User Details
            var user = userClient.getUser(event.getUserId());
            if (user == null || user.getEmail() == null) {
                log.warn("❌ Could not find user email for userId: {}", event.getUserId());
                return;
            }

            // 2. Compose Email
            String subject = "Confirmation de commande - " + event.getOrderId();
            String trackingUrl = "http://localhost:4200/orders/" + event.getOrderId();

            // Translate status
            String statusFr = "En attente";
            String statusColor = "#f59e0b"; // Orange/Amber default

            if ("PAID".equalsIgnoreCase(event.getStatus()) || "CONFIRMED".equalsIgnoreCase(event.getStatus())) {
                statusFr = "Confirmée";
                statusColor = "#10b981"; // Green
            } else if ("SHIPPED".equalsIgnoreCase(event.getStatus())) {
                statusFr = "Expédiée";
                statusColor = "#3b82f6"; // Blue
            } else if ("DELIVERED".equalsIgnoreCase(event.getStatus())) {
                statusFr = "Livrée";
                statusColor = "#10b981"; // Green
            } else if ("CANCELLED".equalsIgnoreCase(event.getStatus())) {
                statusFr = "Annulée";
                statusColor = "#ef4444"; // Red
            }

            String body = String.format(
                    """
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <style>
                                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 0; }
                                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                                    .header { background: linear-gradient(135deg, #6366f1 0%%, #8b5cf6 100%%); padding: 30px; text-align: center; color: white; }
                                    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; }
                                    .content { padding: 40px 30px; color: #334155; }
                                    .greeting { font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #1e293b; }
                                    .message { font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
                                    .order-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 30px; }
                                    .order-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; }
                                    .order-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; padding-top: 10px; border-top: 2px solid #e2e8f0; font-weight: 700; font-size: 18px; margin-top: 5px; }
                                    .label { color: #64748b; font-weight: 500; }
                                    .value { color: #0f172a; font-weight: 600; text-align: right; }
                                    .button { display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; transition: background-color 0.3s; box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2); }
                                    .button:hover { background-color: #4f46e5; }
                                    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1>E-SHOP</h1>
                                    </div>
                                    <div class="content">
                                        <div class="greeting">Bonjour %s,</div>
                                        <div class="message">
                                            Nous avons le plaisir de vous confirmer que votre commande a bien été reçue !<br>
                                            Notre équipe prépare votre colis avec le plus grand soin.
                                        </div>

                                        <div class="order-card">
                                            <div class="order-row">
                                                <span class="label">Numéro de commande : </span>
                                                <span class="value">%s</span>
                                            </div>
                                            <div class="order-row">
                                                <span class="label">Statut : </span>
                                                <span class="value" style="color: %s;">%s</span>
                                            </div>
                                            <div class="order-row">
                                                <span class="label">Total : </span>
                                                <span class="value">%.2f MAD</span>
                                            </div>
                                        </div>

                                        <div style="text-align: center;">
                                            <a href="%s" class="button">Suivre ma commande</a>
                                        </div>
                                    </div>
                                    <div class="footer">
                                        <p>© 2025 E-Shop Platform. Tous droits réservés.</p>
                                        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                            """,
                    user.getName(), event.getOrderId(), statusColor, statusFr, event.getTotalAmount(), trackingUrl); // 3.
                                                                                                                     // Send
                                                                                                                     // Email
            emailService.sendHtmlEmail(user.getEmail(), subject, body);

        } catch (Exception e) {
            log.error("Failed to send confirmation email", e);
        }
    }

    private void sendPaymentConfirmationEmail(OrderEvent event) {
        log.info("✉️  Sending payment confirmation email for order: {}", event.getOrderId());
    }

    private void sendShippingNotificationEmail(OrderEvent event) {
        log.info("✉️  Sending shipping notification email for order: {}", event.getOrderId());
    }
}
