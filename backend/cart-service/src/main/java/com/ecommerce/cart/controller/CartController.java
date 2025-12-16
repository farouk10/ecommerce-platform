package com.ecommerce.cart.controller;

import com.ecommerce.cart.dto.AddToCartRequest;
import com.ecommerce.cart.dto.ApplyPromoCodeRequest;
import com.ecommerce.cart.dto.UpdateCartItemRequest;
import com.ecommerce.cart.dto.DirectCheckoutRequest;
import com.ecommerce.cart.entity.Cart;
import com.ecommerce.cart.service.CartService;
import com.ecommerce.cart.dto.CheckoutRequest;
import com.ecommerce.cart.service.CheckoutService;
import org.springframework.web.bind.annotation.RequestHeader;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Slf4j
public class CartController {

    private final CartService cartService;
    private final CheckoutService checkoutService;

    @GetMapping
    public ResponseEntity<Cart> getCart(Authentication authentication) {
        String userId = authentication.getName();
        log.info("Requesting cart for user: {}", userId);
        Cart cart = cartService.getCart(userId);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/items")
    public ResponseEntity<Cart> addItem(
            Authentication authentication,
            @RequestBody AddToCartRequest request) {
        String userId = authentication.getName();
        log.info("Adding item to cart for user: {}", userId);

        Cart cart = cartService.addItem(userId, request);
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<Cart> updateItem(
            Authentication authentication,
            @PathVariable Long productId,
            @RequestBody UpdateCartItemRequest request) {
        String userId = authentication.getName();
        log.info("Updating item {} quantity to {} for user: {}",
                productId, request.getQuantity(), userId);

        Cart cart = cartService.updateItemQuantity(userId, productId, request.getQuantity());
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<Cart> removeItem(
            Authentication authentication,
            @PathVariable Long productId) {
        String userId = authentication.getName();
        log.info("Removing item {} from cart for user: {}", productId, userId);

        Cart cart = cartService.removeItem(userId, productId);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/promo")
    public ResponseEntity<?> applyPromoCode(
            Authentication authentication,
            @RequestBody ApplyPromoCodeRequest request) {
        String userId = authentication.getName();
        log.info("🎟️ Applying promo code {} for user: {}", request.getCode(), userId);

        try {
            Cart cart = cartService.applyPromoCode(userId, request.getCode());
            log.info("✅ Promo code applied successfully");
            return ResponseEntity.ok(cart);
        } catch (IllegalArgumentException e) {
            log.warn("❌ Promo code error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @DeleteMapping("/promo")
    public ResponseEntity<Cart> removePromoCode(Authentication authentication) {
        String userId = authentication.getName();
        log.info("Removing promo code for user: {}", userId);

        Cart cart = cartService.removePromoCode(userId);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            Authentication authentication,
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody CheckoutRequest request) {

        String userId = authentication.getName();
        log.info("🛍️ Checkout initiated for user: {}", userId);

        try {
            // Extract JWT token
            String jwtToken = authorizationHeader.replace("Bearer ", "");

            // Validate request
            if (request.getShippingAddress() == null || request.getShippingAddress().isBlank()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Shipping address is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            if (request.getPaymentMethod() == null || request.getPaymentMethod().isBlank()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Payment method is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Process checkout
            Map<String, Object> response = checkoutService.checkout(userId, request, jwtToken);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("❌ Checkout validation error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("❌ Checkout failed: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Checkout failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/checkout/direct")
    public ResponseEntity<?> checkoutDirect(
            Authentication authentication,
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody DirectCheckoutRequest request) {

        String userId = authentication.getName();
        log.info("🚀 Direct Checkout initiated for user: {}", userId);

        try {
            String jwtToken = authorizationHeader.replace("Bearer ", "");

            if (request.getShippingAddress() == null || request.getShippingAddress().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Shipping address is required"));
            }
            if (request.getProductId() == null || request.getQuantity() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Product ID and Quantity are required"));
            }

            Map<String, Object> response = checkoutService.checkoutDirect(userId, request, jwtToken);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("❌ Direct Checkout validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Direct Checkout failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Checkout failed: " + e.getMessage()));
        }
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        String userId = authentication.getName();
        log.info("Clearing cart for user: {}", userId);

        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
