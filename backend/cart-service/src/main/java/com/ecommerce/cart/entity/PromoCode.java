package com.ecommerce.cart.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RedisHash("promo_codes")
public class PromoCode implements Serializable {

    @Id
    private String code; // Code = ID (ex: WELCOME10)

    private String description; // Ex: "New customer welcome discount"
    private BigDecimal discountPercent;
    private LocalDateTime expiresAt;
    private BigDecimal minAmount; // Montant minimum
    private BigDecimal maxDiscount; // Réduction maximale
    private Boolean active; // Active/Inactive
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonIgnore
    @TimeToLive
    private Long ttl; // Auto-expire in Redis

    public boolean isValid() {
        return active != null && active &&
                expiresAt != null && expiresAt.isAfter(LocalDateTime.now());
    }

    public void calculateTTL() {
        if (expiresAt != null) {
            long seconds = java.time.Duration.between(LocalDateTime.now(), expiresAt).getSeconds();
            this.ttl = seconds > 0 ? seconds : null;
        }
    }
}
