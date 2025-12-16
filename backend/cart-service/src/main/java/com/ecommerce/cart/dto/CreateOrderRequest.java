package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    // ✅ CE CHAMP EST INDISPENSABLE POUR CheckoutService
    private String userId;

    private List<OrderItemDto> items;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String paymentMethod;
    private String promoCode;
    private BigDecimal discount;
}
