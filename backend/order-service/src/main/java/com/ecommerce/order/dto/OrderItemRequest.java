package com.ecommerce.order.dto;

import lombok.Data;

@Data
public class OrderItemRequest {
    private Long productId;
    private String productName;
    private Integer quantity;
    private Double priceAtPurchase;
}



