package com.ecommerce.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatewayApplication.class, args);
	}

	@Bean
	public org.springframework.web.cors.reactive.CorsWebFilter corsWebFilter() {
		org.springframework.web.cors.CorsConfiguration corsConfig = new org.springframework.web.cors.CorsConfiguration();
		corsConfig.addAllowedOriginPattern("*");
		corsConfig.setMaxAge(3600L);
		corsConfig.addAllowedMethod("*");
		corsConfig.addAllowedHeader("*");
		corsConfig.setAllowCredentials(true);

		org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", corsConfig);

		return new org.springframework.web.cors.reactive.CorsWebFilter(source);
	}
}
