package com.ecommerce.cart.service;

import com.ecommerce.cart.dto.CreatePromoCodeRequest;
import com.ecommerce.cart.dto.UpdatePromoCodeRequest;
import com.ecommerce.cart.entity.PromoCode;
import com.ecommerce.cart.repository.PromoCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;

    // CREATE
    public PromoCode createPromoCode(CreatePromoCodeRequest request) {
        // Vérifier si le code existe déjà
        if (promoCodeRepository.existsById(request.getCode().toUpperCase())) {
            throw new IllegalArgumentException("Promo code already exists: " + request.getCode());
        }

        PromoCode promoCode = PromoCode.builder()
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .discountPercent(request.getDiscountPercent())
                .expiresAt(request.getExpiresAt())
                .minAmount(request.getMinAmount())
                .maxDiscount(request.getMaxDiscount())
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        promoCode.calculateTTL();

        PromoCode saved = promoCodeRepository.save(promoCode);
        log.info("✅ Created promo code: {}", saved.getCode());

        return saved;
    }

    // READ ONE
    public Optional<PromoCode> getPromoCode(String code) {
        return promoCodeRepository.findById(code.toUpperCase());
    }

    // READ ALL
    public List<PromoCode> getAllPromoCodes() {
        return StreamSupport.stream(promoCodeRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());
    }

    // READ ACTIVE ONLY
    public List<PromoCode> getActivePromoCodes() {
        return getAllPromoCodes().stream()
                .filter(PromoCode::isValid)
                .collect(Collectors.toList());
    }

    // UPDATE
    public PromoCode updatePromoCode(String code, UpdatePromoCodeRequest request) {
        PromoCode promoCode = promoCodeRepository.findById(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Promo code not found: " + code));

        if (request.getDescription() != null) {
            promoCode.setDescription(request.getDescription());
        }
        if (request.getDiscountPercent() != null) {
            promoCode.setDiscountPercent(request.getDiscountPercent());
        }
        if (request.getExpiresAt() != null) {
            promoCode.setExpiresAt(request.getExpiresAt());
            promoCode.calculateTTL();
        }
        if (request.getMinAmount() != null) {
            promoCode.setMinAmount(request.getMinAmount());
        }
        if (request.getMaxDiscount() != null) {
            promoCode.setMaxDiscount(request.getMaxDiscount());
        }
        if (request.getActive() != null) {
            promoCode.setActive(request.getActive());
        }

        promoCode.setUpdatedAt(LocalDateTime.now());

        PromoCode updated = promoCodeRepository.save(promoCode);
        log.info("✏️ Updated promo code: {}", updated.getCode());

        return updated;
    }

    // DELETE
    public void deletePromoCode(String code) {
        if (!promoCodeRepository.existsById(code.toUpperCase())) {
            throw new IllegalArgumentException("Promo code not found: " + code);
        }

        promoCodeRepository.deleteById(code.toUpperCase());
        log.info("🗑️ Deleted promo code: {}", code);
    }

    // VALIDATE (for cart usage)
    public Optional<PromoCode> validatePromoCode(String code) {
        Optional<PromoCode> promoOpt = promoCodeRepository.findById(code.toUpperCase());

        if (promoOpt.isEmpty()) {
            log.warn("Promo code not found: {}", code);
            return Optional.empty();
        }

        PromoCode promo = promoOpt.get();

        if (!promo.isValid()) {
            log.warn("Promo code invalid or expired: {}", code);
            return Optional.empty();
        }

        log.info("Promo code validated: {}", code);
        return Optional.of(promo);
    }

    // SEED INITIAL DATA (appelé au démarrage)
    public void seedPromoCodes() {
        if (promoCodeRepository.count() == 0) {
            log.info("🌱 Seeding initial promo codes...");

            createPromoCode(CreatePromoCodeRequest.builder()
                    .code("WELCOME10")
                    .description("New customer 10% discount")
                    .discountPercent(BigDecimal.valueOf(10))
                    .expiresAt(LocalDateTime.now().plusMonths(1))
                    .minAmount(BigDecimal.valueOf(50))
                    .maxDiscount(BigDecimal.valueOf(100))
                    .build());

            createPromoCode(CreatePromoCodeRequest.builder()
                    .code("SAVE20")
                    .description("Save 20% on orders over $100")
                    .discountPercent(BigDecimal.valueOf(20))
                    .expiresAt(LocalDateTime.now().plusMonths(1))
                    .minAmount(BigDecimal.valueOf(100))
                    .maxDiscount(BigDecimal.valueOf(200))
                    .build());

            createPromoCode(CreatePromoCodeRequest.builder()
                    .code("VIP50")
                    .description("VIP 50% discount")
                    .discountPercent(BigDecimal.valueOf(50))
                    .expiresAt(LocalDateTime.now().plusMonths(1))
                    .minAmount(BigDecimal.valueOf(500))
                    .maxDiscount(null)
                    .build());

            log.info("✅ Seeded 3 promo codes");
        }
    }
}
