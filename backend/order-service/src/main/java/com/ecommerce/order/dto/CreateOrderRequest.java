package com.ecommerce.order.dto;

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
    private List<OrderItemDto> items;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String paymentMethod;
    private String promoCode;     // ← NOUVEAU
    private BigDecimal discount;   // ← NOUVEAU
}
