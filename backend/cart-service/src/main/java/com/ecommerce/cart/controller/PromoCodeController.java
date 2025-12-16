package com.ecommerce.cart.controller;

import com.ecommerce.cart.dto.CreatePromoCodeRequest;
import com.ecommerce.cart.dto.UpdatePromoCodeRequest;
import com.ecommerce.cart.entity.PromoCode;
import com.ecommerce.cart.service.PromoCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // ✅ IMPORT AJOUTÉ
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart/promo-codes")
@RequiredArgsConstructor
@Slf4j
public class PromoCodeController {

    private final PromoCodeService promoCodeService;

    // GET all promo codes (admin)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PromoCode>> getAllPromoCodes() {
        List<PromoCode> promoCodes = promoCodeService.getAllPromoCodes();
        return ResponseEntity.ok(promoCodes);
    }

    // GET active promo codes (public)
    @GetMapping("/active")
    public ResponseEntity<List<PromoCode>> getActivePromoCodes() {
        List<PromoCode> promoCodes = promoCodeService.getActivePromoCodes();
        return ResponseEntity.ok(promoCodes);
    }

    // GET one promo code
    @GetMapping("/{code}")
    public ResponseEntity<PromoCode> getPromoCode(@PathVariable String code) {
        return promoCodeService.getPromoCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // CREATE promo code (admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // ✅ SÉCURITÉ AJOUTÉE
    public ResponseEntity<PromoCode> createPromoCode(@RequestBody CreatePromoCodeRequest request) {
        log.info("Creating promo code: {}", request.getCode());

        try {
            PromoCode created = promoCodeService.createPromoCode(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // UPDATE promo code (admin only)
    @PutMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN')") // ✅ SÉCURITÉ AJOUTÉE
    public ResponseEntity<PromoCode> updatePromoCode(
            @PathVariable String code,
            @RequestBody UpdatePromoCodeRequest request) {
        log.info("Updating promo code: {}", code);

        try {
            PromoCode updated = promoCodeService.updatePromoCode(code, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE promo code (admin only)
    @DeleteMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN')") // ✅ SÉCURITÉ AJOUTÉE
    public ResponseEntity<Void> deletePromoCode(@PathVariable String code) {
        log.info("Deleting promo code: {}", code);

        try {
            promoCodeService.deletePromoCode(code);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
