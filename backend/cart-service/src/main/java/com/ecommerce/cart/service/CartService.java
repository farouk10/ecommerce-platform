package com.ecommerce.cart.service;

import com.ecommerce.cart.dto.AddToCartRequest;
import com.ecommerce.cart.entity.Cart;
import com.ecommerce.cart.entity.CartItem;
import com.ecommerce.cart.entity.PromoCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import java.util.List;
import com.ecommerce.cart.client.ProductClient; // Added import

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final RedisTemplate<String, Cart> redisTemplate;
    private final PromoCodeService promoCodeService;
    private final ProductClient productClient;

    private static final String CART_KEY_PREFIX = "cart:";
    private static final long CART_TTL_DAYS = 7;

    public Cart getCart(String userId) {
        String key = CART_KEY_PREFIX + userId;
        Cart cart = redisTemplate.opsForValue().get(key);

        if (cart == null) {
            log.info("Creating new cart for user: {}", userId);
            cart = Cart.builder()
                    .userId(userId)
                    .subtotal(BigDecimal.ZERO)
                    .totalAmount(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            saveCart(cart);
        } else {
            // ✅ SYNC WITH PRODUCT SERVICE
            syncCartWithProducts(cart);
        }

        return cart;
    }

    private void syncCartWithProducts(Cart cart) {
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            return;
        }

        List<Long> productIds = cart.getItems().stream()
                .map(CartItem::getProductId)
                .toList();

        List<com.ecommerce.cart.dto.ProductDto> products = productClient.getProductsByIds(productIds);
        java.util.Map<Long, com.ecommerce.cart.dto.ProductDto> productMap = products.stream()
                .collect(java.util.stream.Collectors.toMap(com.ecommerce.cart.dto.ProductDto::getId, p -> p));

        boolean changed = false;
        java.util.Iterator<CartItem> iterator = cart.getItems().iterator();

        while (iterator.hasNext()) {
            CartItem item = iterator.next();
            com.ecommerce.cart.dto.ProductDto product = productMap.get(item.getProductId());

            if (product == null) {
                iterator.remove();
                changed = true;
                continue;
            }

            if (!product.getName().equals(item.getProductName())) {
                item.setProductName(product.getName());
                changed = true;
            }

            if (product.getPrice().compareTo(item.getPrice()) != 0) {
                log.info("Price changed for product {}: {} -> {}", item.getProductId(), item.getPrice(), product.getPrice());
                item.setPrice(product.getPrice());
                changed = true;
            }

            if (product.getStockQuantity() < item.getQuantity()) {
                if (product.getStockQuantity() == 0) {
                    iterator.remove();
                } else {
                    item.setQuantity(product.getStockQuantity());
                }
                changed = true;
            }
        }

        if (changed) {
            cart.calculateTotal(); // Fixed method name
            saveCart(cart);
        }
    }

    public Cart addItem(String userId, AddToCartRequest request) {
        Cart cart = getCart(userId);

        com.ecommerce.cart.dto.ProductDto product = productClient.getProductById(request.getProductId());
        if (product == null) {
            throw new RuntimeException("Product not found");
        }
        if (product.getStockQuantity() < request.getQuantity()) {
            throw new RuntimeException("Insufficient stock. Available: " + product.getStockQuantity());
        }

        CartItem item = CartItem.builder()
                .productId(product.getId())
                .productName(product.getName())
                .price(product.getPrice())
                .quantity(request.getQuantity())
                .imageUrl(product.getImages() != null && !product.getImages().isEmpty() ? product.getImages().get(0) : null)
                .images(product.getImages())
                .build();

        cart.addItem(item);
        cart.calculateTotal(); // Fixed method name
        cart.setUpdatedAt(LocalDateTime.now());

        saveCart(cart);
        return cart;
    }

    public Cart updateItemQuantity(String userId, Long productId, Integer quantity) {
        Cart cart = getCart(userId);

        com.ecommerce.cart.dto.ProductDto product = productClient.getProductById(productId);
        if (product != null && product.getStockQuantity() < quantity) {
             throw new RuntimeException("Insufficient stock. Available: " + product.getStockQuantity());
        }

        if (quantity <= 0) {
            cart.removeItem(productId);
        } else {
            cart.updateItemQuantity(productId, quantity);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(cart);
        return cart;
    }

    public Cart removeItem(String userId, Long productId) {
        Cart cart = getCart(userId);
        cart.removeItem(productId);
        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(cart);
        return cart;
    }

    public void clearCart(String userId) {
        Cart cart = getCart(userId);
        cart.clear();
        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(cart);
    }

    public void deleteCart(String userId) {
        String key = CART_KEY_PREFIX + userId;
        redisTemplate.delete(key);
    }

    public Cart applyPromoCode(String userId, String code) {
        Cart cart = getCart(userId);
        PromoCode promo = promoCodeService.validatePromoCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired promo code"));
        cart.applyPromoCode(promo);
        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(cart);
        return cart;
    }

    public Cart removePromoCode(String userId) {
        Cart cart = getCart(userId);
        cart.removePromoCode();
        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(cart);
        return cart;
    }

    private void saveCart(Cart cart) {
        cart.calculateTotal(); // Fixed method name
        String key = CART_KEY_PREFIX + cart.getUserId();
        redisTemplate.opsForValue().set(key, cart, CART_TTL_DAYS, TimeUnit.DAYS);
    }
}
