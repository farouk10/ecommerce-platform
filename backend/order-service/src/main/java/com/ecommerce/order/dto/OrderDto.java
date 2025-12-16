package com.ecommerce.order.dto;

import com.ecommerce.order.entity.Order;
import com.ecommerce.order.entity.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
        private Long id;
        private String userId;
        // Client Info (Enriched)
        private String clientName;
        private String clientEmail;
        private String clientPhone;

        private String orderNumber;
        private String status;
        private BigDecimal totalAmount;
        private String shippingAddress;
        private String paymentMethod;
        private String promoCode;
        private BigDecimal discount;
        private List<OrderItemDto> items;
        private Integer totalItems; // ✅ On va remplir ceci
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static OrderDto fromEntity(Order order) {
                // 1. Mapper les items (Conversion Entity -> DTO)
                List<OrderItemDto> mappedItems = (order.getItems() == null) ? List.of()
                                : order.getItems().stream()
                                                .map(OrderItemDto::fromEntity) // Assurez-vous que OrderItemDto a cette
                                                                               // méthode
                                                .collect(Collectors.toList());

                // 2. Calculer le nombre total d'articles
                int totalItemsCount = mappedItems.stream()
                                .mapToInt(OrderItemDto::getQuantity)
                                .sum();

                return OrderDto.builder()
                                .id(order.getId())
                                .userId(order.getUserId())
                                .orderNumber(order.getOrderNumber())
                                .status(order.getStatus().name())
                                .totalAmount(order.getTotalAmount())
                                .shippingAddress(order.getShippingAddress())
                                .paymentMethod(order.getPaymentMethod())
                                .promoCode(order.getPromoCode())
                                .discount(order.getDiscount())

                                // ✅ CORRECTION ICI : On passe la vraie liste et le total calculé
                                .items(mappedItems)
                                .totalItems(totalItemsCount)

                                .createdAt(order.getCreatedAt())
                                .updatedAt(order.getUpdatedAt())
                                .build();
        }
}
