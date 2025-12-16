package com.ecommerce.cart.service;

import com.ecommerce.cart.dto.*;
import com.ecommerce.cart.entity.Cart;
import com.ecommerce.cart.entity.CartItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheckoutService {

    private final CartService cartService;
    private final RestTemplate restTemplate;

    @Value("${order-service.url:http://localhost:8083}")
    private String orderServiceUrl;

    @Value("${product-service.url:http://localhost:8082}")
    private String productServiceUrl;

    public Map<String, Object> checkout(String userId, CheckoutRequest request, String jwtToken) {
        // 1. Récupération du panier
        Cart cart = cartService.getCart(userId);

        if (cart == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty or not found");
        }

        log.info("🛒 Starting checkout for user {} with {} items", userId, cart.getItems().size());

        // 2. Validation du Stock (Lecture seule pour vérifier)
        validateStock(cart.getItems(), jwtToken);

        // 3. Création de la commande
        OrderResponse order = createOrder(userId, cart, request, jwtToken);

        // 4. Mise à jour réelle du stock (Écriture)
        updateProductStock(cart.getItems(), jwtToken);

        // 5. Vider le panier
        cartService.clearCart(userId);

        log.info("✅ Checkout completed successfully. Order ID: {}", order.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Order created successfully");
        response.put("order", order);

        return response;
    }

    public Map<String, Object> checkoutDirect(String userId, DirectCheckoutRequest request, String jwtToken) {
        log.info("🚀 Starting DIRECT checkout for user {} - Product: {}, Quantity: {}",
                userId, request.getProductId(), request.getQuantity());

        // 1. Fetch Product Details (to ensure price integrity)
        HttpHeaders headers = createHeaders(jwtToken);
        String url = productServiceUrl + "/" + request.getProductId();
        
        // We need manually fetch product to create a transient cart item
        ResponseEntity<Map> productResponse;
        try {
            productResponse = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
        } catch (HttpClientErrorException.NotFound e) {
             throw new IllegalArgumentException("Product not found");
        }

        Map<String, Object> productData = productResponse.getBody();
        if (productData == null) throw new IllegalArgumentException("Product data unavailable");
        
        // Parse Product Data
        Long id = ((Number) productData.get("id")).longValue();
        String name = (String) productData.get("name");
        Double priceVal = ((Number) productData.get("price")).doubleValue();
        java.math.BigDecimal price = java.math.BigDecimal.valueOf(priceVal);
        String imageUrl = (String) productData.get("imageUrl"); // Adjust if it's 'images' list

        // 2. Create Transient Cart (Not saved to Redis)
        Cart transientCart = Cart.builder()
                .userId(userId)
                .items(new java.util.ArrayList<>())
                .createdAt(java.time.LocalDateTime.now())
                .updatedAt(java.time.LocalDateTime.now())
                .build();
        
        CartItem item = CartItem.builder()
                .productId(id)
                .productName(name)
                .price(price)
                .quantity(request.getQuantity())
                .imageUrl(imageUrl)
                .build();
        
        transientCart.addItem(item);
        transientCart.calculateTotal();

        // 3. Validate Stock
        validateStock(transientCart.getItems(), jwtToken);

        // 4. Create Order (Using the transient cart)
        OrderResponse order = createOrder(userId, transientCart, request, jwtToken);

        // 5. Update Stock
        updateProductStock(transientCart.getItems(), jwtToken);

        // NOTE: We DO NOT clear the persistent cart here!

        log.info("✅ Direct Checkout completed successfully. Order ID: {}", order.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Direct Order created successfully");
        response.put("order", order);

        return response;
    }

    private void validateStock(List<CartItem> items, String jwtToken) {
        log.info("📦 Validating stock for {} items", items.size());

        HttpHeaders headers = createHeaders(jwtToken);

        for (CartItem item : items) {
            try {
                String url = productServiceUrl + "/" + item.getProductId();

                ResponseEntity<Map> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        new HttpEntity<>(headers),
                        Map.class
                );

                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                    Map<String, Object> product = response.getBody();
                    Number stockQtyNum = (Number) product.get("stockQuantity");
                    int stockQuantity = stockQtyNum != null ? stockQtyNum.intValue() : 0;

                    if (stockQuantity < item.getQuantity()) {
                        throw new IllegalArgumentException(
                                String.format("Stock insuffisant pour : %s (Demandé: %d, Dispo: %d)",
                                        item.getProductName(), item.getQuantity(), stockQuantity)
                        );
                    }
                }
            } catch (HttpClientErrorException.NotFound e) {
                throw new IllegalArgumentException("Produit introuvable : " + item.getProductName());
            } catch (Exception e) {
                log.warn("⚠️ Erreur validation stock pour {}: {}", item.getProductId(), e.getMessage());
                if (e instanceof IllegalArgumentException) throw e;
            }
        }
    }

    private OrderResponse createOrder(String userId, Cart cart, CheckoutRequest request, String jwtToken) {
        log.info("📝 Creating order in Order Service");

        List<OrderItemDto> orderItems = cart.getItems().stream()
                .map(item -> OrderItemDto.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        CreateOrderRequest orderRequest = CreateOrderRequest.builder()
                .userId(userId) // Indispensable
                .items(orderItems)
                .totalAmount(cart.getTotalAmount())
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod())
                .promoCode(cart.getPromoCode())
                .discount(cart.getDiscount())
                .build();

        HttpHeaders headers = createHeaders(jwtToken);
        HttpEntity<CreateOrderRequest> entity = new HttpEntity<>(orderRequest, headers);

        try {
            String url = orderServiceUrl + "/api/orders";

            ResponseEntity<OrderResponse> response = restTemplate.postForEntity(
                    url,
                    entity,
                    OrderResponse.class
            );

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("Order Service returned non-created status: " + response.getStatusCode());
            }
        } catch (HttpClientErrorException e) {
            log.error("❌ Order Service Error: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Failed to create order: " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ System Error creating order: {}", e.getMessage());
            throw new RuntimeException("System error during checkout");
        }
    }

    // ✅ IMPLEMENTATION DE LA MISE A JOUR DU STOCK
    private void updateProductStock(List<CartItem> items, String jwtToken) {
        log.info("📉 Updating stock for {} items...", items.size());

        HttpHeaders headers = createHeaders(jwtToken);

        for (CartItem item : items) {
            try {
                // Appel PATCH /api/products/{id}/stock/reduce?quantity=X
                String url = String.format("%s/%d/stock/reduce?quantity=%d",
                        productServiceUrl, item.getProductId(), item.getQuantity());

                restTemplate.exchange(
                        url,
                        HttpMethod.PATCH, // Utilisation de PATCH
                        new HttpEntity<>(headers),
                        Void.class
                );

                log.debug("✅ Stock reduced for product {}", item.getProductId());

            } catch (Exception e) {
                // IMPORTANT : Dans une architecture distribuée sans Saga Pattern complet,
                // si la mise à jour du stock échoue après la création de la commande,
                // on a une incohérence.
                // Ici, on loggue une erreur CRITIQUE pour intervention manuelle.
                log.error("🚨 CRITICAL: Failed to update stock for product {} after order placement! Error: {}",
                        item.getProductId(), e.getMessage());
            }
        }
    }

    private HttpHeaders createHeaders(String jwtToken) {
        HttpHeaders headers = new HttpHeaders();
        if (jwtToken != null && !jwtToken.isEmpty()) {
            String token = jwtToken.startsWith("Bearer ") ? jwtToken : "Bearer " + jwtToken;
            headers.set("Authorization", token);
        }
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
