package com.ecommerce.notification.client;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserClient {

    private final RestTemplate restTemplate;

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    public UserDto getUser(String userId) {
        String url = authServiceUrl + "/api/internal/users/" + userId;
        try {
            return restTemplate.getForObject(url, UserDto.class);
        } catch (Exception e) {
            log.error("Failed to fetch user details for ID: {}", userId, e);
            throw new RuntimeException("Could not fetch user details", e);
        }
    }

    @Data
    public static class UserDto {
        private String id;
        private String email;
        private String name;
        private String role;
    }
}
