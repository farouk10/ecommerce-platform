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
    private final org.springframework.web.client.RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Value("${services.product-url}")
    private String productServiceUrl;

    @org.springframework.beans.factory.annotation.Value("${services.auth-url}")
    private String authServiceUrl;

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
        OrderDto dto = convertToDto(order);
        enrichWithUserInfo(dto);
        enrichWithProductInfo(dto);
        return dto;
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

    // --- Admin Methods ---

    public AdminStatsDto getAdminStats() {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0);

        int totalProducts = 0;
        try {
            Long count = restTemplate.getForObject(productServiceUrl + "/count", Long.class);
            if (count != null) {
                totalProducts = count.intValue();
            }
        } catch (Exception e) {
            log.error("Error fetching product count: {}", e.getMessage());
        }

        return AdminStatsDto.builder()
                .totalOrders((int) orderRepository.count())
                .totalRevenue(orderRepository.sumTotalRevenue())
                .pendingOrders((int) orderRepository.countByStatus(OrderStatus.PENDING))
                .confirmedOrders((int) orderRepository.countByStatus(OrderStatus.CONFIRMED))
                .processingOrders((int) orderRepository.countByStatus(OrderStatus.PROCESSING))
                .shippedOrders((int) orderRepository.countByStatus(OrderStatus.SHIPPED))
                .deliveredOrders((int) orderRepository.countByStatus(OrderStatus.DELIVERED))
                .ordersThisMonth((int) orderRepository.countOrdersSince(startOfMonth))
                .revenueThisMonth(orderRepository.sumRevenueSince(startOfMonth))
                .totalProducts(totalProducts)
                .totalUsers(0)
                .build();
    }

    public List<OrderDto> getAllOrders() {
        List<Order> orders = orderRepository.findAll(org.springframework.data.domain.Sort
                .by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return orders.stream().map(order -> {
            OrderDto dto = convertToDto(order);
            enrichWithUserInfo(dto);
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public OrderDto updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        Order saved = orderRepository.save(order);
        // Maybe publish event?
        publishOrderEvent(saved, "OrderStatusUpdated");
        return convertToDto(saved);
    }

    private void enrichWithUserInfo(OrderDto dto) {
        if (dto.getUserId() != null) {
            try {
                // Fetch user from Auth Service
                java.util.Map user = restTemplate.getForObject(authServiceUrl + "/internal/users/" + dto.getUserId(),
                        java.util.Map.class);
                if (user != null) {
                    dto.setClientName((String) user.get("name"));
                    dto.setClientEmail((String) user.get("email"));
                    dto.setClientPhone((String) user.get("phoneNumber"));
                }
            } catch (Exception e) {
                log.error("Error fetching user info for order {}: {}", dto.getId(), e.getMessage());
            }
        }
    }

    private void enrichWithProductInfo(OrderDto dto) {
        if (dto.getItems() == null || dto.getItems().isEmpty())
            return;

        try {
            List<Long> productIds = dto.getItems().stream()
                    .map(OrderItemDto::getProductId)
                    .collect(Collectors.toList());

            // Call Product Service Batch API
            // Assuming ProductDto has imageUrl field and id
            // POST /api/products/batch
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            org.springframework.http.HttpEntity<List<Long>> request = new org.springframework.http.HttpEntity<>(
                    productIds, headers);

            List<java.util.Map> products = restTemplate.postForObject(productServiceUrl + "/batch", request,
                    List.class);

            if (products != null) {
                // Map product ID to Image URL
                java.util.Map<Long, String> imageMap = new java.util.HashMap<>();
                for (Object p : products) {
                    java.util.Map productMap = (java.util.Map) p;
                    Long id = ((Number) productMap.get("id")).longValue();
                    String url = (String) productMap.get("imageUrl");
                    imageMap.put(id, url);
                }

                // Update Items
                dto.getItems().forEach(item -> {
                    if (imageMap.containsKey(item.getProductId())) {
                        item.setImageUrl(imageMap.get(item.getProductId()));
                    }
                });
            }

        } catch (Exception e) {
            log.error("Error fetching product info for order {}: {}", dto.getId(), e.getMessage());
        }
    }

    private OrderItemDto convertItemToDto(OrderItem item) {
        return OrderItemDto.fromEntity(item);
    }

    // --- New Stats Methods ---

    @Transactional(readOnly = true)
    public List<TopProductDto> getTopSellingProducts(int limit) {
        return orderRepository.findTopSellingProducts(org.springframework.data.domain.PageRequest.of(0, limit));
    }

    @Transactional(readOnly = true)
    public List<Object> getRevenueStats(String type, LocalDateTime startDate, LocalDateTime endDate) {
        if ("DAILY".equalsIgnoreCase(type)) {
            if (endDate == null)
                endDate = LocalDateTime.now();
            if (startDate == null)
                startDate = endDate.minusDays(7);

            return new java.util.ArrayList<>(orderRepository.findDailyRevenueBetween(startDate, endDate));
        } else {
            // Default MONTHLY
            if (startDate == null)
                startDate = LocalDateTime.now().minusMonths(12).withDayOfMonth(1);
            return new java.util.ArrayList<>(orderRepository.findMonthlyRevenueSince(startDate));
        }
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getRecentOrders(int limit) {
        org.springframework.data.domain.Page<Order> page = orderRepository.findAll(
                org.springframework.data.domain.PageRequest.of(0, limit,
                        org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return page.getContent().stream().map(order -> {
            OrderDto dto = convertToDto(order);
            enrichWithUserInfo(dto);
            return dto;
        }).collect(Collectors.toList());
    }
}
