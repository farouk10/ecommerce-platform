package com.ecommerce.order.controller;

import com.ecommerce.order.dto.AdminStatsDto;
import com.ecommerce.order.dto.OrderDto;
import com.ecommerce.order.entity.Order;
import com.ecommerce.order.enums.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final OrderRepository orderRepository;
    private final org.springframework.web.client.RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Value("${services.product-url}")
    private String productServiceUrl;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getAdminStats() {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0);

        int totalProducts = 0;
        try {
            Long count = restTemplate.getForObject(productServiceUrl + "/count", Long.class);
            if (count != null) {
                totalProducts = count.intValue();
            }
        } catch (Exception e) {
            System.err.println("Error fetching product count: " + e.getMessage());
        }

        AdminStatsDto stats = AdminStatsDto.builder()
                .totalOrders((int) orderRepository.count())
                .totalRevenue(orderRepository.sumTotalRevenue())
                // Stats par statut
                .pendingOrders((int) orderRepository.countByStatus(OrderStatus.PENDING))
                .confirmedOrders((int) orderRepository.countByStatus(OrderStatus.CONFIRMED))
                .processingOrders((int) orderRepository.countByStatus(OrderStatus.PROCESSING))
                .shippedOrders((int) orderRepository.countByStatus(OrderStatus.SHIPPED))
                .deliveredOrders((int) orderRepository.countByStatus(OrderStatus.DELIVERED))
                // Performance du mois
                .ordersThisMonth((int) orderRepository.countOrdersSince(startOfMonth))
                .revenueThisMonth(orderRepository.sumRevenueSince(startOfMonth))
                .totalProducts(totalProducts)
                .totalUsers(0)
                .build();

        return ResponseEntity.ok(stats);
    }

    @org.springframework.beans.factory.annotation.Value("${services.auth-url}")
    private String authServiceUrl;

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDto>> getAllOrders() {
        List<Order> orders = orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));

        List<OrderDto> dtos = orders.stream().map(order -> {
            OrderDto dto = OrderDto.fromEntity(order);
            // Enrich with user info
            enrichWithUserInfo(dto);
            return dto;
        }).toList();

        return ResponseEntity.ok(dtos);
    }

    private void enrichWithUserInfo(OrderDto dto) {
        if (dto.getUserId() != null) {
            try {
                // Fetch user from Auth Service
                // Assumes UserDto has name, email, phoneNumber
                Map user = restTemplate.getForObject(authServiceUrl + "/internal/users/" + dto.getUserId(), Map.class);
                if (user != null) {
                    dto.setClientName((String) user.get("name"));
                    dto.setClientEmail((String) user.get("email"));
                    dto.setClientPhone((String) user.get("phoneNumber"));
                }
            } catch (Exception e) {
                // Log error but don't fail, just leave fields null
                System.err.println("Error fetching user info for order " + dto.getId() + ": " + e.getMessage());
            }
        }
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        OrderDto dto = OrderDto.fromEntity(order);
        enrichWithUserInfo(dto);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        try {
            OrderStatus newStatus = OrderStatus.valueOf(request.get("status"));
            order.setStatus(newStatus);
            orderRepository.save(order);
            return ResponseEntity.ok(OrderDto.fromEntity(order));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status"));
        }
    }
}
