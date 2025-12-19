package com.ecommerce.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String email;
    private String name;
    private String role;
    private String oauthProvider;
    private String phoneNumber;
    private String address;
    private String avatarUrl;
    private String bio;
    private boolean enabled;
    private String createdAt;
}
