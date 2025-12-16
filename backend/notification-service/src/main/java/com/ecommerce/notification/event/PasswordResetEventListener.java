package com.ecommerce.notification.event;

import com.ecommerce.common.event.PasswordResetEvent;
import com.ecommerce.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordResetEventListener {

    private final EmailService emailService;

    @KafkaListener(topics = "password-reset-topic", groupId = "notification-group", containerFactory = "passwordResetListenerContainerFactory")
    public void handlePasswordResetEvent(PasswordResetEvent event) {
        log.info("Received password reset event for: {}", event.getEmail());

        String resetLink = "http://localhost:4200/reset-password?token=" + event.getResetToken();

        String emailBody = String.format(
                """
                        <h1>Password Reset Request</h1>
                        <p>Hello %s,</p>
                        <p>You requested a password reset. Please click the link below to reset your password:</p>
                        <a href="%s" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                        <p>This link is valid for 15 minutes.</p>
                        <p>If you did not request this, please ignore this email.</p>
                        """,
                event.getName(), resetLink);

        emailService.sendHtmlEmail(event.getEmail(), "Password Reset Request", emailBody);
    }
}
