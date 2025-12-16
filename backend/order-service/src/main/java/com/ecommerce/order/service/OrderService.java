package com.ecommerce.order.service;

import com.ecommerce.common.event.OrderEvent;
import com.ecommerce.order.dto.*;
import com.ecommerce.order.entity.Order;
import com.ecommerce.order.entity.OrderItem;
import com.ecommerce.order.enums.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersByUserId(String userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getUserShippingAddresses(String userId) {
        return orderRepository.findDistinctShippingAddressesByUserId(userId);
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        return convertToDto(order);
    }

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request, String userId) {
        log.info("Creating order for user: {}", userId);
        String orderNumber = "ORD-" + System.currentTimeMillis();

        // 1. Convertir les items
        List<OrderItem> orderItems = request.getItems().stream()
                .map(itemDto -> {
                    OrderItem orderItem = new OrderItem();
                    orderItem.setProductId(itemDto.getProductId());
                    orderItem.setProductName(itemDto.getProductName());
                    orderItem.setQuantity(itemDto.getQuantity());
                    orderItem.setPriceAtPurchase(itemDto.getPrice());
                    return orderItem;
                })
                .collect(Collectors.toList());

        // 2. CALCULER LE SOUS-TOTAL (Prix * Quantité)
        BigDecimal calculatedSubtotal = orderItems.stream()
                .map(item -> item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. RECUPERER ET APPLIQUER LA REDUCTION
        BigDecimal discount = BigDecimal.ZERO;
        if (request.getDiscount() != null) {
            discount = request.getDiscount();
        }

        // 4. CALCULER LE TOTAL FINAL
        BigDecimal finalTotal = calculatedSubtotal.subtract(discount);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0)
            finalTotal = BigDecimal.ZERO;

        log.info("💰 Price Calculation: Subtotal={} - Discount={} = FinalTotal={}",
                calculatedSubtotal, discount, finalTotal);

        // 5. Créer la commande
        Order order = Order.builder()
                .userId(userId)
                .orderNumber(orderNumber)
                .status(OrderStatus.PENDING)
                .totalAmount(finalTotal) // ✅ Utiliser le total recalculé
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod())
                .promoCode(request.getPromoCode())
                .discount(discount)
                .build();

        for (OrderItem item : orderItems) {
            order.addItem(item);
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully: {}", savedOrder.getOrderNumber());

        publishOrderEvent(savedOrder, "OrderCreated");

        return convertToDto(savedOrder);
    }

    @Transactional
    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new RuntimeException("Order not found");
        }
        orderRepository.deleteById(id);
        log.info("Order deleted: {}", id);
    }

    private void publishOrderEvent(Order order, String eventType) {
        OrderEvent event = OrderEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .timestamp(LocalDateTime.now())
                .orderId(order.getId().toString())
                .userId(order.getUserId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .build();

        kafkaTemplate.send("order-events", event);
    }

    // Méthode utilitaire convertToDto rendue publique ou utilisée en interne
    public OrderDto convertToDto(Order order) {
        return OrderDto.fromEntity(order);
    }

    private OrderItemDto convertItemToDto(OrderItem item) {
        return OrderItemDto.fromEntity(item);
    }
}
