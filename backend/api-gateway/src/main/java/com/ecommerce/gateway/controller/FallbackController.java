package com.ecommerce.gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/products")
    public Mono<Map<String, String>> productServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Product Service is currently unavailable. Please try again later.");
        response.put("status", "503");
        return Mono.just(response);
    }

    @GetMapping("/orders")
    public Mono<Map<String, String>> orderServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Order Service is currently unavailable. Please try again later.");
        response.put("status", "503");
        return Mono.just(response);
    }

    @GetMapping("/auth")
    public Mono<Map<String, String>> authServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Auth Service is currently unavailable. Please try again later.");
        response.put("status", "503");
        return Mono.just(response);
    }
}
