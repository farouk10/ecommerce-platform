package com.ecommerce.cart.client;

import com.ecommerce.cart.dto.ProductDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductClient {

    private final RestTemplate restTemplate;

    @Value("${product-service.url:http://localhost:8082/api/products}")
    private String productServiceUrl;

    public List<ProductDto> getProductsByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            HttpEntity<List<Long>> request = new HttpEntity<>(ids);
            ResponseEntity<List<ProductDto>> response = restTemplate.exchange(
                    productServiceUrl + "/batch",
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<List<ProductDto>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching products from service: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public ProductDto getProductById(Long id) {
        try {
            return restTemplate.getForObject(productServiceUrl + "/" + id, ProductDto.class);
        } catch (Exception e) {
            log.error("Error fetching product {}: {}", id, e.getMessage());
            return null;
        }
    }
}
