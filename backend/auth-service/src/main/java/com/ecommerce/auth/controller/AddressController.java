package com.ecommerce.auth.controller;

import com.ecommerce.auth.dto.AddressDto;
import com.ecommerce.auth.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<List<AddressDto>> getUserAddresses(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(addressService.getUserAddresses(userId));
    }

    @PostMapping
    public ResponseEntity<AddressDto> addAddress(
            Authentication authentication,
            @jakarta.validation.Valid @RequestBody AddressDto addressDto) {

        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(addressService.addAddress(userId, addressDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(
            Authentication authentication,
            @PathVariable Long id) {
        UUID userId = UUID.fromString(authentication.getName());
        addressService.deleteAddress(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressDto> updateAddress(
            Authentication authentication,
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody AddressDto addressDto) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(addressService.updateAddress(userId, id, addressDto));
    }
}
