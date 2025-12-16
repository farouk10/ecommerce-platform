package com.ecommerce.cart.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RedisHash("carts")
public class Cart implements Serializable {

    @Id
    private String userId;

    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    private BigDecimal subtotal; // Sous-total avant réduction
    private BigDecimal totalAmount; // Total après réduction

    // Promo Code fields
    private String promoCode;
    private BigDecimal discount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonIgnore
    @TimeToLive
    @Builder.Default
    private Long ttl = 604800L; // 7 days

    public void addItem(CartItem item) {
        for (CartItem existingItem : items) {
            if (existingItem.getProductId().equals(item.getProductId())) {
                existingItem.setQuantity(existingItem.getQuantity() + item.getQuantity());
                calculateTotal();
                return;
            }
        }
        items.add(item);
        calculateTotal();
    }

    public void removeItem(Long productId) {
        items.removeIf(item -> item.getProductId().equals(productId));
        calculateTotal();
    }

    public void updateItemQuantity(Long productId, Integer quantity) {
        for (CartItem item : items) {
            if (item.getProductId().equals(productId)) {
                item.setQuantity(quantity);
                calculateTotal();
                return;
            }
        }
    }

    public void calculateTotal() {
        this.subtotal = items.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        // Recalculer avec promo code si présent
        if (discount != null && discount.compareTo(BigDecimal.ZERO) > 0) {
            this.totalAmount = subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP);
        } else {
            this.totalAmount = subtotal;
        }
    }

    public void applyPromoCode(PromoCode promo) {
        if (!promo.isValid()) {
            throw new IllegalArgumentException("Promo code is expired");
        }

        // Vérifier montant minimum
        if (promo.getMinAmount() != null && subtotal.compareTo(promo.getMinAmount()) < 0) {
            throw new IllegalArgumentException(
                    String.format("Minimum amount required: %.2f", promo.getMinAmount())
            );
        }

        this.promoCode = promo.getCode();

        // Calculer réduction
        BigDecimal calculatedDiscount = subtotal
                .multiply(promo.getDiscountPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Appliquer réduction maximale si définie
        if (promo.getMaxDiscount() != null && calculatedDiscount.compareTo(promo.getMaxDiscount()) > 0) {
            calculatedDiscount = promo.getMaxDiscount();
        }

        this.discount = calculatedDiscount;
        this.totalAmount = subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP);
    }

    public void removePromoCode() {
        this.promoCode = null;
        this.discount = null;
        calculateTotal();
    }

    public void clear() {
        items.clear();
        subtotal = BigDecimal.ZERO;
        totalAmount = BigDecimal.ZERO;
        promoCode = null;
        discount = null;
    }
}
