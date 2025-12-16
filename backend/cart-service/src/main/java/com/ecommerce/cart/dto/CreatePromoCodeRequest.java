package com.ecommerce.cart.dto;

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
public class CreatePromoCodeRequest {
    private String code;
    private String description;
    private BigDecimal discountPercent;
    private LocalDateTime expiresAt;
    private BigDecimal minAmount;
    private BigDecimal maxDiscount;
}

