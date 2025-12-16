package com.ecommerce.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String name;
    @com.ecommerce.auth.validation.ValidPhoneNumber
    private String phoneNumber;
    private String address;
    private String avatarUrl;
    private String bio;
}
