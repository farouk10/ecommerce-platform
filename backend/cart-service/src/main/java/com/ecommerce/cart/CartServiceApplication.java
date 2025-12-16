package com.ecommerce.cart;

import com.ecommerce.cart.service.PromoCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableCaching
@RequiredArgsConstructor
public class CartServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CartServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedData(PromoCodeService promoCodeService) {
        return args -> {
            promoCodeService.seedPromoCodes();
        };
    }
}
