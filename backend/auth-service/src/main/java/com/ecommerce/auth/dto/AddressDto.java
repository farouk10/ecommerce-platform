package com.ecommerce.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {
    private Long id;
    private String fullName;
    private String street;
    private String city;
    private String postalCode;
    private String country;
    @com.ecommerce.auth.validation.ValidPhoneNumber
    private String phoneNumber;
    private boolean isDefault;
}
