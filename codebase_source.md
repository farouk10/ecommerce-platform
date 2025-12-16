# Codebase Dump

## File: backend/pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <groupId>com.ecommerce</groupId>
    <artifactId>ecommerce-microservices</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>

    <modules>
        <module>common-lib</module>
        <module>api-gateway</module>
        <module>auth-service</module>
        <module>product-service</module>
        <module>order-service</module>
        <module>notification-service</module>
    </modules>

    <properties>
        <java.version>17</java.version>
        <spring-cloud.version>2023.0.0</spring-cloud.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>

```

## File: backend/docker-compose.yml
```yaml
version: '3.8'

services:
  # PostgreSQL pour Auth Service
  auth-db:
    image: postgres:15-alpine
    container_name: auth-db
    environment:
      POSTGRES_DB: auth_db
      POSTGRES_USER: ecommerce
      POSTGRES_PASSWORD: ecommerce123
    ports:
      - "5432:5432"
    volumes:
      - auth_data:/var/lib/postgresql/data
    networks:
      - ecommerce-network

  # PostgreSQL pour Product Service
  product-db:
    image: postgres:15-alpine
    container_name: product-db
    environment:
      POSTGRES_DB: product_db
      POSTGRES_USER: ecommerce
      POSTGRES_PASSWORD: ecommerce123
    ports:
      - "5433:5432"
    volumes:
      - product_data:/var/lib/postgresql/data
    networks:
      - ecommerce-network

  # PostgreSQL pour Order Service
  order-db:
    image: postgres:15-alpine
    container_name: order-db
    environment:
      POSTGRES_DB: order_db
      POSTGRES_USER: ecommerce
      POSTGRES_PASSWORD: ecommerce123
    ports:
      - "5434:5432"
    volumes:
      - order_data:/var/lib/postgresql/data
    networks:
      - ecommerce-network

  # Redis pour cache et sessions
  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - ecommerce-network

  # Zookeeper pour Kafka
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    healthcheck:
      test: [ "CMD", "nc", "-z", "localhost", "2181" ]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ecommerce-network


  # Kafka
  # Kafka
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka
    depends_on:
      zookeeper:
        condition: service_healthy
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
    restart: on-failure
    networks:
      - ecommerce-network



  # Kafka UI (pour monitoring)
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    depends_on:
      - kafka
    ports:
      - "8090:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
    networks:
      - ecommerce-network

volumes:
  auth_data:
  product_data:
  order_data:
  redis_data:

networks:
  ecommerce-network:
    driver: bridge

```

## File: backend/product-service/pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.4.12</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<groupId>com.ecommerce</groupId>
	<artifactId>product-service</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>product-service</name>
	<description>Product catalog and inventory management service</description>
	<url/>
	<licenses>
		<license/>
	</licenses>
	<developers>
		<developer/>
	</developers>
	<scm>
		<connection/>
		<developerConnection/>
		<tag/>
		<url/>
	</scm>
	<properties>
		<java.version>17</java.version>
        <!-- Configuration pour le plugin Flyway Maven -->
        <flyway.url>jdbc:postgresql://localhost:5433/product_db</flyway.url>
        <flyway.user>ecommerce</flyway.user>
        <flyway.password>ecommerce123</flyway.password>

    </properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-cache</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-redis</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.kafka</groupId>
			<artifactId>spring-kafka</artifactId>
		</dependency>

		<dependency>
			<groupId>org.postgresql</groupId>
			<artifactId>postgresql</artifactId>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.kafka</groupId>
			<artifactId>spring-kafka-test</artifactId>
			<scope>test</scope>
		</dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <!-- Flyway for database migrations -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.3</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <!-- Bucket4j Rate Limiting -->
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-core</artifactId>
            <version>8.7.0</version>
        </dependency>
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-redis</artifactId>
            <version>8.7.0</version>
        </dependency>

        <!-- Lettuce Redis Client (if not already present) -->
        <dependency>
            <groupId>io.lettuce</groupId>
            <artifactId>lettuce-core</artifactId>
        </dependency>


    </dependencies>

	<build>
		<plugins>
            <plugin>
                <groupId>org.flywaydb</groupId>
                <artifactId>flyway-maven-plugin</artifactId>
                <version>10.20.1</version> <!-- Assurez-vous que cette version correspond à celle utilisée -->
                <configuration>
                    <url>${flyway.url}</url>
                    <user>${flyway.user}</user>
                    <password>${flyway.password}</password>
                    <locations>
                        <location>classpath:db/migration</location>
                    </locations>
                </configuration>
            </plugin>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<annotationProcessorPaths>
						<path>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</path>
					</annotationProcessorPaths>
				</configuration>
			</plugin>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
				<configuration>
					<excludes>
						<exclude>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</exclude>
					</excludes>
				</configuration>
			</plugin>
		</plugins>
	</build>

</project>

```

## File: backend/product-service/src/test/java/com/ecommerce/product/ProductServiceApplicationTests.java
```java
package com.ecommerce.product;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ProductServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}

```

## File: backend/product-service/src/main/resources/application.yml
```yaml
server:
  port: 8082
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain
    min-response-size: 1024

spring:
  application:
    name: product-service

  profiles:
    active: local

  jpa:
    open-in-view: false  # Add this line
    show-sql: true
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

  cache:
    type: redis
    redis:
      time-to-live: 3600000

logging:
  level:
    com.ecommerce.product: DEBUG

jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970

---
# Profile LOCAL (services sur localhost)
spring:
  config:
    activate:
      on-profile: local

  datasource:
    url: jdbc:postgresql://localhost:5433/product_db
    username: ecommerce
    password: ecommerce123

  data:
    redis:
      host: localhost
      port: 6379
      timeout: 60000

  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

  # Rate Limiting Configuration
  rate-limiting:
    enabled: true
    requests-per-minute: 100
    cache-ttl: 3600


---
# Profile DOCKER (services dans docker-compose)
spring:
  config:
    activate:
      on-profile: docker

  datasource:
    url: jdbc:postgresql://product-db:5432/product_db
    username: ecommerce
    password: ecommerce123

  data:
    redis:
      host: redis
      port: 6379
      timeout: 60000

  kafka:
    bootstrap-servers: kafka:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

  # Rate Limiting Configuration
  rate-limiting:
    enabled: true
    requests-per-minute: 100
    cache-ttl: 3600

```

## File: backend/product-service/src/main/java/com/ecommerce/product/ProductServiceApplication.java
```java
package com.ecommerce.product;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ProductServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProductServiceApplication.class, args);
	}

}

```

## File: backend/product-service/src/main/java/com/ecommerce/product/dto/CategoryDto.java
```java
package com.ecommerce.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto {
    private Long id;
    private String name;
    private String description;
    private Long parentId;
}


```

## File: backend/product-service/src/main/java/com/ecommerce/product/dto/ProductDto.java
```java
package com.ecommerce.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)  // ← ADD THIS
public class ProductDto {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private Long categoryId;
    private String categoryName;
    private List<String> images;
}


```

## File: backend/product-service/src/main/java/com/ecommerce/product/dto/CreateProductRequest.java
```java
package com.ecommerce.product.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateProductRequest {
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private Long categoryId;
    private List<String> images;
}


```

## File: backend/product-service/src/main/java/com/ecommerce/product/dto/UpdateProductRequest.java
```java
package com.ecommerce.product.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class UpdateProductRequest {
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private Long categoryId;
    private List<String> images;
}


```

## File: backend/product-service/src/main/java/com/ecommerce/product/dto/CreateCategoryRequest.java
```java
package com.ecommerce.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {
    private String name;
    private String description;
    private Long parentId;
}


```

## File: backend/product-service/src/main/java/com/ecommerce/product/repository/ProductRepository.java
```java
package com.ecommerce.product.repository;

import com.ecommerce.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findAll(Pageable pageable);

    // Version avec List (sans pagination)
    List<Product> findByCategoryId(Long categoryId);

    // Version avec Page (avec pagination)
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    List<Product> findByNameContainingIgnoreCase(String keyword);

    List<Product> findTop10ByOrderByCreatedAtDesc();
}

```

## File: backend/product-service/src/main/java/com/ecommerce/product/repository/CategoryRepository.java
```java
package com.ecommerce.product.repository;

import com.ecommerce.product.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByParentIsNull();
}


```

## File: backend/product-service/src/main/java/com/ecommerce/product/config/SecurityConfig.java
```java
package com.ecommerce.product.config;

import com.ecommerce.product.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// ← AJOUTER CES 3 LIGNES
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.HEAD, "/api/**").permitAll()
                        .requestMatchers("/api/*/health").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/products/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/categories/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

```

## File: backend/product-service/src/main/java/com/ecommerce/product/config/RedisConfig.java
```java
package com.ecommerce.product.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Utiliser String serializer pour les clés
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Utiliser JSON serializer pour les valeurs
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());

        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Configuration ObjectMapper pour la sérialisation JSON
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.activateDefaultTyping(
            BasicPolymorphicTypeValidator.builder().allowIfBaseType(Object.class).build(),
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.PROPERTY
        );

        GenericJackson2JsonRedisSerializer serializer = 
            new GenericJackson2JsonRedisSerializer(objectMapper);

        // Configuration du cache par défaut
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1))  // Expire après 1 heure
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(serializer)
            )
            .disableCachingNullValues();

        // Configurations spécifiques par cache
        RedisCacheConfiguration popularProductsConfig = defaultConfig
            .entryTtl(Duration.ofMinutes(30));  // Expire après 30 minutes

        RedisCacheConfiguration searchConfig = defaultConfig
            .entryTtl(Duration.ofMinutes(15));  // Expire après 15 minutes

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withCacheConfiguration("products", defaultConfig)
            .withCacheConfiguration("popularProducts", popularProductsConfig)
            .withCacheConfiguration("searchResults", searchConfig)
            .withCacheConfiguration("productDetails", defaultConfig)
            .build();
    }
}


```

## File: backend/product-service/src/main/java/com/ecommerce/product/config/RateLimitConfig.java
```java
package com.ecommerce.product.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${rate-limiting.cache-ttl:3600}")
    private long cacheTtl;

    @Bean
    public ProxyManager<String> proxyManager() {
        RedisURI redisUri = RedisURI.Builder
                .redis(redisHost, redisPort)
                .build();

        RedisClient redisClient = RedisClient.create(redisUri);
        StatefulRedisConnection<String, byte[]> connection = 
            redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));

        return LettuceBasedProxyManager.builderFor(connection)
                .withExpirationStrategy(
                    ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(
                        Duration.ofSeconds(cacheTtl)
                    )
                )
                .build();
    }
}


```

## File: backend/product-service/src/main/java/com/ecommerce/product/security/JwtAuthenticationFilter.java
```java
package com.ecommerce.product.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        SecurityContextHolder.clearContext();

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                String email = claims.getSubject();
                String role = claims.get("role", String.class);

                List<SimpleGrantedAuthority> authorities =
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("User authenticated: {} with role: {}", email, role);

            } catch (Exception e) {
                log.error("JWT validation failed: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}

```

## File: backend/product-service/src/main/java/com/ecommerce/product/entity/Product.java
```java
package com.ecommerce.product.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private BigDecimal price;
    
    @Column(name = "stock_quantity")
    private Integer stockQuantity;
    
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    private List<String> images = new ArrayList<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}


```

## File: backend/product-service/src/main/java/com/ecommerce/product/entity/Category.java
```java
package com.ecommerce.product.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Category parent;

    @OneToMany(mappedBy = "parent")
    private List<Category> subCategories = new ArrayList<>();
}

```

## File: backend/product-service/src/main/java/com/ecommerce/product/controller/ProductController.java
```java
package com.ecommerce.product.controller;

import com.ecommerce.product.dto.CreateProductRequest;
import com.ecommerce.product.dto.ProductDto;
import com.ecommerce.product.dto.UpdateProductRequest;
import com.ecommerce.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "UP",
                "service", "product-service",
                "message", "Product Service is running!"
        );
    }

    @GetMapping("/popular")
    public ResponseEntity<List<ProductDto>> getPopularProducts() {
        List<ProductDto> products = productService.getPopularProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping
    public ResponseEntity<Page<ProductDto>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductDto> products = productService.getAllProducts(pageable);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        try {
            ProductDto product = productService.getProductById(id);
            return ResponseEntity.ok(product);
        } catch (RuntimeException e) {
            log.error("Error getting product: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/stock/reduce")
    public ResponseEntity<Void> reduceStock(
            @PathVariable Long id,
            @RequestParam Integer quantity) {

        productService.reduceStock(id, quantity);
        return ResponseEntity.ok().build();
    }


    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ProductDto>> getProductsByCategory(@PathVariable Long categoryId) {
        List<ProductDto> products = productService.getProductsByCategory(categoryId);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProducts(@RequestParam String keyword) {
        List<ProductDto> products = productService.searchProducts(keyword);
        return ResponseEntity.ok(products);
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody CreateProductRequest request) {
        try {
            ProductDto product = productService.createProduct(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(product);
        } catch (RuntimeException e) {
            log.error("Error creating product: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestBody UpdateProductRequest request) {
        try {
            ProductDto product = productService.updateProduct(id, request);
            return ResponseEntity.ok(product);
        } catch (RuntimeException e) {
            log.error("Error updating product: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
        } catch (RuntimeException e) {
            log.error("Error deleting product: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        try {
            productService.updateStock(id, quantity);
            return ResponseEntity.ok(Map.of("message", "Stock updated successfully"));
        } catch (RuntimeException e) {
            log.error("Error updating stock: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

```

## File: backend/product-service/src/main/java/com/ecommerce/product/controller/CategoryController.java
```java
package com.ecommerce.product.controller;

import com.ecommerce.product.dto.CategoryDto;
import com.ecommerce.product.dto.CreateCategoryRequest;
import com.ecommerce.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        List<CategoryDto> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/root")
    public ResponseEntity<List<CategoryDto>> getRootCategories() {
        List<CategoryDto> categories = categoryService.getRootCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable Long id) {
        try {
            CategoryDto category = categoryService.getCategoryById(id);
            return ResponseEntity.ok(category);
        } catch (RuntimeException e) {
            log.error("Error getting category: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody CreateCategoryRequest request) {
        try {
            CategoryDto category = categoryService.createCategory(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(category);
        } catch (RuntimeException e) {
            log.error("Error creating category: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @RequestBody CreateCategoryRequest request) {
        try {
            CategoryDto category = categoryService.updateCategory(id, request);
            return ResponseEntity.ok(category);
        } catch (RuntimeException e) {
            log.error("Error updating category: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.ok(Map.of("message", "Category deleted successfully"));
        } catch (RuntimeException e) {
            log.error("Error deleting category: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}


```

## File: backend/product-service/src/main/java/com/ecommerce/product/filter/RateLimitFilter.java
```java
package com.ecommerce.product.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final ProxyManager<String> proxyManager;

    @Value("${rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    @Value("${rate-limiting.requests-per-minute:100}")
    private int requestsPerMinute;

    private int getRateLimitForPath(String path, String method) {
        if (path.contains("/products/search")) {
            return 50; // Recherches limitées
        }
        if (path.contains("/products") && method.equals("GET")) {
            return 200; // Lecture catalogue permissive
        }
        if (path.contains("/products") && !method.equals("GET")) {
            return 20; // Création/modification stricte
        }
        if (path.contains("/categories")) {
            return 100;
        }
        return requestsPerMinute; // Default
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!rateLimitingEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String key = "rate_limit:" + clientIp;
        int limit = getRateLimitForPath(request.getRequestURI(), request.getMethod());

        Supplier<BucketConfiguration> configSupplier = () -> {
            Refill refill = Refill.intervally(limit, Duration.ofMinutes(1));
            Bandwidth bandwidth = Bandwidth.classic(limit, refill);
            return BucketConfiguration.builder()
                    .addLimit(bandwidth)
                    .build();
        };

        Bucket bucket = proxyManager.builder().build(key, configSupplier);

        if (bucket.tryConsume(1)) {
            long remainingTokens = bucket.getAvailableTokens();
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(remainingTokens));
            response.setHeader("X-Rate-Limit-Limit", String.valueOf(limit));
            response.setHeader("X-Rate-Limit-Endpoint", request.getRequestURI());

            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {} on endpoint: {}", clientIp, request.getRequestURI());
            response.setStatus(429);
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", "60");
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded. Try again in 1 minute.\"}");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

```

## File: backend/product-service/src/main/java/com/ecommerce/product/service/ProductService.java
```java
package com.ecommerce.product.service;

import com.ecommerce.product.dto.CreateProductRequest;
import com.ecommerce.product.dto.ProductDto;
import com.ecommerce.product.dto.UpdateProductRequest;
import com.ecommerce.product.entity.Category;
import com.ecommerce.product.entity.Product;
import com.ecommerce.product.repository.CategoryRepository;
import com.ecommerce.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
   // @Cacheable(value = "products", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ProductDto> getAllProducts(Pageable pageable) {
        log.info("Fetching products from database (not cached)");
        return productRepository.findAll(pageable)
                .map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
   // @Cacheable(value = "searchResults", key = "#keyword")
    public List<ProductDto> searchProducts(String keyword) {
        log.info("Searching products for keyword: {} (not cached)", keyword);
        return productRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
  //  @Cacheable(value = "productDetails", key = "#id")
    public ProductDto getProductById(Long id) {
        log.info("Fetching product {} from database (not cached)", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        // DELETE THE LINES BELOW - NOT NEEDED
        // // Force initialize images collection while still in transaction
        // if (product.getImages() != null) {
        //     product.getImages().size();  // Trigger lazy loading
        // }

        return convertToDto(product);
    }


    @Transactional
   // @CacheEvict(value = {"products", "popularProducts", "searchResults"}, allEntries = true)
    public ProductDto createProduct(CreateProductRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .category(category)
                .images(request.getImages())
                .build();

        product = productRepository.save(product);
        log.info("Product created and cache cleared: {}", product.getName());
        return convertToDto(product);
    }

    @Transactional
   // @CachePut(value = "productDetails", key = "#id")
   // @CacheEvict(value = {"products", "searchResults"}, allEntries = true)
    public ProductDto updateProduct(Long id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }
        if (request.getImages() != null) {
            product.setImages(request.getImages());
        }

        product = productRepository.save(product);
        log.info("Product updated and cache refreshed: {}", product.getName());
        return convertToDto(product);
    }

    @Transactional
   // @CacheEvict(value = {"products", "productDetails", "popularProducts", "searchResults"}, allEntries = true)
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found");
        }
        productRepository.deleteById(id);
        log.info("Product deleted and cache cleared: {}", id);
    }

    @Transactional
  //  @CachePut(value = "productDetails", key = "#productId")
    public void updateStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        int newStock = product.getStockQuantity() + quantity;
        if (newStock < 0) {
            throw new RuntimeException("Insufficient stock");
        }

        product.setStockQuantity(newStock);
        productRepository.save(product);
        log.info("Stock updated for product {}: new quantity = {}", productId, newStock);
    }

    // Nouvelle méthode: Produits populaires (cachés 30 min)
    @Transactional(readOnly = true)
  //  @Cacheable(value = "popularProducts")
    public List<ProductDto> getPopularProducts() {
        log.info("Fetching popular products from database (not cached)");
        return productRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void reduceStock(Long productId, Integer quantity) {
        // CORRECTION : Utiliser findById directement pour avoir l'Entité, pas le DTO
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (product.getStockQuantity() < quantity) {
            throw new IllegalArgumentException("Stock insuffisant pour le produit " + product.getName());
        }

        int newStock = product.getStockQuantity() - quantity;
        product.setStockQuantity(newStock);

        productRepository.save(product);
        log.info("📉 Stock reduced for product {}: {} -> {}", productId, product.getStockQuantity() + quantity, newStock);
    }


    private ProductDto convertToDto(Product product) {
        // Safely copy images list while in transaction
        List<String> imagesList = new ArrayList<>();
        try {
            if (product.getImages() != null) {
                imagesList.addAll(product.getImages());  // Force load and copy
            }
        } catch (Exception e) {
            log.warn("Could not load images for product {}: {}", product.getId(), e.getMessage());
        }

        return ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .images(imagesList)  // Use the copied list
                .build();
    }


}

```

## File: backend/product-service/src/main/java/com/ecommerce/product/service/CategoryService.java
```java
package com.ecommerce.product.service;

import com.ecommerce.product.dto.CategoryDto;
import com.ecommerce.product.dto.CreateCategoryRequest;
import com.ecommerce.product.entity.Category;
import com.ecommerce.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getRootCategories() {
        return categoryRepository.findByParentIsNull().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return convertToDto(category);
    }

    @Transactional
    public CategoryDto createCategory(CreateCategoryRequest request) {
        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .parent(parent)
                .build();

        category = categoryRepository.save(category);
        log.info("Category created: {}", category.getName());
        return convertToDto(category);
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CreateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
            category.setParent(parent);
        }

        category = categoryRepository.save(category);
        log.info("Category updated: {}", category.getName());
        return convertToDto(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found");
        }
        categoryRepository.deleteById(id);
        log.info("Category deleted: {}", id);
    }

    private CategoryDto convertToDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .build();
    }
}


```

## File: backend/notification-service/pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.4.12</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<groupId>com.ecommerce</groupId>
	<artifactId>notification-service</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>notification-service</name>
	<description>Notification and email service with Kafka consumer</description>
	<url/>
	<licenses>
		<license/>
	</licenses>
	<developers>
		<developer/>
	</developers>
	<scm>
		<connection/>
		<developerConnection/>
		<tag/>
		<url/>
	</scm>
	<properties>
		<java.version>17</java.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-mail</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.kafka</groupId>
			<artifactId>spring-kafka</artifactId>
		</dependency>

		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.kafka</groupId>
			<artifactId>spring-kafka-test</artifactId>
			<scope>test</scope>
		</dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>com.ecommerce</groupId>
            <artifactId>common-lib</artifactId>
            <version>1.0.0</version>
        </dependency>

    </dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<annotationProcessorPaths>
						<path>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</path>
					</annotationProcessorPaths>
				</configuration>
			</plugin>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
				<configuration>
					<excludes>
						<exclude>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</exclude>
					</excludes>
				</configuration>
			</plugin>
		</plugins>
	</build>

</project>

```

## File: backend/notification-service/src/test/java/com/ecommerce/notification/NotificationServiceApplicationTests.java
```java
package com.ecommerce.notification;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class NotificationServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}

```

## File: backend/notification-service/src/main/resources/application.yml
```yaml
server:
  port: 8084

spring:
  application:
    name: notification-service

  kafka:
    bootstrap-servers: localhost:9092
    # NE PAS configurer les deserializers ici car ils sont configurés en Java
    # Les propriétés ci-dessous peuvent être complètement retirées

  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME:your-email@gmail.com}
    password: ${MAIL_PASSWORD:your-app-password}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

logging:
  level:
    com.ecommerce.notification: DEBUG
    org.springframework.kafka: DEBUG
```

## File: backend/notification-service/src/main/java/com/ecommerce/notification/NotificationServiceApplication.java
```java
package com.ecommerce.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NotificationServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(NotificationServiceApplication.class, args);
	}

}

```

## File: backend/notification-service/src/main/java/com/ecommerce/notification/config/SecurityConfig.java
```java
package com.ecommerce.notification.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/notifications/**", "/actuator/**").permitAll()
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
}


```

## File: backend/notification-service/src/main/java/com/ecommerce/notification/config/KafkaConsumerConfig.java
```java
package com.ecommerce.notification.config;

import com.ecommerce.common.event.OrderEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ConsumerFactory<String, OrderEvent> orderEventConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "notification-service");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        // Utiliser ErrorHandlingDeserializer pour wrapper JsonDeserializer
        ErrorHandlingDeserializer<OrderEvent> errorHandlingDeserializer =
                new ErrorHandlingDeserializer<>(createJsonDeserializer());

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                errorHandlingDeserializer
        );
    }

    private JsonDeserializer<OrderEvent> createJsonDeserializer() {
        JsonDeserializer<OrderEvent> deserializer = new JsonDeserializer<>(OrderEvent.class);
        deserializer.addTrustedPackages(
                "com.ecommerce.common.event",
                "com.ecommerce.order.event",
                "*"  // Optionnel: permet de désérialiser tous les packages
        );
        deserializer.setUseTypeHeaders(false);  // Important: ne pas utiliser les headers de type
        return deserializer;
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderEvent> orderEventKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, OrderEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(orderEventConsumerFactory());

        // Configurer le gestionnaire d'erreurs
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
                (consumerRecord, exception) -> {
                    // Loguer l'erreur
                    System.err.println("Erreur lors du traitement du message Kafka: " + exception.getMessage());
                },
                new FixedBackOff(1000L, 3)  // 3 tentatives avec 1 seconde d'intervalle
        );

        // Ignorer les erreurs de désérialisation (ne pas réessayer)
        errorHandler.addNotRetryableExceptions(org.apache.kafka.common.errors.SerializationException.class);

        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }
}
```

## File: backend/notification-service/src/main/java/com/ecommerce/notification/controller/NotificationController.java
```java
package com.ecommerce.notification.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "status", "UP",
            "service", "notification-service",
            "message", "Notification Service is listening to Kafka events!"
        );
    }
}


```

## File: backend/notification-service/src/main/java/com/ecommerce/notification/service/OrderEventListener.java
```java
package com.ecommerce.notification.service;

//import com.ecommerce.notification.event.OrderEvent;
import com.ecommerce.common.event.OrderEvent;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class OrderEventListener {
    
    @KafkaListener(topics = "order-events",
            groupId = "notification-service",
            containerFactory = "orderEventKafkaListenerContainerFactory"
    )
    public void handleOrderEvent(OrderEvent event) {
        log.info("📩 Received order event: {}", event.getEventType());
        log.info("Order ID: {}, User ID: {}, Amount: {}", 
                event.getOrderId(), event.getUserId(), event.getTotalAmount());
        
        switch (event.getEventType()) {
            case "OrderCreated":
                sendOrderConfirmationEmail(event);
                break;
            case "PaymentCompleted":
                sendPaymentConfirmationEmail(event);
                break;
            case "OrderShipped":
                sendShippingNotificationEmail(event);
                break;
            default:
                log.warn("Unknown event type: {}", event.getEventType());
        }
    }
    
    private void sendOrderConfirmationEmail(OrderEvent event) {
        log.info("✉️  Sending order confirmation email for order: {}", event.getOrderId());
        // TODO: Implémenter l'envoi d'email réel avec JavaMailSender
    }
    
    private void sendPaymentConfirmationEmail(OrderEvent event) {
        log.info("✉️  Sending payment confirmation email for order: {}", event.getOrderId());
    }
    
    private void sendShippingNotificationEmail(OrderEvent event) {
        log.info("✉️  Sending shipping notification email for order: {}", event.getOrderId());
    }
}


```

## File: backend/api-gateway/pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.4.12</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<groupId>com.ecommerce</groupId>
	<artifactId>api-gateway</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>api-gateway</name>
	<description>API Gateway for routing and load balancing</description>
	<url/>
	<licenses>
		<license/>
	</licenses>
	<developers>
		<developer/>
	</developers>
	<scm>
		<connection/>
		<developerConnection/>
		<tag/>
		<url/>
	</scm>
	<properties>
		<java.version>17</java.version>
		<spring-cloud.version>2024.0.2</spring-cloud.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-redis</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-gateway-mvc</artifactId>
		</dependency>

		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
	</dependencies>
	<dependencyManagement>
		<dependencies>
			<dependency>
				<groupId>org.springframework.cloud</groupId>
				<artifactId>spring-cloud-dependencies</artifactId>
				<version>${spring-cloud.version}</version>
				<type>pom</type>
				<scope>import</scope>
			</dependency>
		</dependencies>
	</dependencyManagement>

	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
		</plugins>
	</build>

</project>

```

## File: backend/api-gateway/src/test/java/com/ecommerce/gateway/ApiGatewayApplicationTests.java
```java
package com.ecommerce.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApiGatewayApplicationTests {

	@Test
	void contextLoads() {
	}

}

```

## File: backend/api-gateway/src/main/resources/application.yml
```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway

  data:
    redis:
      host: localhost
      port: 6379

logging:
  level:
    com.ecommerce.gateway: DEBUG

```

## File: backend/api-gateway/src/main/java/com/ecommerce/gateway/ApiGatewayApplication.java
```java
package com.ecommerce.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatewayApplication.class, args);
	}

}

```

## File: backend/order-service/pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.4.12</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<groupId>com.ecommerce</groupId>
	<artifactId>order-service</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>order-service</name>
	<description>Order processing and management service</description>
	<url/>
	<licenses>
		<license/>
	</licenses>
	<developers>
		<developer/>
	</developers>
	<scm>
		<connection/>
		<developerConnection/>
		<tag/>
		<url/>
	</scm>
	<properties>
		<java.version>17</java.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.kafka</groupId>
			<artifactId>spring-kafka</artifactId>
		</dependency>

		<dependency>
			<groupId>org.postgresql</groupId>
			<artifactId>postgresql</artifactId>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.kafka</groupId>
			<artifactId>spring-kafka-test</artifactId>
			<scope>test</scope>
		</dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>com.ecommerce</groupId>
            <artifactId>common-lib</artifactId>
            <version>1.0.0</version>
        </dependency>

        <!-- Flyway for database migrations -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.3</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <!-- Bucket4j Rate Limiting -->
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-core</artifactId>
            <version>8.7.0</version>
        </dependency>
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-redis</artifactId>
            <version>8.7.0</version>
        </dependency>

        <!-- Lettuce Redis Client (if not already present) -->
        <dependency>
            <groupId>io.lettuce</groupId>
            <artifactId>lettuce-core</artifactId>
        </dependency>

    </dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<annotationProcessorPaths>
						<path>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</path>
					</annotationProcessorPaths>
				</configuration>
			</plugin>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
				<configuration>
					<excludes>
						<exclude>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</exclude>
					</excludes>
				</configuration>
			</plugin>
		</plugins>
	</build>

</project>

```

## File: backend/order-service/src/test/java/com/ecommerce/order/OrderServiceApplicationTests.java
```java
package com.ecommerce.order;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class OrderServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}

```

## File: backend/order-service/src/main/resources/application.yml
```yaml
server:
  port: 8083
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain
    min-response-size: 1024

spring:
  application:
    name: order-service

  profiles:
    active: local

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect

  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

logging:
  level:
    com.ecommerce.order: DEBUG

jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970

---
# Profile LOCAL
spring:
  config:
    activate:
      on-profile: local

  datasource:
    url: jdbc:postgresql://localhost:5434/order_db
    username: ecommerce
    password: ecommerce123

  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

  # Rate Limiting Configuration
  rate-limiting:
    enabled: true
    requests-per-minute: 100
    cache-ttl: 3600


---
# Profile DOCKER
spring:
  config:
    activate:
      on-profile: docker

  datasource:
    url: jdbc:postgresql://order-db:5432/order_db
    username: ecommerce
    password: ecommerce123

  kafka:
    bootstrap-servers: kafka:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

  # Rate Limiting Configuration
  rate-limiting:
    enabled: true
    requests-per-minute: 100
    cache-ttl: 3600


```

## File: backend/order-service/src/main/java/com/ecommerce/order/OrderServiceApplication.java
```java
package com.ecommerce.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrderServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(OrderServiceApplication.class, args);
	}

}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/dto/OrderItemDto.java
```java
package com.ecommerce.order.dto;

import com.ecommerce.order.entity.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal price;

    // Méthode helper pour convertir depuis l'entité
    public static OrderItemDto fromEntity(OrderItem item) {
        return OrderItemDto.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .price(item.getPriceAtPurchase())
                .build();
    }
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/dto/OrderDto.java
```java
package com.ecommerce.order.dto;

import com.ecommerce.order.entity.Order;
import com.ecommerce.order.entity.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private String userId;
    private String orderNumber;
    private String status;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String paymentMethod;
    private String promoCode;
    private BigDecimal discount;
    private List<OrderItemDto> items;
    private Integer totalItems; // ✅ On va remplir ceci
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderDto fromEntity(Order order) {
        // 1. Mapper les items (Conversion Entity -> DTO)
        List<OrderItemDto> mappedItems = (order.getItems() == null) ? List.of() :
                order.getItems().stream()
                        .map(OrderItemDto::fromEntity) // Assurez-vous que OrderItemDto a cette méthode
                        .collect(Collectors.toList());

        // 2. Calculer le nombre total d'articles
        int totalItemsCount = mappedItems.stream()
                .mapToInt(OrderItemDto::getQuantity)
                .sum();

        return OrderDto.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                .shippingAddress(order.getShippingAddress())
                .paymentMethod(order.getPaymentMethod())
                .promoCode(order.getPromoCode())
                .discount(order.getDiscount())

                // ✅ CORRECTION ICI : On passe la vraie liste et le total calculé
                .items(mappedItems)
                .totalItems(totalItemsCount)

                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/dto/OrderItemRequest.java
```java
package com.ecommerce.order.dto;

import lombok.Data;

@Data
public class OrderItemRequest {
    private Long productId;
    private String productName;
    private Integer quantity;
    private Double priceAtPurchase;
}




```

## File: backend/order-service/src/main/java/com/ecommerce/order/dto/AdminStatsDto.java
```java
package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private Integer totalOrders;
    private BigDecimal totalRevenue;
    private Integer totalProducts;
    private Integer totalUsers;
    private Integer pendingOrders;
    private Integer confirmedOrders;
    private Integer processingOrders;
    private Integer shippedOrders;
    private Integer deliveredOrders;
    private Integer ordersThisMonth;
    private BigDecimal revenueThisMonth;
    private Integer newUsersThisMonth;
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/dto/CreateOrderRequest.java
```java
package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    private List<OrderItemDto> items;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String paymentMethod;
    private String promoCode;     // ← NOUVEAU
    private BigDecimal discount;   // ← NOUVEAU
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/repository/OrderRepository.java
```java
package com.ecommerce.order.repository;

import com.ecommerce.order.entity.Order;
import com.ecommerce.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // ✅ MÉTHODE MANQUANTE (Pour les clients)
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.userId = :userId ORDER BY o.createdAt DESC")
    List<Order> findByUserId(@Param("userId") String userId);

    // --- MÉTHODES ADMIN (Stats) ---

    // Compter par statut
    long countByStatus(OrderStatus status);

    // Somme totale des revenus
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o")
    BigDecimal sumTotalRevenue();

    // Commandes du mois en cours
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startDate")
    long countOrdersSince(@Param("startDate") LocalDateTime startDate);

    // Revenus du mois en cours
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt >= :startDate")
    BigDecimal sumRevenueSince(@Param("startDate") LocalDateTime startDate);
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/config/SecurityConfig.java
```java
package com.ecommerce.order.config;

import com.ecommerce.order.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // ✅ Import Ajouté
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // Endpoints publics
                        .requestMatchers("/api/*/health").permitAll()
                        .requestMatchers("/actuator/**").permitAll()

                        // ✅ ROUTES ADMIN SPÉCIFIQUES (Doivent être avant les règles générales)
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // ⛔ Supprimé : .requestMatchers("/api/orders/**").hasRole("ADMIN")
                        // Car cela bloquait les clients pour créer des commandes !

                        // ✅ ROUTES COMMANDES (Accessibles aux authentifiés : Customer & Admin)
                        .requestMatchers(HttpMethod.POST, "/api/orders").authenticated()      // Créer commande
                        .requestMatchers(HttpMethod.GET, "/api/orders/**").authenticated()    // Voir commandes
                        .requestMatchers(HttpMethod.PATCH, "/api/orders/**").authenticated()  // Annuler commande

                        // Tout le reste nécessite une authentification
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/config/KafkaProducerConfig.java
```java
package com.ecommerce.order.config;

//import com.ecommerce.order.event.OrderEvent;
import com.ecommerce.common.event.OrderEvent;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaProducerConfig {
    
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;
    
    @Bean
    public ProducerFactory<String, OrderEvent> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(config);
    }
    
    @Bean
    public KafkaTemplate<String, OrderEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}


```

## File: backend/order-service/src/main/java/com/ecommerce/order/config/RateLimitConfig.java
```java
package com.ecommerce.order.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${rate-limiting.cache-ttl:3600}")
    private long cacheTtl;

    @Bean
    public ProxyManager<String> proxyManager() {
        RedisURI redisUri = RedisURI.Builder
                .redis(redisHost, redisPort)
                .build();

        RedisClient redisClient = RedisClient.create(redisUri);
        StatefulRedisConnection<String, byte[]> connection = 
            redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));

        return LettuceBasedProxyManager.builderFor(connection)
                .withExpirationStrategy(
                    ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(
                        Duration.ofSeconds(cacheTtl)
                    )
                )
                .build();
    }
}


```

## File: backend/order-service/src/main/java/com/ecommerce/order/security/JwtService.java
```java
package com.ecommerce.order.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public String extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("userId", String.class);
    }

    public String extractEmail(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getSubject();
    }

    private Claims extractAllClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/security/JwtAuthenticationFilter.java
```java
package com.ecommerce.order.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // On ne clear pas le context brutalement ici, car d'autres filtres pourraient exister
        // SecurityContextHolder.clearContext();

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                // Création de la clé HMAC
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

                // Parsing et validation du token
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                String email = claims.getSubject();
                String role = claims.get("role", String.class);

                // Ajout du préfixe ROLE_ indispensable pour .hasRole("ADMIN")
                List<SimpleGrantedAuthority> authorities =
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);

                // Définition de l'authentification dans le contexte
                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("✅ User authenticated: {} with role: {}", email, role);
                }

            } catch (Exception e) {
                log.error("❌ JWT validation failed: {}", e.getMessage());
                // On ne lance pas d'exception ici pour laisser Spring Security gérer le rejet (401/403) plus loin
            }
        }

        filterChain.doFilter(request, response);
    }
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/entity/Order.java
```java
package com.ecommerce.order.entity;

import com.ecommerce.order.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_order_number", columnList = "order_number"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "order_number", unique = true, nullable = false)
    @Builder.Default
    private String orderNumber = "ORD-" + System.currentTimeMillis();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "shipping_address", nullable = false, length = 500)
    private String shippingAddress;

    @Column(name = "payment_method", nullable = false)
    @Builder.Default
    private String paymentMethod = "CREDIT_CARD";

    @Column(name = "promo_code")
    private String promoCode;

    @Column(precision = 10, scale = 2)
    private BigDecimal discount;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Helper methods
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/entity/OrderItem.java
```java
package com.ecommerce.order.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @Column(name = "product_name")
    private String productName;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "price_at_purchase", nullable = false)
    private BigDecimal priceAtPurchase;
}


```

## File: backend/order-service/src/main/java/com/ecommerce/order/enums/OrderStatus.java
```java
package com.ecommerce.order.enums;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    REFUNDED
}


```

## File: backend/order-service/src/main/java/com/ecommerce/order/controller/AdminController.java
```java
package com.ecommerce.order.controller;

import com.ecommerce.order.dto.AdminStatsDto;
import com.ecommerce.order.dto.OrderDto;
import com.ecommerce.order.entity.Order;
import com.ecommerce.order.enums.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final OrderRepository orderRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getAdminStats() {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0);

        AdminStatsDto stats = AdminStatsDto.builder()
                .totalOrders((int) orderRepository.count())
                .totalRevenue(orderRepository.sumTotalRevenue())
                // Stats par statut
                .pendingOrders((int) orderRepository.countByStatus(OrderStatus.PENDING))
                .confirmedOrders((int) orderRepository.countByStatus(OrderStatus.CONFIRMED))
                .processingOrders((int) orderRepository.countByStatus(OrderStatus.PROCESSING))
                .shippedOrders((int) orderRepository.countByStatus(OrderStatus.SHIPPED))
                .deliveredOrders((int) orderRepository.countByStatus(OrderStatus.DELIVERED))
                // Performance du mois
                .ordersThisMonth((int) orderRepository.countOrdersSince(startOfMonth))
                .revenueThisMonth(orderRepository.sumRevenueSince(startOfMonth))
                // Note: Pour 'totalProducts' et 'totalUsers', il faudrait appeler ProductService/AuthService via RestTemplate.
                // Pour l'instant on met 0 pour éviter de complexifier le code ici.
                .totalProducts(0)
                .totalUsers(0)
                .build();

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDto>> getAllOrders() {
        List<Order> orders = orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(orders.stream().map(OrderDto::fromEntity).toList());
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        try {
            OrderStatus newStatus = OrderStatus.valueOf(request.get("status"));
            order.setStatus(newStatus);
            orderRepository.save(order);
            return ResponseEntity.ok(OrderDto.fromEntity(order));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status"));
        }
    }
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/controller/OrderController.java
```java
package com.ecommerce.order.controller;

import com.ecommerce.order.dto.CreateOrderRequest;
import com.ecommerce.order.dto.OrderDto;
import com.ecommerce.order.service.OrderService;
import com.ecommerce.order.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;
    private final JwtService jwtService;

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "UP",
                "service", "order-service",
                "message", "Order Service is running with Kafka!"
        );
    }

    @GetMapping
    public ResponseEntity<List<OrderDto>> getUserOrders(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtService.extractUserId(token);

        // ✅ CORRECTION : Appel direct et retour direct de la liste
        List<OrderDto> orders = orderService.getOrdersByUserId(userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        try {
            OrderDto order = orderService.getOrderById(id);
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            log.error("Error getting order: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createOrder(
            @RequestBody CreateOrderRequest request,
            @RequestHeader("Authorization") String authHeader,
            Authentication authentication) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtService.extractUserId(token);

            log.info("Creating order for userId: {}", userId);

            OrderDto order = orderService.createOrder(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (RuntimeException e) {
            log.error("Error creating order: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            // ✅ CORRECTION TEMPORAIRE pour compilation immédiate
            // Vous pourrez réactiver la logique complète une fois que OrderService.updateOrderStatus sera refait
            log.info("Request to update order {} status to {}", id, status);
            return ResponseEntity.ok(Map.of("message", "Status update pending implementation"));
        } catch (RuntimeException e) {
            log.error("Error updating order status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        try {
            orderService.deleteOrder(id);
            return ResponseEntity.ok(Map.of("message", "Order deleted successfully"));
        } catch (RuntimeException e) {
            log.error("Error deleting order: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/controller/TestKafkaController.java
```java
package com.ecommerce.order.controller;

import com.ecommerce.common.event.OrderEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class TestKafkaController {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    @PostMapping("/test-kafka")
    public Map<String, String> testKafka() {
        String orderId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();

        OrderEvent event = OrderEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("OrderCreated")
                .timestamp(LocalDateTime.now())
                .orderId(orderId)           // ✅ String
                .userId(userId)             // ✅ String
                .totalAmount(new BigDecimal("199.99"))
                .status("PENDING")
                .build();

        kafkaTemplate.send("order-events", event);

        return Map.of(
                "status", "SUCCESS",
                "message", "Event published to Kafka!",
                "eventId", event.getEventId(),
                "orderId", orderId
        );
    }
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/filter/RateLimitFilter.java
```java
package com.ecommerce.order.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final ProxyManager<String> proxyManager;

    @Value("${rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    @Value("${rate-limiting.requests-per-minute:100}")
    private int requestsPerMinute;

    private int getRateLimitForPath(String path, String method) {
        if (path.contains("/orders") && method.equals("POST")) {
            return 30; // 30 commandes/min
        }
        if (path.contains("/orders") && method.equals("GET")) {
            return 100; // 100 lectures/min
        }
        if (path.contains("/orders") && (method.equals("PUT") || method.equals("DELETE"))) {
            return 50; // 50 modifications/min
        }
        return requestsPerMinute; // Default 100
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!rateLimitingEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String key = "rate_limit:" + clientIp;
        int limit = getRateLimitForPath(request.getRequestURI(), request.getMethod());

        Supplier<BucketConfiguration> configSupplier = () -> {
            Refill refill = Refill.intervally(limit, Duration.ofMinutes(1));
            Bandwidth bandwidth = Bandwidth.classic(limit, refill);
            return BucketConfiguration.builder()
                    .addLimit(bandwidth)
                    .build();
        };

        Bucket bucket = proxyManager.builder().build(key, configSupplier);

        if (bucket.tryConsume(1)) {
            long remainingTokens = bucket.getAvailableTokens();
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(remainingTokens));
            response.setHeader("X-Rate-Limit-Limit", String.valueOf(limit));

            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(429);
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", "60");
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded. Try again in 1 minute.\"}");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

```

## File: backend/order-service/src/main/java/com/ecommerce/order/service/OrderService.java
```java
package com.ecommerce.order.service;

import com.ecommerce.common.event.OrderEvent;
import com.ecommerce.order.dto.*;
import com.ecommerce.order.entity.Order;
import com.ecommerce.order.entity.OrderItem;
import com.ecommerce.order.enums.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.math.BigDecimal;


@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersByUserId(String userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        return convertToDto(order);
    }

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request, String userId) {
        log.info("Creating order for user: {}", userId);
        String orderNumber = "ORD-" + System.currentTimeMillis();

        // 1. Convertir les items
        List<OrderItem> orderItems = request.getItems().stream()
                .map(itemDto -> {
                    OrderItem orderItem = new OrderItem();
                    orderItem.setProductId(itemDto.getProductId());
                    orderItem.setProductName(itemDto.getProductName());
                    orderItem.setQuantity(itemDto.getQuantity());
                    orderItem.setPriceAtPurchase(itemDto.getPrice());
                    return orderItem;
                })
                .collect(Collectors.toList());

        // 2. CALCULER LE SOUS-TOTAL (Prix * Quantité)
        BigDecimal calculatedSubtotal = orderItems.stream()
                .map(item -> item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. RECUPERER ET APPLIQUER LA REDUCTION
        BigDecimal discount = BigDecimal.ZERO;
        if (request.getDiscount() != null) {
            discount = request.getDiscount();
        }

        // 4. CALCULER LE TOTAL FINAL
        BigDecimal finalTotal = calculatedSubtotal.subtract(discount);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) finalTotal = BigDecimal.ZERO;

        log.info("💰 Price Calculation: Subtotal={} - Discount={} = FinalTotal={}",
                calculatedSubtotal, discount, finalTotal);

        // 5. Créer la commande
        Order order = Order.builder()
                .userId(userId)
                .orderNumber(orderNumber)
                .status(OrderStatus.PENDING)
                .totalAmount(finalTotal) // ✅ Utiliser le total recalculé
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod())
                .promoCode(request.getPromoCode())
                .discount(discount)
                .build();

        for (OrderItem item : orderItems) {
            order.addItem(item);
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully: {}", savedOrder.getOrderNumber());

        publishOrderEvent(savedOrder, "OrderCreated");

        return convertToDto(savedOrder);
    }


    @Transactional
    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new RuntimeException("Order not found");
        }
        orderRepository.deleteById(id);
        log.info("Order deleted: {}", id);
    }

    private void publishOrderEvent(Order order, String eventType) {
        OrderEvent event = OrderEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .timestamp(LocalDateTime.now())
                .orderId(order.getId().toString())
                .userId(order.getUserId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .build();

        kafkaTemplate.send("order-events", event);
    }

    // Méthode utilitaire convertToDto rendue publique ou utilisée en interne
    public OrderDto convertToDto(Order order) {
        return OrderDto.fromEntity(order);
    }

    private OrderItemDto convertItemToDto(OrderItem item) {
        return OrderItemDto.fromEntity(item);
    }
}

```

## File: backend/cart-service/pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.1</version>
        <relativePath/>
    </parent>

    <groupId>com.ecommerce</groupId>
    <artifactId>cart-service</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>cart-service</name>
    <description>Cart Service for E-Commerce Platform</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Data Redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

        <!-- Spring Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.3</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Bucket4j Rate Limiting -->
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-core</artifactId>
            <version>8.7.0</version>
        </dependency>
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-redis</artifactId>
            <version>8.7.0</version>
        </dependency>

        <!-- Lettuce Redis Client -->
        <dependency>
            <groupId>io.lettuce</groupId>
            <artifactId>lettuce-core</artifactId>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>


```

## File: backend/cart-service/src/main/resources/application.yml
```yaml
spring:
  application:
    name: cart-service
  
  data:
    redis:
      host: localhost
      port: 6379
      timeout: 60000

server:
  port: 8085

# JWT Configuration
jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration: 900000

# Rate Limiting
rate-limiting:
  enabled: true
  requests-per-minute: 100
  cache-ttl: 3600

# Actuator
management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      show-details: always

# Logging
logging:
  level:
    com.ecommerce.cart: DEBUG
    org.springframework.data.redis: INFO

# External Services URLs
order-service:
  url: http://localhost:8083

product-service:
  url: http://localhost:8082

```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/CartServiceApplication.java
```java
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

```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/dto/UpdatePromoCodeRequest.java
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePromoCodeRequest {
    private String description;
    private BigDecimal discountPercent;
    private LocalDateTime expiresAt;
    private BigDecimal minAmount;
    private BigDecimal maxDiscount;
    private Boolean active;
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/dto/CreatePromoCodeRequest.java
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePromoCodeRequest {
    private String code;
    private String description;
    private BigDecimal discountPercent;
    private LocalDateTime expiresAt;
    private BigDecimal minAmount;
    private BigDecimal maxDiscount;
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/dto/OrderResponse.java
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String userId;
    private String orderNumber;
    private String status;
    private BigDecimal totalAmount;
    private List<OrderItemDto> items;
    private String shippingAddress;
    private String paymentMethod;
    private LocalDateTime createdAt;
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/dto/ApplyPromoCodeRequest.java
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyPromoCodeRequest {
    private String promoCode;

    // Ajoutez cette méthode utilitaire pour éviter la confusion
    public String getCode() {
        return promoCode;
    }
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/dto/OrderItemDto.java
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/dto/UpdateCartItemRequest.java
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCartItemRequest {
    private Integer quantity;
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/dto/CheckoutRequest.java
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {
    private String shippingAddress;
    private String paymentMethod;
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/dto/AddToCartRequest.java
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequest {
    private Long productId;
    private String productName;
    private BigDecimal price;
    private Integer quantity;
    private String imageUrl;
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/dto/CreateOrderRequest.java
```java
package com.ecommerce.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    // ✅ CE CHAMP EST INDISPENSABLE POUR CheckoutService
    private String userId;

    private List<OrderItemDto> items;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String paymentMethod;
    private String promoCode;
    private BigDecimal discount;
}

```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/repository/PromoCodeRepository.java
```java
package com.ecommerce.cart.repository;

import com.ecommerce.cart.entity.PromoCode;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PromoCodeRepository extends CrudRepository<PromoCode, String> {
    // Redis auto-implements CRUD methods
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/config/SecurityConfig.java
```java
package com.ecommerce.cart.config;

import com.ecommerce.cart.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/api/**").permitAll()

                        // Promo codes - Public read, Auth write
                        .requestMatchers(HttpMethod.GET, "/api/promo-codes/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/promo-codes/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/promo-codes/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/promo-codes/**").authenticated()

                        // Cart endpoints require authentication
                        .requestMatchers("/api/cart/**").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200", "http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/config/RedisConfig.java
```java
package com.ecommerce.cart.config;

import com.ecommerce.cart.entity.Cart;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Cart> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Cart> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Configure ObjectMapper for LocalDateTime
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // JSON Serializer for Cart
        Jackson2JsonRedisSerializer<Cart> serializer = new Jackson2JsonRedisSerializer<>(objectMapper, Cart.class);

        // Key serializer (String)
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Value serializer (JSON)
        template.setValueSerializer(serializer);
        template.setHashValueSerializer(serializer);

        template.afterPropertiesSet();
        return template;
    }
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/config/RateLimitConfig.java
```java
package com.ecommerce.cart.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${rate-limiting.cache-ttl:3600}")
    private long cacheTtl;

    @Bean
    public ProxyManager<String> proxyManager() {
        RedisURI redisUri = RedisURI.Builder
                .redis(redisHost, redisPort)
                .build();

        RedisClient redisClient = RedisClient.create(redisUri);
        StatefulRedisConnection<String, byte[]> connection = 
            redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));

        return LettuceBasedProxyManager.builderFor(connection)
                .withExpirationStrategy(
                    ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(
                        Duration.ofSeconds(cacheTtl)
                    )
                )
                .build();
    }
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/config/RestTemplateConfig.java
```java
package com.ecommerce.cart.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }
}



```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/security/JwtAuthenticationFilter.java
```java
package com.ecommerce.cart.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        try {
            String jwt = getJwtFromRequest(request);
            
            if (jwt != null && tokenProvider.validateToken(jwt)) {
                String userId = tokenProvider.getUserIdFromToken(jwt);
                
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                        userId, 
                        null, 
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                log.debug("Set authentication for user: {}", userId);
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        return null;
    }
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/security/JwtTokenProvider.java
```java
package com.ecommerce.cart.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey key;

    public JwtTokenProvider(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    public String getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
        
        return claims.get("userId", String.class);
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
        
        return claims.getSubject();
    }
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/entity/CartItem.java
```java
package com.ecommerce.cart.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem implements Serializable {
    
    private Long productId;
    private String productName;
    private BigDecimal price;
    private Integer quantity;
    private String imageUrl;
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/entity/PromoCode.java
```java
package com.ecommerce.cart.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RedisHash("promo_codes")
public class PromoCode implements Serializable {

    @Id
    private String code; // Code = ID (ex: WELCOME10)

    private String description; // Ex: "New customer welcome discount"
    private BigDecimal discountPercent;
    private LocalDateTime expiresAt;
    private BigDecimal minAmount; // Montant minimum
    private BigDecimal maxDiscount; // Réduction maximale
    private Boolean active; // Active/Inactive
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonIgnore
    @TimeToLive
    private Long ttl; // Auto-expire in Redis

    public boolean isValid() {
        return active != null && active &&
                expiresAt != null && expiresAt.isAfter(LocalDateTime.now());
    }

    public void calculateTTL() {
        if (expiresAt != null) {
            long seconds = java.time.Duration.between(LocalDateTime.now(), expiresAt).getSeconds();
            this.ttl = seconds > 0 ? seconds : null;
        }
    }
}

```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/entity/Cart.java
```java
package com.ecommerce.cart.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RedisHash("carts")
public class Cart implements Serializable {

    @Id
    private String userId;

    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    private BigDecimal subtotal; // Sous-total avant réduction
    private BigDecimal totalAmount; // Total après réduction

    // Promo Code fields
    private String promoCode;
    private BigDecimal discount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonIgnore
    @TimeToLive
    @Builder.Default
    private Long ttl = 604800L; // 7 days

    public void addItem(CartItem item) {
        for (CartItem existingItem : items) {
            if (existingItem.getProductId().equals(item.getProductId())) {
                existingItem.setQuantity(existingItem.getQuantity() + item.getQuantity());
                calculateTotal();
                return;
            }
        }
        items.add(item);
        calculateTotal();
    }

    public void removeItem(Long productId) {
        items.removeIf(item -> item.getProductId().equals(productId));
        calculateTotal();
    }

    public void updateItemQuantity(Long productId, Integer quantity) {
        for (CartItem item : items) {
            if (item.getProductId().equals(productId)) {
                item.setQuantity(quantity);
                calculateTotal();
                return;
            }
        }
    }

    public void calculateTotal() {
        this.subtotal = items.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        // Recalculer avec promo code si présent
        if (discount != null && discount.compareTo(BigDecimal.ZERO) > 0) {
            this.totalAmount = subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP);
        } else {
            this.totalAmount = subtotal;
        }
    }

    public void applyPromoCode(PromoCode promo) {
        if (!promo.isValid()) {
            throw new IllegalArgumentException("Promo code is expired");
        }

        // Vérifier montant minimum
        if (promo.getMinAmount() != null && subtotal.compareTo(promo.getMinAmount()) < 0) {
            throw new IllegalArgumentException(
                    String.format("Minimum amount required: %.2f", promo.getMinAmount())
            );
        }

        this.promoCode = promo.getCode();

        // Calculer réduction
        BigDecimal calculatedDiscount = subtotal
                .multiply(promo.getDiscountPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Appliquer réduction maximale si définie
        if (promo.getMaxDiscount() != null && calculatedDiscount.compareTo(promo.getMaxDiscount()) > 0) {
            calculatedDiscount = promo.getMaxDiscount();
        }

        this.discount = calculatedDiscount;
        this.totalAmount = subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP);
    }

    public void removePromoCode() {
        this.promoCode = null;
        this.discount = null;
        calculateTotal();
    }

    public void clear() {
        items.clear();
        subtotal = BigDecimal.ZERO;
        totalAmount = BigDecimal.ZERO;
        promoCode = null;
        discount = null;
    }
}

```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/controller/CartController.java
```java
package com.ecommerce.cart.controller;

import com.ecommerce.cart.dto.AddToCartRequest;
import com.ecommerce.cart.dto.ApplyPromoCodeRequest;
import com.ecommerce.cart.dto.UpdateCartItemRequest;
import com.ecommerce.cart.entity.Cart;
import com.ecommerce.cart.service.CartService;
import com.ecommerce.cart.dto.CheckoutRequest;
import com.ecommerce.cart.service.CheckoutService;
import org.springframework.web.bind.annotation.RequestHeader;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Slf4j
public class CartController {

    private final CartService cartService;
    private final CheckoutService checkoutService;


    @GetMapping
    public ResponseEntity<Cart> getCart(Authentication authentication) {
        String userId = authentication.getName();
        Cart cart = cartService.getCart(userId);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/items")
    public ResponseEntity<Cart> addItem(
            Authentication authentication,
            @RequestBody AddToCartRequest request) {
        String userId = authentication.getName();
        log.info("Adding item to cart for user: {}", userId);

        Cart cart = cartService.addItem(userId, request);
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<Cart> updateItem(
            Authentication authentication,
            @PathVariable Long productId,
            @RequestBody UpdateCartItemRequest request) {
        String userId = authentication.getName();
        log.info("Updating item {} quantity to {} for user: {}",
                productId, request.getQuantity(), userId);

        Cart cart = cartService.updateItemQuantity(userId, productId, request.getQuantity());
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<Cart> removeItem(
            Authentication authentication,
            @PathVariable Long productId) {
        String userId = authentication.getName();
        log.info("Removing item {} from cart for user: {}", productId, userId);

        Cart cart = cartService.removeItem(userId, productId);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/promo")
    public ResponseEntity<?> applyPromoCode(
            Authentication authentication,
            @RequestBody ApplyPromoCodeRequest request) {
        String userId = authentication.getName();
        log.info("🎟️ Applying promo code {} for user: {}", request.getCode(), userId);

        try {
            Cart cart = cartService.applyPromoCode(userId, request.getCode());
            log.info("✅ Promo code applied successfully");
            return ResponseEntity.ok(cart);
        } catch (IllegalArgumentException e) {
            log.warn("❌ Promo code error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @DeleteMapping("/promo")
    public ResponseEntity<Cart> removePromoCode(Authentication authentication) {
        String userId = authentication.getName();
        log.info("Removing promo code for user: {}", userId);

        Cart cart = cartService.removePromoCode(userId);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            Authentication authentication,
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody CheckoutRequest request) {

        String userId = authentication.getName();
        log.info("🛍️ Checkout initiated for user: {}", userId);

        try {
            // Extract JWT token
            String jwtToken = authorizationHeader.replace("Bearer ", "");

            // Validate request
            if (request.getShippingAddress() == null || request.getShippingAddress().isBlank()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Shipping address is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            if (request.getPaymentMethod() == null || request.getPaymentMethod().isBlank()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Payment method is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Process checkout
            Map<String, Object> response = checkoutService.checkout(userId, request, jwtToken);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("❌ Checkout validation error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("❌ Checkout failed: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Checkout failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }


    @DeleteMapping
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        String userId = authentication.getName();
        log.info("Clearing cart for user: {}", userId);

        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}

```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/controller/PromoCodeController.java
```java
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

```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/filter/RateLimitFilter.java
```java
package com.ecommerce.cart.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final ProxyManager<String> proxyManager;

    @Value("${rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    @Value("${rate-limiting.requests-per-minute:100}")
    private int requestsPerMinute;

    private int getRateLimitForPath(String path, String method) {
        if (path.contains("/cart/items") && method.equals("POST")) {
            return 50; // 50 ajouts/min
        }
        if (path.contains("/cart") && method.equals("GET")) {
            return 100; // 100 lectures/min
        }
        return requestsPerMinute; // Default 100
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!rateLimitingEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String key = "rate_limit:" + clientIp;
        int limit = getRateLimitForPath(request.getRequestURI(), request.getMethod());

        Supplier<BucketConfiguration> configSupplier = () -> {
            Refill refill = Refill.intervally(limit, Duration.ofMinutes(1));
            Bandwidth bandwidth = Bandwidth.classic(limit, refill);
            return BucketConfiguration.builder()
                    .addLimit(bandwidth)
                    .build();
        };

        Bucket bucket = proxyManager.builder().build(key, configSupplier);

        if (bucket.tryConsume(1)) {
            long remainingTokens = bucket.getAvailableTokens();
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(remainingTokens));
            response.setHeader("X-Rate-Limit-Limit", String.valueOf(limit));
            
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(429);
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", "60");
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded. Try again in 1 minute.\"}");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}


```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/service/PromoCodeService.java
```java
package com.ecommerce.cart.service;

import com.ecommerce.cart.dto.CreatePromoCodeRequest;
import com.ecommerce.cart.dto.UpdatePromoCodeRequest;
import com.ecommerce.cart.entity.PromoCode;
import com.ecommerce.cart.repository.PromoCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;

    // CREATE
    public PromoCode createPromoCode(CreatePromoCodeRequest request) {
        // Vérifier si le code existe déjà
        if (promoCodeRepository.existsById(request.getCode().toUpperCase())) {
            throw new IllegalArgumentException("Promo code already exists: " + request.getCode());
        }

        PromoCode promoCode = PromoCode.builder()
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .discountPercent(request.getDiscountPercent())
                .expiresAt(request.getExpiresAt())
                .minAmount(request.getMinAmount())
                .maxDiscount(request.getMaxDiscount())
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        promoCode.calculateTTL();

        PromoCode saved = promoCodeRepository.save(promoCode);
        log.info("✅ Created promo code: {}", saved.getCode());

        return saved;
    }

    // READ ONE
    public Optional<PromoCode> getPromoCode(String code) {
        return promoCodeRepository.findById(code.toUpperCase());
    }

    // READ ALL
    public List<PromoCode> getAllPromoCodes() {
        return StreamSupport.stream(promoCodeRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());
    }

    // READ ACTIVE ONLY
    public List<PromoCode> getActivePromoCodes() {
        return getAllPromoCodes().stream()
                .filter(PromoCode::isValid)
                .collect(Collectors.toList());
    }

    // UPDATE
    public PromoCode updatePromoCode(String code, UpdatePromoCodeRequest request) {
        PromoCode promoCode = promoCodeRepository.findById(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Promo code not found: " + code));

        if (request.getDescription() != null) {
            promoCode.setDescription(request.getDescription());
        }
        if (request.getDiscountPercent() != null) {
            promoCode.setDiscountPercent(request.getDiscountPercent());
        }
        if (request.getExpiresAt() != null) {
            promoCode.setExpiresAt(request.getExpiresAt());
            promoCode.calculateTTL();
        }
        if (request.getMinAmount() != null) {
            promoCode.setMinAmount(request.getMinAmount());
        }
        if (request.getMaxDiscount() != null) {
            promoCode.setMaxDiscount(request.getMaxDiscount());
        }
        if (request.getActive() != null) {
            promoCode.setActive(request.getActive());
        }

        promoCode.setUpdatedAt(LocalDateTime.now());

        PromoCode updated = promoCodeRepository.save(promoCode);
        log.info("✏️ Updated promo code: {}", updated.getCode());

        return updated;
    }

    // DELETE
    public void deletePromoCode(String code) {
        if (!promoCodeRepository.existsById(code.toUpperCase())) {
            throw new IllegalArgumentException("Promo code not found: " + code);
        }

        promoCodeRepository.deleteById(code.toUpperCase());
        log.info("🗑️ Deleted promo code: {}", code);
    }

    // VALIDATE (for cart usage)
    public Optional<PromoCode> validatePromoCode(String code) {
        Optional<PromoCode> promoOpt = promoCodeRepository.findById(code.toUpperCase());

        if (promoOpt.isEmpty()) {
            log.warn("Promo code not found: {}", code);
            return Optional.empty();
        }

        PromoCode promo = promoOpt.get();

        if (!promo.isValid()) {
            log.warn("Promo code invalid or expired: {}", code);
            return Optional.empty();
        }

        log.info("Promo code validated: {}", code);
        return Optional.of(promo);
    }

    // SEED INITIAL DATA (appelé au démarrage)
    public void seedPromoCodes() {
        if (promoCodeRepository.count() == 0) {
            log.info("🌱 Seeding initial promo codes...");

            createPromoCode(CreatePromoCodeRequest.builder()
                    .code("WELCOME10")
                    .description("New customer 10% discount")
                    .discountPercent(BigDecimal.valueOf(10))
                    .expiresAt(LocalDateTime.now().plusMonths(1))
                    .minAmount(BigDecimal.valueOf(50))
                    .maxDiscount(BigDecimal.valueOf(100))
                    .build());

            createPromoCode(CreatePromoCodeRequest.builder()
                    .code("SAVE20")
                    .description("Save 20% on orders over $100")
                    .discountPercent(BigDecimal.valueOf(20))
                    .expiresAt(LocalDateTime.now().plusMonths(1))
                    .minAmount(BigDecimal.valueOf(100))
                    .maxDiscount(BigDecimal.valueOf(200))
                    .build());

            createPromoCode(CreatePromoCodeRequest.builder()
                    .code("VIP50")
                    .description("VIP 50% discount")
                    .discountPercent(BigDecimal.valueOf(50))
                    .expiresAt(LocalDateTime.now().plusMonths(1))
                    .minAmount(BigDecimal.valueOf(500))
                    .maxDiscount(null)
                    .build());

            log.info("✅ Seeded 3 promo codes");
        }
    }
}

```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/service/CartService.java
```java
package com.ecommerce.cart.service;

import com.ecommerce.cart.dto.AddToCartRequest;
import com.ecommerce.cart.entity.Cart;
import com.ecommerce.cart.entity.CartItem;
import com.ecommerce.cart.entity.PromoCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final RedisTemplate<String, Cart> redisTemplate;
    private final PromoCodeService promoCodeService;

    private static final String CART_KEY_PREFIX = "cart:";
    private static final long CART_TTL_DAYS = 7;

    public Cart getCart(String userId) {
        String key = CART_KEY_PREFIX + userId;
        Cart cart = redisTemplate.opsForValue().get(key);

        if (cart == null) {
            log.info("Creating new cart for user: {}", userId);
            cart = Cart.builder()
                    .userId(userId)
                    .subtotal(BigDecimal.ZERO)
                    .totalAmount(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            saveCart(cart);
        }

        return cart;
    }

    public Cart addItem(String userId, AddToCartRequest request) {
        Cart cart = getCart(userId);

        CartItem item = CartItem.builder()
                .productId(request.getProductId())
                .productName(request.getProductName())
                .price(request.getPrice())
                .quantity(request.getQuantity())
                .imageUrl(request.getImageUrl())
                .build();

        cart.addItem(item);
        cart.setUpdatedAt(LocalDateTime.now());

        saveCart(cart);
        log.info("Added item {} to cart for user {}", request.getProductId(), userId);

        return cart;
    }

    public Cart updateItemQuantity(String userId, Long productId, Integer quantity) {
        Cart cart = getCart(userId);

        if (quantity <= 0) {
            cart.removeItem(productId);
        } else {
            cart.updateItemQuantity(productId, quantity);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(cart);

        log.info("Updated item {} quantity to {} for user {}", productId, quantity, userId);
        return cart;
    }

    public Cart removeItem(String userId, Long productId) {
        Cart cart = getCart(userId);
        cart.removeItem(productId);
        cart.setUpdatedAt(LocalDateTime.now());

        saveCart(cart);
        log.info("Removed item {} from cart for user {}", productId, userId);

        return cart;
    }

    public void clearCart(String userId) {
        Cart cart = getCart(userId);
        cart.clear();
        cart.setUpdatedAt(LocalDateTime.now());

        saveCart(cart);
        log.info("Cleared cart for user {}", userId);
    }

    public void deleteCart(String userId) {
        String key = CART_KEY_PREFIX + userId;
        redisTemplate.delete(key);
        log.info("Deleted cart for user {}", userId);
    }

    // ===== PROMO CODE METHODS =====

    public Cart applyPromoCode(String userId, String code) {
        Cart cart = getCart(userId);

        PromoCode promo = promoCodeService.validatePromoCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired promo code"));

        cart.applyPromoCode(promo);
        cart.setUpdatedAt(LocalDateTime.now());

        saveCart(cart);
        log.info("Applied promo code {} to cart for user {}", code, userId);

        return cart;
    }

    public Cart removePromoCode(String userId) {
        Cart cart = getCart(userId);
        cart.removePromoCode();
        cart.setUpdatedAt(LocalDateTime.now());

        saveCart(cart);
        log.info("Removed promo code from cart for user {}", userId);

        return cart;
    }

    private void saveCart(Cart cart) {
        String key = CART_KEY_PREFIX + cart.getUserId();
        redisTemplate.opsForValue().set(key, cart, CART_TTL_DAYS, TimeUnit.DAYS);
    }
}

```

## File: backend/cart-service/src/main/java/com/ecommerce/cart/service/CheckoutService.java
```java
package com.ecommerce.cart.service;

import com.ecommerce.cart.dto.*;
import com.ecommerce.cart.entity.Cart;
import com.ecommerce.cart.entity.CartItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheckoutService {

    private final CartService cartService;
    private final RestTemplate restTemplate;

    @Value("${order-service.url:http://localhost:8083}")
    private String orderServiceUrl;

    @Value("${product-service.url:http://localhost:8082}")
    private String productServiceUrl;

    public Map<String, Object> checkout(String userId, CheckoutRequest request, String jwtToken) {
        // 1. Récupération du panier
        Cart cart = cartService.getCart(userId);

        if (cart == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty or not found");
        }

        log.info("🛒 Starting checkout for user {} with {} items", userId, cart.getItems().size());

        // 2. Validation du Stock (Lecture seule pour vérifier)
        validateStock(cart.getItems(), jwtToken);

        // 3. Création de la commande
        OrderResponse order = createOrder(userId, cart, request, jwtToken);

        // 4. Mise à jour réelle du stock (Écriture)
        updateProductStock(cart.getItems(), jwtToken);

        // 5. Vider le panier
        cartService.clearCart(userId);

        log.info("✅ Checkout completed successfully. Order ID: {}", order.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Order created successfully");
        response.put("order", order);

        return response;
    }

    private void validateStock(List<CartItem> items, String jwtToken) {
        log.info("📦 Validating stock for {} items", items.size());

        HttpHeaders headers = createHeaders(jwtToken);

        for (CartItem item : items) {
            try {
                String url = productServiceUrl + "/api/products/" + item.getProductId();

                ResponseEntity<Map> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        new HttpEntity<>(headers),
                        Map.class
                );

                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                    Map<String, Object> product = response.getBody();
                    Number stockQtyNum = (Number) product.get("stockQuantity");
                    int stockQuantity = stockQtyNum != null ? stockQtyNum.intValue() : 0;

                    if (stockQuantity < item.getQuantity()) {
                        throw new IllegalArgumentException(
                                String.format("Stock insuffisant pour : %s (Demandé: %d, Dispo: %d)",
                                        item.getProductName(), item.getQuantity(), stockQuantity)
                        );
                    }
                }
            } catch (HttpClientErrorException.NotFound e) {
                throw new IllegalArgumentException("Produit introuvable : " + item.getProductName());
            } catch (Exception e) {
                log.warn("⚠️ Erreur validation stock pour {}: {}", item.getProductId(), e.getMessage());
                if (e instanceof IllegalArgumentException) throw e;
            }
        }
    }

    private OrderResponse createOrder(String userId, Cart cart, CheckoutRequest request, String jwtToken) {
        log.info("📝 Creating order in Order Service");

        List<OrderItemDto> orderItems = cart.getItems().stream()
                .map(item -> OrderItemDto.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        CreateOrderRequest orderRequest = CreateOrderRequest.builder()
                .userId(userId) // Indispensable
                .items(orderItems)
                .totalAmount(cart.getTotalAmount())
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod())
                .promoCode(cart.getPromoCode())
                .discount(cart.getDiscount())
                .build();

        HttpHeaders headers = createHeaders(jwtToken);
        HttpEntity<CreateOrderRequest> entity = new HttpEntity<>(orderRequest, headers);

        try {
            String url = orderServiceUrl + "/api/orders";

            ResponseEntity<OrderResponse> response = restTemplate.postForEntity(
                    url,
                    entity,
                    OrderResponse.class
            );

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("Order Service returned non-created status: " + response.getStatusCode());
            }
        } catch (HttpClientErrorException e) {
            log.error("❌ Order Service Error: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Failed to create order: " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ System Error creating order: {}", e.getMessage());
            throw new RuntimeException("System error during checkout");
        }
    }

    // ✅ IMPLEMENTATION DE LA MISE A JOUR DU STOCK
    private void updateProductStock(List<CartItem> items, String jwtToken) {
        log.info("📉 Updating stock for {} items...", items.size());

        HttpHeaders headers = createHeaders(jwtToken);

        for (CartItem item : items) {
            try {
                // Appel PATCH /api/products/{id}/stock/reduce?quantity=X
                String url = String.format("%s/api/products/%d/stock/reduce?quantity=%d",
                        productServiceUrl, item.getProductId(), item.getQuantity());

                restTemplate.exchange(
                        url,
                        HttpMethod.PATCH, // Utilisation de PATCH
                        new HttpEntity<>(headers),
                        Void.class
                );

                log.debug("✅ Stock reduced for product {}", item.getProductId());

            } catch (Exception e) {
                // IMPORTANT : Dans une architecture distribuée sans Saga Pattern complet,
                // si la mise à jour du stock échoue après la création de la commande,
                // on a une incohérence.
                // Ici, on loggue une erreur CRITIQUE pour intervention manuelle.
                log.error("🚨 CRITICAL: Failed to update stock for product {} after order placement! Error: {}",
                        item.getProductId(), e.getMessage());
            }
        }
    }

    private HttpHeaders createHeaders(String jwtToken) {
        HttpHeaders headers = new HttpHeaders();
        if (jwtToken != null && !jwtToken.isEmpty()) {
            String token = jwtToken.startsWith("Bearer ") ? jwtToken : "Bearer " + jwtToken;
            headers.set("Authorization", token);
        }
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}

```

## File: backend/auth-service/pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.4.12</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<groupId>com.ecommerce</groupId>
	<artifactId>auth-service</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>auth-service</name>
	<description>Authentication and authorization service with OAuth2</description>
	<url/>
	<licenses>
		<license/>
	</licenses>
	<developers>
		<developer/>
	</developers>
	<scm>
		<connection/>
		<developerConnection/>
		<tag/>
		<url/>
	</scm>
	<properties>
		<java.version>17</java.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-oauth2-client</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-security</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>

		<dependency>
			<groupId>org.postgresql</groupId>
			<artifactId>postgresql</artifactId>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.security</groupId>
			<artifactId>spring-security-test</artifactId>
			<scope>test</scope>
		</dependency>
        <!-- JWT Dependencies -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.11.5</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <!-- Flyway for database migrations -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- Bucket4j Rate Limiting -->
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-core</artifactId>
            <version>8.7.0</version>
        </dependency>
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-redis</artifactId>
            <version>8.7.0</version>
        </dependency>

        <!-- Lettuce Redis Client (if not already present) -->
        <dependency>
            <groupId>io.lettuce</groupId>
            <artifactId>lettuce-core</artifactId>
        </dependency>


    </dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<annotationProcessorPaths>
						<path>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</path>
					</annotationProcessorPaths>
				</configuration>
			</plugin>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
				<configuration>
					<excludes>
						<exclude>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</exclude>
					</excludes>
				</configuration>
			</plugin>
		</plugins>
	</build>

</project>

```

## File: backend/auth-service/src/test/java/com/ecommerce/auth/AuthServiceApplicationTests.java
```java
package com.ecommerce.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AuthServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}

```

## File: backend/auth-service/src/main/resources/application.yml
```yaml
server:
  port: 8081
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain
    min-response-size: 1024

spring:
  application:
    name: auth-service

  datasource:
    url: jdbc:postgresql://localhost:5432/auth_db
    username: ecommerce
    password: ecommerce123
    driver-class-name: org.postgresql.Driver

  data:
    redis:
      host: localhost
      port: 6379
      timeout: 60000


  jpa:
    hibernate:
      ddl-auto: validate  # Change de 'update' à 'validate'
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect

  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID:your-google-client-id}
            client-secret: ${GOOGLE_CLIENT_SECRET:your-google-secret}
            scope: profile, email
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
          github:
            client-id: ${GITHUB_CLIENT_ID:your-github-client-id}
            client-secret: ${GITHUB_CLIENT_SECRET:your-github-secret}
            scope: user:email

# JWT Configuration
jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration: 900000 # 15 minutes
  refresh-expiration: 604800000 # 7 days



logging:
  level:
    com.ecommerce.auth: DEBUG

# Rate Limiting Configuration
rate-limiting:
  enabled: true
  requests-per-minute: 100
  cache-ttl: 3600

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/AuthServiceApplication.java
```java
package com.ecommerce.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AuthServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AuthServiceApplication.class, args);
	}

}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/dto/RegisterRequest.java
```java
package com.ecommerce.auth.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String name;
    private String password;
}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/dto/AuthResponse.java
```java
package com.ecommerce.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserDto user;
}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/dto/LoginRequest.java
```java
package com.ecommerce.auth.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/dto/UserDto.java
```java
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
}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/repository/UserRepository.java
```java
package com.ecommerce.auth.repository;

import com.ecommerce.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByOauthProviderAndOauthId(String provider, String oauthId);
    boolean existsByEmail(String email);
}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/config/SecurityConfig.java
```java
package com.ecommerce.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/health",
                                "/actuator/**",
                                "/login/oauth2/**",
                                "/oauth2/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/config/RateLimitConfig.java
```java
package com.ecommerce.auth.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${rate-limiting.cache-ttl:3600}")
    private long cacheTtl;

    @Bean
    public ProxyManager<String> proxyManager() {
        RedisURI redisUri = RedisURI.Builder
                .redis(redisHost, redisPort)
                .build();

        RedisClient redisClient = RedisClient.create(redisUri);
        StatefulRedisConnection<String, byte[]> connection = 
            redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));

        return LettuceBasedProxyManager.builderFor(connection)
                .withExpirationStrategy(
                    ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(
                        Duration.ofSeconds(cacheTtl)
                    )
                )
                .build();
    }
}


```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/config/CorsConfig.java
```java
package com.ecommerce.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")  // URL du frontend Angular
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

//    @Bean
//    public CorsConfigurationSource corsConfigurationSource() {
//        CorsConfiguration configuration = new CorsConfiguration();
//        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
//        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
//        configuration.setAllowedHeaders(Arrays.asList("*"));
//        configuration.setAllowCredentials(true);
//
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", configuration);
//        return source;
//    }
}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/security/JwtUtil.java
```java
package com.ecommerce.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateAccessToken(UUID userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId.toString());
        claims.put("email", email);
        claims.put("role", role);

        return createToken(claims, email, expiration);
    }

    public String generateRefreshToken(String email) {
        return createToken(new HashMap<>(), email, refreshExpiration);
    }

    private String createToken(Map<String, Object> claims, String subject, Long validityPeriod) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + validityPeriod);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public UUID extractUserId(String token) {
        String userId = (String) extractClaims(token).get("userId");
        return userId != null ? UUID.fromString(userId) : null;
    }

    public String extractRole(String token) {
        return (String) extractClaims(token).get("role");
    }

    public Date extractExpiration(String token) {
        return extractClaims(token).getExpiration();
    }

    private Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (SecurityException ex) {
            log.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty");
        }
        return false;
    }
}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/entity/User.java
```java
package com.ecommerce.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    private String password;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    @Column(name = "oauth_id")
    private String oauthId;

    @Enumerated(EnumType.STRING)
    private Role role = Role.CUSTOMER;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Role {
        CUSTOMER, ADMIN
    }
}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/controller/AuthController.java
```java
package com.ecommerce.auth.controller;

import com.ecommerce.auth.dto.*;
import com.ecommerce.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "UP",
                "service", "auth-service",
                "message", "Auth Service is running!"
        );
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            log.info("Registration attempt for email: {}", request.getEmail());
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.error("Registration failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            log.info("Login attempt for email: {}", request.getEmail());
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Login failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            // TODO: Extract email from JWT token
            // Pour l'instant, retourner un profil fictif
            return ResponseEntity.ok(Map.of(
                    "message", "Profile endpoint - JWT validation to be implemented"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid token"));
        }
    }
}

```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/filter/RateLimitFilter.java
```java
package com.ecommerce.auth.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final ProxyManager<String> proxyManager;

    @Value("${rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    @Value("${rate-limiting.requests-per-minute:100}")
    private int requestsPerMinute;

    private int getRateLimitForPath(String path) {
        if (path.contains("/auth/login")) {
            return 20; // 20 tentatives de login/min (protection brute force)
        }
        if (path.contains("/auth/register")) {
            return 10; // 10 inscriptions/min (protection spam)
        }
        if (path.contains("/auth/refresh")) {
            return 50; // 50 refresh token/min
        }
        return requestsPerMinute; // Default 100
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!rateLimitingEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String key = "rate_limit:" + clientIp;

        // UNE SEULE déclaration ici
        int limit = getRateLimitForPath(request.getRequestURI());

        Supplier<BucketConfiguration> configSupplier = () -> {
            Refill refill = Refill.intervally(limit, Duration.ofMinutes(1));
            Bandwidth bandwidth = Bandwidth.classic(limit, refill);
            return BucketConfiguration.builder()
                    .addLimit(bandwidth)
                    .build();
        };

        Bucket bucket = proxyManager.builder().build(key, configSupplier);

        if (bucket.tryConsume(1)) {
            long remainingTokens = bucket.getAvailableTokens();
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(remainingTokens));
            response.setHeader("X-Rate-Limit-Limit", String.valueOf(limit));

            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(429);
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", "60");
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded. Try again in 1 minute.\"}");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}


```

## File: backend/auth-service/src/main/java/com/ecommerce/auth/service/AuthService.java
```java
package com.ecommerce.auth.service;

import com.ecommerce.auth.dto.*;
import com.ecommerce.auth.entity.User;
import com.ecommerce.auth.repository.UserRepository;
import com.ecommerce.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Vérifier si l'email existe déjà
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Créer le nouvel utilisateur
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.CUSTOMER)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        // Générer les tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        // Créer la réponse
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(900000L) // 15 minutes
                .user(convertToUserDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Trouver l'utilisateur
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // Vérifier le mot de passe
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        log.info("User logged in: {}", user.getEmail());

        // Générer les tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(900000L)
                .user(convertToUserDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToUserDto(user);
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToUserDto(user);
    }

    private UserDto convertToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .oauthProvider(user.getOauthProvider())
                .build();
    }
}

```

## File: backend/common-lib/pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.12</version>
        <relativePath/>
    </parent>

    <groupId>com.ecommerce</groupId>
    <artifactId>common-lib</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
    </dependencies>
</project>


```

## File: backend/common-lib/src/main/java/com/ecommerce/common/event/OrderEvent.java
```java
package com.ecommerce.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderEvent {
    private String eventId;
    private String eventType; // OrderCreated, PaymentCompleted, OrderShipped
    private LocalDateTime timestamp;
    private String orderId;      // Changed from UUID to String
    private String userId;       // Changed from UUID to String
    private BigDecimal totalAmount;
    private String status;
}

```

## File: frontend/tailwind.config.js
```typescript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

```

## File: frontend/tsconfig.app.json
```json
/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ]
}

```

## File: frontend/angular.json
```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "frontend": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/frontend",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyfills": [
              "zone.js"
            ],
            "tsConfig": "tsconfig.app.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": [
              "src/styles.css"
            ],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "4kB",
                  "maximumError": "8kB"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "frontend:build:production"
            },
            "development": {
              "buildTarget": "frontend:build:development",
              "proxyConfig": "proxy.conf.json"
            }
          },
          "defaultConfiguration": "development"
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n"
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": [
              "zone.js",
              "zone.js/testing"
            ],
            "tsConfig": "tsconfig.spec.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": [
              "src/styles.css"
            ],
            "scripts": []
          }
        }
      }
    }
  },
  "cli": {
    "analytics": false
  }
}

```

## File: frontend/package.json
```json
{
  "name": "frontend",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/common": "^19.2.0",
    "@angular/compiler": "^19.2.0",
    "@angular/core": "^19.2.0",
    "@angular/forms": "^19.2.0",
    "@angular/platform-browser": "^19.2.0",
    "@angular/platform-browser-dynamic": "^19.2.0",
    "@angular/router": "^19.2.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^19.2.19",
    "@angular/cli": "^19.2.19",
    "@angular/compiler-cli": "^19.2.0",
    "@types/jasmine": "~5.1.0",
    "autoprefixer": "^10.4.22",
    "jasmine-core": "~5.6.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.18",
    "typescript": "~5.7.2"
  }
}

```

## File: frontend/tsconfig.json
```json
/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}

```

## File: frontend/proxy.conf.json
```json
{
  "/api/auth": {
    "target": "http://localhost:8081",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  },
  "/api/products": {
    "target": "http://localhost:8082",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  },
  "/api/cart": {
    "target": "http://localhost:8085",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  },
  "/api/orders": {
    "target": "http://localhost:8083",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}

```

## File: frontend/tsconfig.spec.json
```json
/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": [
      "jasmine"
    ]
  },
  "include": [
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps_ssr/_metadata.json
```json
{
  "hash": "e3525958",
  "configHash": "3752edbb",
  "lockfileHash": "ffabcacc",
  "browserHash": "7b27977a",
  "optimized": {},
  "chunks": {}
}
```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps_ssr/package.json
```json
{
  "type": "module"
}

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/_metadata.json
```json
{
  "hash": "d0053386",
  "configHash": "906ba1e2",
  "lockfileHash": "ffabcacc",
  "browserHash": "db2bf5fa",
  "optimized": {
    "@angular/common": {
      "src": "../../../../../../node_modules/@angular/common/fesm2022/common.mjs",
      "file": "@angular_common.js",
      "fileHash": "c87bf69a",
      "needsInterop": false
    },
    "@angular/common/http": {
      "src": "../../../../../../node_modules/@angular/common/fesm2022/http.mjs",
      "file": "@angular_common_http.js",
      "fileHash": "399ca0bb",
      "needsInterop": false
    },
    "@angular/core": {
      "src": "../../../../../../node_modules/@angular/core/fesm2022/core.mjs",
      "file": "@angular_core.js",
      "fileHash": "05176591",
      "needsInterop": false
    },
    "@angular/forms": {
      "src": "../../../../../../node_modules/@angular/forms/fesm2022/forms.mjs",
      "file": "@angular_forms.js",
      "fileHash": "80cff3f4",
      "needsInterop": false
    },
    "@angular/platform-browser": {
      "src": "../../../../../../node_modules/@angular/platform-browser/fesm2022/platform-browser.mjs",
      "file": "@angular_platform-browser.js",
      "fileHash": "f6cc35fe",
      "needsInterop": false
    },
    "@angular/router": {
      "src": "../../../../../../node_modules/@angular/router/fesm2022/router.mjs",
      "file": "@angular_router.js",
      "fileHash": "c2b63cc5",
      "needsInterop": false
    },
    "rxjs": {
      "src": "../../../../../../node_modules/rxjs/dist/esm5/index.js",
      "file": "rxjs.js",
      "fileHash": "7ed8802e",
      "needsInterop": false
    },
    "rxjs/operators": {
      "src": "../../../../../../node_modules/rxjs/dist/esm5/operators/index.js",
      "file": "rxjs_operators.js",
      "fileHash": "e5c59555",
      "needsInterop": false
    }
  },
  "chunks": {
    "chunk-WMQUX6DB": {
      "file": "chunk-WMQUX6DB.js"
    },
    "chunk-257AE5XC": {
      "file": "chunk-257AE5XC.js"
    },
    "chunk-E2IFQTEF": {
      "file": "chunk-E2IFQTEF.js"
    },
    "chunk-KJ2FTQNQ": {
      "file": "chunk-KJ2FTQNQ.js"
    },
    "chunk-EP22WXWE": {
      "file": "chunk-EP22WXWE.js"
    },
    "chunk-6Q4RANH6": {
      "file": "chunk-6Q4RANH6.js"
    },
    "chunk-FFZIAYYX": {
      "file": "chunk-FFZIAYYX.js"
    },
    "chunk-CXCX2JKZ": {
      "file": "chunk-CXCX2JKZ.js"
    }
  }
}
```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/@angular_common.js
```typescript
import {
  APP_BASE_HREF,
  AsyncPipe,
  BrowserPlatformLocation,
  CommonModule,
  CurrencyPipe,
  DATE_PIPE_DEFAULT_OPTIONS,
  DATE_PIPE_DEFAULT_TIMEZONE,
  DatePipe,
  DecimalPipe,
  DomAdapter,
  FormStyle,
  FormatWidth,
  HashLocationStrategy,
  I18nPluralPipe,
  I18nSelectPipe,
  IMAGE_LOADER,
  JsonPipe,
  KeyValuePipe,
  LOCATION_INITIALIZED,
  Location,
  LocationStrategy,
  LowerCasePipe,
  NgClass,
  NgComponentOutlet,
  NgForOf,
  NgForOfContext,
  NgIf,
  NgIfContext,
  NgLocaleLocalization,
  NgLocalization,
  NgOptimizedImage,
  NgPlural,
  NgPluralCase,
  NgStyle,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
  NgTemplateOutlet,
  NullViewportScroller,
  NumberFormatStyle,
  NumberSymbol,
  PRECONNECT_CHECK_BLOCKLIST,
  PathLocationStrategy,
  PercentPipe,
  PlatformLocation,
  PlatformNavigation,
  Plural,
  SlicePipe,
  TitleCasePipe,
  TranslationWidth,
  UpperCasePipe,
  VERSION,
  ViewportScroller,
  WeekDay,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  getCurrencySymbol,
  getDOM,
  getLocaleCurrencyCode,
  getLocaleCurrencyName,
  getLocaleCurrencySymbol,
  getLocaleDateFormat,
  getLocaleDateTimeFormat,
  getLocaleDayNames,
  getLocaleDayPeriods,
  getLocaleDirection,
  getLocaleEraNames,
  getLocaleExtraDayPeriodRules,
  getLocaleExtraDayPeriods,
  getLocaleFirstDayOfWeek,
  getLocaleId,
  getLocaleMonthNames,
  getLocaleNumberFormat,
  getLocaleNumberSymbol,
  getLocalePluralCase,
  getLocaleTimeFormat,
  getLocaleWeekEndRange,
  getNumberOfCurrencyDigits,
  normalizeQueryParams,
  provideCloudflareLoader,
  provideCloudinaryLoader,
  provideImageKitLoader,
  provideImgixLoader,
  provideNetlifyLoader,
  registerLocaleData,
  setRootDomAdapter
} from "./chunk-E2IFQTEF.js";
import {
  DOCUMENT,
  PLATFORM_BROWSER_ID,
  PLATFORM_SERVER_ID,
  XhrFactory,
  isPlatformBrowser,
  isPlatformServer,
  parseCookieValue
} from "./chunk-KJ2FTQNQ.js";
import {
  IMAGE_CONFIG
} from "./chunk-EP22WXWE.js";
import "./chunk-6Q4RANH6.js";
import "./chunk-FFZIAYYX.js";
import "./chunk-CXCX2JKZ.js";
export {
  APP_BASE_HREF,
  AsyncPipe,
  BrowserPlatformLocation,
  CommonModule,
  CurrencyPipe,
  DATE_PIPE_DEFAULT_OPTIONS,
  DATE_PIPE_DEFAULT_TIMEZONE,
  DOCUMENT,
  DatePipe,
  DecimalPipe,
  FormStyle,
  FormatWidth,
  HashLocationStrategy,
  I18nPluralPipe,
  I18nSelectPipe,
  IMAGE_CONFIG,
  IMAGE_LOADER,
  JsonPipe,
  KeyValuePipe,
  LOCATION_INITIALIZED,
  Location,
  LocationStrategy,
  LowerCasePipe,
  NgClass,
  NgComponentOutlet,
  NgForOf as NgFor,
  NgForOf,
  NgForOfContext,
  NgIf,
  NgIfContext,
  NgLocaleLocalization,
  NgLocalization,
  NgOptimizedImage,
  NgPlural,
  NgPluralCase,
  NgStyle,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
  NgTemplateOutlet,
  NumberFormatStyle,
  NumberSymbol,
  PRECONNECT_CHECK_BLOCKLIST,
  PathLocationStrategy,
  PercentPipe,
  PlatformLocation,
  Plural,
  SlicePipe,
  TitleCasePipe,
  TranslationWidth,
  UpperCasePipe,
  VERSION,
  ViewportScroller,
  WeekDay,
  XhrFactory,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  getCurrencySymbol,
  getLocaleCurrencyCode,
  getLocaleCurrencyName,
  getLocaleCurrencySymbol,
  getLocaleDateFormat,
  getLocaleDateTimeFormat,
  getLocaleDayNames,
  getLocaleDayPeriods,
  getLocaleDirection,
  getLocaleEraNames,
  getLocaleExtraDayPeriodRules,
  getLocaleExtraDayPeriods,
  getLocaleFirstDayOfWeek,
  getLocaleId,
  getLocaleMonthNames,
  getLocaleNumberFormat,
  getLocaleNumberSymbol,
  getLocalePluralCase,
  getLocaleTimeFormat,
  getLocaleWeekEndRange,
  getNumberOfCurrencyDigits,
  isPlatformBrowser,
  isPlatformServer,
  provideCloudflareLoader,
  provideCloudinaryLoader,
  provideImageKitLoader,
  provideImgixLoader,
  provideNetlifyLoader,
  registerLocaleData,
  DomAdapter as ɵDomAdapter,
  NullViewportScroller as ɵNullViewportScroller,
  PLATFORM_BROWSER_ID as ɵPLATFORM_BROWSER_ID,
  PLATFORM_SERVER_ID as ɵPLATFORM_SERVER_ID,
  PlatformNavigation as ɵPlatformNavigation,
  getDOM as ɵgetDOM,
  normalizeQueryParams as ɵnormalizeQueryParams,
  parseCookieValue as ɵparseCookieValue,
  setRootDomAdapter as ɵsetRootDomAdapter
};

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/chunk-FFZIAYYX.js
```typescript
import {
  AsyncAction,
  AsyncScheduler,
  AsyncSubject,
  EMPTY,
  EmptyError,
  Observable,
  SafeSubscriber,
  Subject,
  Subscription,
  __extends,
  __generator,
  __read,
  __spreadArray,
  argsArgArrayOrObject,
  createObject,
  createOperatorSubscriber,
  filter,
  from,
  identity,
  innerFrom,
  isArrayLike,
  isFunction,
  isScheduler,
  mapOneOrManyArgs,
  mergeAll,
  mergeMap,
  noop,
  not,
  observeOn,
  popNumber,
  popResultSelector,
  popScheduler,
  scheduleIterable,
  subscribeOn
} from "./chunk-CXCX2JKZ.js";

// node_modules/rxjs/dist/esm5/internal/scheduler/performanceTimestampProvider.js
var performanceTimestampProvider = {
  now: function() {
    return (performanceTimestampProvider.delegate || performance).now();
  },
  delegate: void 0
};

// node_modules/rxjs/dist/esm5/internal/scheduler/animationFrameProvider.js
var animationFrameProvider = {
  schedule: function(callback) {
    var request = requestAnimationFrame;
    var cancel = cancelAnimationFrame;
    var delegate = animationFrameProvider.delegate;
    if (delegate) {
      request = delegate.requestAnimationFrame;
      cancel = delegate.cancelAnimationFrame;
    }
    var handle = request(function(timestamp2) {
      cancel = void 0;
      callback(timestamp2);
    });
    return new Subscription(function() {
      return cancel === null || cancel === void 0 ? void 0 : cancel(handle);
    });
  },
  requestAnimationFrame: function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var delegate = animationFrameProvider.delegate;
    return ((delegate === null || delegate === void 0 ? void 0 : delegate.requestAnimationFrame) || requestAnimationFrame).apply(void 0, __spreadArray([], __read(args)));
  },
  cancelAnimationFrame: function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var delegate = animationFrameProvider.delegate;
    return ((delegate === null || delegate === void 0 ? void 0 : delegate.cancelAnimationFrame) || cancelAnimationFrame).apply(void 0, __spreadArray([], __read(args)));
  },
  delegate: void 0
};

// node_modules/rxjs/dist/esm5/internal/observable/dom/animationFrames.js
function animationFrames(timestampProvider) {
  return timestampProvider ? animationFramesFactory(timestampProvider) : DEFAULT_ANIMATION_FRAMES;
}
function animationFramesFactory(timestampProvider) {
  return new Observable(function(subscriber) {
    var provider = timestampProvider || performanceTimestampProvider;
    var start = provider.now();
    var id = 0;
    var run = function() {
      if (!subscriber.closed) {
        id = animationFrameProvider.requestAnimationFrame(function(timestamp2) {
          id = 0;
          var now = provider.now();
          subscriber.next({
            timestamp: timestampProvider ? now : timestamp2,
            elapsed: now - start
          });
          run();
        });
      }
    };
    run();
    return function() {
      if (id) {
        animationFrameProvider.cancelAnimationFrame(id);
      }
    };
  });
}
var DEFAULT_ANIMATION_FRAMES = animationFramesFactory();

// node_modules/rxjs/dist/esm5/internal/util/Immediate.js
var nextHandle = 1;
var resolved;
var activeHandles = {};
function findAndClearHandle(handle) {
  if (handle in activeHandles) {
    delete activeHandles[handle];
    return true;
  }
  return false;
}
var Immediate = {
  setImmediate: function(cb) {
    var handle = nextHandle++;
    activeHandles[handle] = true;
    if (!resolved) {
      resolved = Promise.resolve();
    }
    resolved.then(function() {
      return findAndClearHandle(handle) && cb();
    });
    return handle;
  },
  clearImmediate: function(handle) {
    findAndClearHandle(handle);
  }
};

// node_modules/rxjs/dist/esm5/internal/scheduler/immediateProvider.js
var setImmediate = Immediate.setImmediate;
var clearImmediate = Immediate.clearImmediate;
var immediateProvider = {
  setImmediate: function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var delegate = immediateProvider.delegate;
    return ((delegate === null || delegate === void 0 ? void 0 : delegate.setImmediate) || setImmediate).apply(void 0, __spreadArray([], __read(args)));
  },
  clearImmediate: function(handle) {
    var delegate = immediateProvider.delegate;
    return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearImmediate) || clearImmediate)(handle);
  },
  delegate: void 0
};

// node_modules/rxjs/dist/esm5/internal/scheduler/AsapAction.js
var AsapAction = function(_super) {
  __extends(AsapAction2, _super);
  function AsapAction2(scheduler, work) {
    var _this = _super.call(this, scheduler, work) || this;
    _this.scheduler = scheduler;
    _this.work = work;
    return _this;
  }
  AsapAction2.prototype.requestAsyncId = function(scheduler, id, delay2) {
    if (delay2 === void 0) {
      delay2 = 0;
    }
    if (delay2 !== null && delay2 > 0) {
      return _super.prototype.requestAsyncId.call(this, scheduler, id, delay2);
    }
    scheduler.actions.push(this);
    return scheduler._scheduled || (scheduler._scheduled = immediateProvider.setImmediate(scheduler.flush.bind(scheduler, void 0)));
  };
  AsapAction2.prototype.recycleAsyncId = function(scheduler, id, delay2) {
    var _a;
    if (delay2 === void 0) {
      delay2 = 0;
    }
    if (delay2 != null ? delay2 > 0 : this.delay > 0) {
      return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay2);
    }
    var actions = scheduler.actions;
    if (id != null && ((_a = actions[actions.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== id) {
      immediateProvider.clearImmediate(id);
      if (scheduler._scheduled === id) {
        scheduler._scheduled = void 0;
      }
    }
    return void 0;
  };
  return AsapAction2;
}(AsyncAction);

// node_modules/rxjs/dist/esm5/internal/scheduler/AsapScheduler.js
var AsapScheduler = function(_super) {
  __extends(AsapScheduler2, _super);
  function AsapScheduler2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  AsapScheduler2.prototype.flush = function(action) {
    this._active = true;
    var flushId = this._scheduled;
    this._scheduled = void 0;
    var actions = this.actions;
    var error;
    action = action || actions.shift();
    do {
      if (error = action.execute(action.state, action.delay)) {
        break;
      }
    } while ((action = actions[0]) && action.id === flushId && actions.shift());
    this._active = false;
    if (error) {
      while ((action = actions[0]) && action.id === flushId && actions.shift()) {
        action.unsubscribe();
      }
      throw error;
    }
  };
  return AsapScheduler2;
}(AsyncScheduler);

// node_modules/rxjs/dist/esm5/internal/scheduler/asap.js
var asapScheduler = new AsapScheduler(AsapAction);
var asap = asapScheduler;

// node_modules/rxjs/dist/esm5/internal/scheduler/QueueAction.js
var QueueAction = function(_super) {
  __extends(QueueAction2, _super);
  function QueueAction2(scheduler, work) {
    var _this = _super.call(this, scheduler, work) || this;
    _this.scheduler = scheduler;
    _this.work = work;
    return _this;
  }
  QueueAction2.prototype.schedule = function(state, delay2) {
    if (delay2 === void 0) {
      delay2 = 0;
    }
    if (delay2 > 0) {
      return _super.prototype.schedule.call(this, state, delay2);
    }
    this.delay = delay2;
    this.state = state;
    this.scheduler.flush(this);
    return this;
  };
  QueueAction2.prototype.execute = function(state, delay2) {
    return delay2 > 0 || this.closed ? _super.prototype.execute.call(this, state, delay2) : this._execute(state, delay2);
  };
  QueueAction2.prototype.requestAsyncId = function(scheduler, id, delay2) {
    if (delay2 === void 0) {
      delay2 = 0;
    }
    if (delay2 != null && delay2 > 0 || delay2 == null && this.delay > 0) {
      return _super.prototype.requestAsyncId.call(this, scheduler, id, delay2);
    }
    scheduler.flush(this);
    return 0;
  };
  return QueueAction2;
}(AsyncAction);

// node_modules/rxjs/dist/esm5/internal/scheduler/QueueScheduler.js
var QueueScheduler = function(_super) {
  __extends(QueueScheduler2, _super);
  function QueueScheduler2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return QueueScheduler2;
}(AsyncScheduler);

// node_modules/rxjs/dist/esm5/internal/scheduler/queue.js
var queueScheduler = new QueueScheduler(QueueAction);
var queue = queueScheduler;

// node_modules/rxjs/dist/esm5/internal/scheduler/AnimationFrameAction.js
var AnimationFrameAction = function(_super) {
  __extends(AnimationFrameAction2, _super);
  function AnimationFrameAction2(scheduler, work) {
    var _this = _super.call(this, scheduler, work) || this;
    _this.scheduler = scheduler;
    _this.work = work;
    return _this;
  }
  AnimationFrameAction2.prototype.requestAsyncId = function(scheduler, id, delay2) {
    if (delay2 === void 0) {
      delay2 = 0;
    }
    if (delay2 !== null && delay2 > 0) {
      return _super.prototype.requestAsyncId.call(this, scheduler, id, delay2);
    }
    scheduler.actions.push(this);
    return scheduler._scheduled || (scheduler._scheduled = animationFrameProvider.requestAnimationFrame(function() {
      return scheduler.flush(void 0);
    }));
  };
  AnimationFrameAction2.prototype.recycleAsyncId = function(scheduler, id, delay2) {
    var _a;
    if (delay2 === void 0) {
      delay2 = 0;
    }
    if (delay2 != null ? delay2 > 0 : this.delay > 0) {
      return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay2);
    }
    var actions = scheduler.actions;
    if (id != null && id === scheduler._scheduled && ((_a = actions[actions.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== id) {
      animationFrameProvider.cancelAnimationFrame(id);
      scheduler._scheduled = void 0;
    }
    return void 0;
  };
  return AnimationFrameAction2;
}(AsyncAction);

// node_modules/rxjs/dist/esm5/internal/scheduler/AnimationFrameScheduler.js
var AnimationFrameScheduler = function(_super) {
  __extends(AnimationFrameScheduler2, _super);
  function AnimationFrameScheduler2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  AnimationFrameScheduler2.prototype.flush = function(action) {
    this._active = true;
    var flushId;
    if (action) {
      flushId = action.id;
    } else {
      flushId = this._scheduled;
      this._scheduled = void 0;
    }
    var actions = this.actions;
    var error;
    action = action || actions.shift();
    do {
      if (error = action.execute(action.state, action.delay)) {
        break;
      }
    } while ((action = actions[0]) && action.id === flushId && actions.shift());
    this._active = false;
    if (error) {
      while ((action = actions[0]) && action.id === flushId && actions.shift()) {
        action.unsubscribe();
      }
      throw error;
    }
  };
  return AnimationFrameScheduler2;
}(AsyncScheduler);

// node_modules/rxjs/dist/esm5/internal/scheduler/animationFrame.js
var animationFrameScheduler = new AnimationFrameScheduler(AnimationFrameAction);
var animationFrame = animationFrameScheduler;

// node_modules/rxjs/dist/esm5/internal/scheduler/VirtualTimeScheduler.js
var VirtualTimeScheduler = function(_super) {
  __extends(VirtualTimeScheduler2, _super);
  function VirtualTimeScheduler2(schedulerActionCtor, maxFrames) {
    if (schedulerActionCtor === void 0) {
      schedulerActionCtor = VirtualAction;
    }
    if (maxFrames === void 0) {
      maxFrames = Infinity;
    }
    var _this = _super.call(this, schedulerActionCtor, function() {
      return _this.frame;
    }) || this;
    _this.maxFrames = maxFrames;
    _this.frame = 0;
    _this.index = -1;
    return _this;
  }
  VirtualTimeScheduler2.prototype.flush = function() {
    var _a = this, actions = _a.actions, maxFrames = _a.maxFrames;
    var error;
    var action;
    while ((action = actions[0]) && action.delay <= maxFrames) {
      actions.shift();
      this.frame = action.delay;
      if (error = action.execute(action.state, action.delay)) {
        break;
      }
    }
    if (error) {
      while (action = actions.shift()) {
        action.unsubscribe();
      }
      throw error;
    }
  };
  VirtualTimeScheduler2.frameTimeFactor = 10;
  return VirtualTimeScheduler2;
}(AsyncScheduler);
var VirtualAction = function(_super) {
  __extends(VirtualAction2, _super);
  function VirtualAction2(scheduler, work, index) {
    if (index === void 0) {
      index = scheduler.index += 1;
    }
    var _this = _super.call(this, scheduler, work) || this;
    _this.scheduler = scheduler;
    _this.work = work;
    _this.index = index;
    _this.active = true;
    _this.index = scheduler.index = index;
    return _this;
  }
  VirtualAction2.prototype.schedule = function(state, delay2) {
    if (delay2 === void 0) {
      delay2 = 0;
    }
    if (Number.isFinite(delay2)) {
      if (!this.id) {
        return _super.prototype.schedule.call(this, state, delay2);
      }
      this.active = false;
      var action = new VirtualAction2(this.scheduler, this.work);
      this.add(action);
      return action.schedule(state, delay2);
    } else {
      return Subscription.EMPTY;
    }
  };
  VirtualAction2.prototype.requestAsyncId = function(scheduler, id, delay2) {
    if (delay2 === void 0) {
      delay2 = 0;
    }
    this.delay = scheduler.frame + delay2;
    var actions = scheduler.actions;
    actions.push(this);
    actions.sort(VirtualAction2.sortActions);
    return 1;
  };
  VirtualAction2.prototype.recycleAsyncId = function(scheduler, id, delay2) {
    if (delay2 === void 0) {
      delay2 = 0;
    }
    return void 0;
  };
  VirtualAction2.prototype._execute = function(state, delay2) {
    if (this.active === true) {
      return _super.prototype._execute.call(this, state, delay2);
    }
  };
  VirtualAction2.sortActions = function(a, b) {
    if (a.delay === b.delay) {
      if (a.index === b.index) {
        return 0;
      } else if (a.index > b.index) {
        return 1;
      } else {
        return -1;
      }
    } else if (a.delay > b.delay) {
      return 1;
    } else {
      return -1;
    }
  };
  return VirtualAction2;
}(AsyncAction);

// node_modules/rxjs/dist/esm5/internal/util/isObservable.js
function isObservable(obj) {
  return !!obj && (obj instanceof Observable || isFunction(obj.lift) && isFunction(obj.subscribe));
}

// node_modules/rxjs/dist/esm5/internal/lastValueFrom.js
function lastValueFrom(source, config2) {
  var hasConfig = typeof config2 === "object";
  return new Promise(function(resolve, reject) {
    var _hasValue = false;
    var _value;
    source.subscribe({
      next: function(value) {
        _value = value;
        _hasValue = true;
      },
      error: reject,
      complete: function() {
        if (_hasValue) {
          resolve(_value);
        } else if (hasConfig) {
          resolve(config2.defaultValue);
        } else {
          reject(new EmptyError());
        }
      }
    });
  });
}

// node_modules/rxjs/dist/esm5/internal/firstValueFrom.js
function firstValueFrom(source, config2) {
  var hasConfig = typeof config2 === "object";
  return new Promise(function(resolve, reject) {
    var subscriber = new SafeSubscriber({
      next: function(value) {
        resolve(value);
        subscriber.unsubscribe();
      },
      error: reject,
      complete: function() {
        if (hasConfig) {
          resolve(config2.defaultValue);
        } else {
          reject(new EmptyError());
        }
      }
    });
    source.subscribe(subscriber);
  });
}

// node_modules/rxjs/dist/esm5/internal/observable/bindCallbackInternals.js
function bindCallbackInternals(isNodeStyle, callbackFunc, resultSelector, scheduler) {
  if (resultSelector) {
    if (isScheduler(resultSelector)) {
      scheduler = resultSelector;
    } else {
      return function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        return bindCallbackInternals(isNodeStyle, callbackFunc, scheduler).apply(this, args).pipe(mapOneOrManyArgs(resultSelector));
      };
    }
  }
  if (scheduler) {
    return function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return bindCallbackInternals(isNodeStyle, callbackFunc).apply(this, args).pipe(subscribeOn(scheduler), observeOn(scheduler));
    };
  }
  return function() {
    var _this = this;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var subject = new AsyncSubject();
    var uninitialized = true;
    return new Observable(function(subscriber) {
      var subs = subject.subscribe(subscriber);
      if (uninitialized) {
        uninitialized = false;
        var isAsync_1 = false;
        var isComplete_1 = false;
        callbackFunc.apply(_this, __spreadArray(__spreadArray([], __read(args)), [function() {
          var results = [];
          for (var _i2 = 0; _i2 < arguments.length; _i2++) {
            results[_i2] = arguments[_i2];
          }
          if (isNodeStyle) {
            var err = results.shift();
            if (err != null) {
              subject.error(err);
              return;
            }
          }
          subject.next(1 < results.length ? results : results[0]);
          isComplete_1 = true;
          if (isAsync_1) {
            subject.complete();
          }
        }]));
        if (isComplete_1) {
          subject.complete();
        }
        isAsync_1 = true;
      }
      return subs;
    });
  };
}

// node_modules/rxjs/dist/esm5/internal/observable/bindCallback.js
function bindCallback(callbackFunc, resultSelector, scheduler) {
  return bindCallbackInternals(false, callbackFunc, resultSelector, scheduler);
}

// node_modules/rxjs/dist/esm5/internal/observable/bindNodeCallback.js
function bindNodeCallback(callbackFunc, resultSelector, scheduler) {
  return bindCallbackInternals(true, callbackFunc, resultSelector, scheduler);
}

// node_modules/rxjs/dist/esm5/internal/observable/defer.js
function defer(observableFactory) {
  return new Observable(function(subscriber) {
    innerFrom(observableFactory()).subscribe(subscriber);
  });
}

// node_modules/rxjs/dist/esm5/internal/observable/connectable.js
var DEFAULT_CONFIG = {
  connector: function() {
    return new Subject();
  },
  resetOnDisconnect: true
};
function connectable(source, config2) {
  if (config2 === void 0) {
    config2 = DEFAULT_CONFIG;
  }
  var connection = null;
  var connector = config2.connector, _a = config2.resetOnDisconnect, resetOnDisconnect = _a === void 0 ? true : _a;
  var subject = connector();
  var result = new Observable(function(subscriber) {
    return subject.subscribe(subscriber);
  });
  result.connect = function() {
    if (!connection || connection.closed) {
      connection = defer(function() {
        return source;
      }).subscribe(subject);
      if (resetOnDisconnect) {
        connection.add(function() {
          return subject = connector();
        });
      }
    }
    return connection;
  };
  return result;
}

// node_modules/rxjs/dist/esm5/internal/observable/forkJoin.js
function forkJoin() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  var resultSelector = popResultSelector(args);
  var _a = argsArgArrayOrObject(args), sources = _a.args, keys = _a.keys;
  var result = new Observable(function(subscriber) {
    var length = sources.length;
    if (!length) {
      subscriber.complete();
      return;
    }
    var values = new Array(length);
    var remainingCompletions = length;
    var remainingEmissions = length;
    var _loop_1 = function(sourceIndex2) {
      var hasValue = false;
      innerFrom(sources[sourceIndex2]).subscribe(createOperatorSubscriber(subscriber, function(value) {
        if (!hasValue) {
          hasValue = true;
          remainingEmissions--;
        }
        values[sourceIndex2] = value;
      }, function() {
        return remainingCompletions--;
      }, void 0, function() {
        if (!remainingCompletions || !hasValue) {
          if (!remainingEmissions) {
            subscriber.next(keys ? createObject(keys, values) : values);
          }
          subscriber.complete();
        }
      }));
    };
    for (var sourceIndex = 0; sourceIndex < length; sourceIndex++) {
      _loop_1(sourceIndex);
    }
  });
  return resultSelector ? result.pipe(mapOneOrManyArgs(resultSelector)) : result;
}

// node_modules/rxjs/dist/esm5/internal/observable/fromEvent.js
var nodeEventEmitterMethods = ["addListener", "removeListener"];
var eventTargetMethods = ["addEventListener", "removeEventListener"];
var jqueryMethods = ["on", "off"];
function fromEvent(target, eventName, options, resultSelector) {
  if (isFunction(options)) {
    resultSelector = options;
    options = void 0;
  }
  if (resultSelector) {
    return fromEvent(target, eventName, options).pipe(mapOneOrManyArgs(resultSelector));
  }
  var _a = __read(isEventTarget(target) ? eventTargetMethods.map(function(methodName) {
    return function(handler) {
      return target[methodName](eventName, handler, options);
    };
  }) : isNodeStyleEventEmitter(target) ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName)) : isJQueryStyleEventEmitter(target) ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName)) : [], 2), add = _a[0], remove = _a[1];
  if (!add) {
    if (isArrayLike(target)) {
      return mergeMap(function(subTarget) {
        return fromEvent(subTarget, eventName, options);
      })(innerFrom(target));
    }
  }
  if (!add) {
    throw new TypeError("Invalid event target");
  }
  return new Observable(function(subscriber) {
    var handler = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return subscriber.next(1 < args.length ? args : args[0]);
    };
    add(handler);
    return function() {
      return remove(handler);
    };
  });
}
function toCommonHandlerRegistry(target, eventName) {
  return function(methodName) {
    return function(handler) {
      return target[methodName](eventName, handler);
    };
  };
}
function isNodeStyleEventEmitter(target) {
  return isFunction(target.addListener) && isFunction(target.removeListener);
}
function isJQueryStyleEventEmitter(target) {
  return isFunction(target.on) && isFunction(target.off);
}
function isEventTarget(target) {
  return isFunction(target.addEventListener) && isFunction(target.removeEventListener);
}

// node_modules/rxjs/dist/esm5/internal/observable/fromEventPattern.js
function fromEventPattern(addHandler, removeHandler, resultSelector) {
  if (resultSelector) {
    return fromEventPattern(addHandler, removeHandler).pipe(mapOneOrManyArgs(resultSelector));
  }
  return new Observable(function(subscriber) {
    var handler = function() {
      var e = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        e[_i] = arguments[_i];
      }
      return subscriber.next(e.length === 1 ? e[0] : e);
    };
    var retValue = addHandler(handler);
    return isFunction(removeHandler) ? function() {
      return removeHandler(handler, retValue);
    } : void 0;
  });
}

// node_modules/rxjs/dist/esm5/internal/observable/generate.js
function generate(initialStateOrOptions, condition, iterate, resultSelectorOrScheduler, scheduler) {
  var _a, _b;
  var resultSelector;
  var initialState;
  if (arguments.length === 1) {
    _a = initialStateOrOptions, initialState = _a.initialState, condition = _a.condition, iterate = _a.iterate, _b = _a.resultSelector, resultSelector = _b === void 0 ? identity : _b, scheduler = _a.scheduler;
  } else {
    initialState = initialStateOrOptions;
    if (!resultSelectorOrScheduler || isScheduler(resultSelectorOrScheduler)) {
      resultSelector = identity;
      scheduler = resultSelectorOrScheduler;
    } else {
      resultSelector = resultSelectorOrScheduler;
    }
  }
  function gen() {
    var state;
    return __generator(this, function(_a2) {
      switch (_a2.label) {
        case 0:
          state = initialState;
          _a2.label = 1;
        case 1:
          if (!(!condition || condition(state))) return [3, 4];
          return [4, resultSelector(state)];
        case 2:
          _a2.sent();
          _a2.label = 3;
        case 3:
          state = iterate(state);
          return [3, 1];
        case 4:
          return [2];
      }
    });
  }
  return defer(scheduler ? function() {
    return scheduleIterable(gen(), scheduler);
  } : gen);
}

// node_modules/rxjs/dist/esm5/internal/observable/iif.js
function iif(condition, trueResult, falseResult) {
  return defer(function() {
    return condition() ? trueResult : falseResult;
  });
}

// node_modules/rxjs/dist/esm5/internal/observable/merge.js
function merge() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  var scheduler = popScheduler(args);
  var concurrent = popNumber(args, Infinity);
  var sources = args;
  return !sources.length ? EMPTY : sources.length === 1 ? innerFrom(sources[0]) : mergeAll(concurrent)(from(sources, scheduler));
}

// node_modules/rxjs/dist/esm5/internal/observable/never.js
var NEVER = new Observable(noop);
function never() {
  return NEVER;
}

// node_modules/rxjs/dist/esm5/internal/observable/pairs.js
function pairs(obj, scheduler) {
  return from(Object.entries(obj), scheduler);
}

// node_modules/rxjs/dist/esm5/internal/observable/partition.js
function partition(source, predicate, thisArg) {
  return [filter(predicate, thisArg)(innerFrom(source)), filter(not(predicate, thisArg))(innerFrom(source))];
}

// node_modules/rxjs/dist/esm5/internal/observable/range.js
function range(start, count2, scheduler) {
  if (count2 == null) {
    count2 = start;
    start = 0;
  }
  if (count2 <= 0) {
    return EMPTY;
  }
  var end = count2 + start;
  return new Observable(scheduler ? function(subscriber) {
    var n = start;
    return scheduler.schedule(function() {
      if (n < end) {
        subscriber.next(n++);
        this.schedule();
      } else {
        subscriber.complete();
      }
    });
  } : function(subscriber) {
    var n = start;
    while (n < end && !subscriber.closed) {
      subscriber.next(n++);
    }
    subscriber.complete();
  });
}

// node_modules/rxjs/dist/esm5/internal/observable/using.js
function using(resourceFactory, observableFactory) {
  return new Observable(function(subscriber) {
    var resource = resourceFactory();
    var result = observableFactory(resource);
    var source = result ? innerFrom(result) : EMPTY;
    source.subscribe(subscriber);
    return function() {
      if (resource) {
        resource.unsubscribe();
      }
    };
  });
}

export {
  animationFrames,
  asapScheduler,
  asap,
  queueScheduler,
  queue,
  animationFrameScheduler,
  animationFrame,
  VirtualTimeScheduler,
  VirtualAction,
  isObservable,
  lastValueFrom,
  firstValueFrom,
  bindCallback,
  bindNodeCallback,
  defer,
  connectable,
  forkJoin,
  fromEvent,
  fromEventPattern,
  generate,
  iif,
  merge,
  NEVER,
  never,
  pairs,
  partition,
  range,
  using
};
//# sourceMappingURL=chunk-FFZIAYYX.js.map

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/@angular_forms.js (SKIPPED - TOO LARGE > 100KB)

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/rxjs_operators.js
```typescript
import {
  partition,
  race
} from "./chunk-6Q4RANH6.js";
import {
  audit,
  auditTime,
  buffer,
  bufferCount,
  bufferTime,
  bufferToggle,
  bufferWhen,
  catchError,
  combineAll,
  combineLatest2 as combineLatest,
  combineLatestAll,
  combineLatestWith,
  concat2 as concat,
  concatAll,
  concatMap,
  concatMapTo,
  concatWith,
  connect,
  count,
  debounce,
  debounceTime,
  defaultIfEmpty,
  delay,
  delayWhen,
  dematerialize,
  distinct,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  elementAt,
  endWith,
  every,
  exhaust,
  exhaustAll,
  exhaustMap,
  expand,
  filter,
  finalize,
  find,
  findIndex,
  first,
  flatMap,
  groupBy,
  ignoreElements,
  isEmpty,
  last,
  map,
  mapTo,
  materialize,
  max,
  merge,
  mergeAll,
  mergeMap,
  mergeMapTo,
  mergeScan,
  mergeWith,
  min,
  multicast,
  observeOn,
  onErrorResumeNext2 as onErrorResumeNext,
  pairwise,
  pluck,
  publish,
  publishBehavior,
  publishLast,
  publishReplay,
  raceWith,
  reduce,
  refCount,
  repeat,
  repeatWhen,
  retry,
  retryWhen,
  sample,
  sampleTime,
  scan,
  sequenceEqual,
  share,
  shareReplay,
  single,
  skip,
  skipLast,
  skipUntil,
  skipWhile,
  startWith,
  subscribeOn,
  switchAll,
  switchMap,
  switchMapTo,
  switchScan,
  take,
  takeLast,
  takeUntil,
  takeWhile,
  tap,
  throttle,
  throttleTime,
  throwIfEmpty,
  timeInterval,
  timeout,
  timeoutWith,
  timestamp,
  toArray,
  window,
  windowCount,
  windowTime,
  windowToggle,
  windowWhen,
  withLatestFrom,
  zip2 as zip,
  zipAll,
  zipWith
} from "./chunk-CXCX2JKZ.js";
export {
  audit,
  auditTime,
  buffer,
  bufferCount,
  bufferTime,
  bufferToggle,
  bufferWhen,
  catchError,
  combineAll,
  combineLatest,
  combineLatestAll,
  combineLatestWith,
  concat,
  concatAll,
  concatMap,
  concatMapTo,
  concatWith,
  connect,
  count,
  debounce,
  debounceTime,
  defaultIfEmpty,
  delay,
  delayWhen,
  dematerialize,
  distinct,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  elementAt,
  endWith,
  every,
  exhaust,
  exhaustAll,
  exhaustMap,
  expand,
  filter,
  finalize,
  find,
  findIndex,
  first,
  flatMap,
  groupBy,
  ignoreElements,
  isEmpty,
  last,
  map,
  mapTo,
  materialize,
  max,
  merge,
  mergeAll,
  mergeMap,
  mergeMapTo,
  mergeScan,
  mergeWith,
  min,
  multicast,
  observeOn,
  onErrorResumeNext,
  pairwise,
  partition,
  pluck,
  publish,
  publishBehavior,
  publishLast,
  publishReplay,
  race,
  raceWith,
  reduce,
  refCount,
  repeat,
  repeatWhen,
  retry,
  retryWhen,
  sample,
  sampleTime,
  scan,
  sequenceEqual,
  share,
  shareReplay,
  single,
  skip,
  skipLast,
  skipUntil,
  skipWhile,
  startWith,
  subscribeOn,
  switchAll,
  switchMap,
  switchMapTo,
  switchScan,
  take,
  takeLast,
  takeUntil,
  takeWhile,
  tap,
  throttle,
  throttleTime,
  throwIfEmpty,
  timeInterval,
  timeout,
  timeoutWith,
  timestamp,
  toArray,
  window,
  windowCount,
  windowTime,
  windowToggle,
  windowWhen,
  withLatestFrom,
  zip,
  zipAll,
  zipWith
};

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/chunk-EP22WXWE.js (SKIPPED - TOO LARGE > 100KB)

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/@angular_router.js (SKIPPED - TOO LARGE > 100KB)

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/chunk-E2IFQTEF.js (SKIPPED - TOO LARGE > 100KB)

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/chunk-WMQUX6DB.js
```typescript
import {
  withHttpTransferCache
} from "./chunk-257AE5XC.js";
import {
  CommonModule,
  DomAdapter,
  getDOM,
  setRootDomAdapter
} from "./chunk-E2IFQTEF.js";
import {
  DOCUMENT,
  PLATFORM_BROWSER_ID,
  XhrFactory,
  isPlatformServer,
  parseCookieValue
} from "./chunk-KJ2FTQNQ.js";
import {
  APP_ID,
  ApplicationModule,
  ApplicationRef,
  CSP_NONCE,
  Console,
  ENVIRONMENT_INITIALIZER,
  ErrorHandler,
  INJECTOR_SCOPE,
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  NgModule,
  NgZone,
  Optional,
  PLATFORM_ID,
  PLATFORM_INITIALIZER,
  RendererFactory2,
  RendererStyleFlags2,
  RuntimeError,
  SecurityContext,
  TESTABILITY,
  TESTABILITY_GETTER,
  Testability,
  TestabilityRegistry,
  TracingService,
  Version,
  ViewEncapsulation,
  XSS_SECURITY_URL,
  ZONELESS_ENABLED,
  _global,
  _sanitizeHtml,
  _sanitizeUrl,
  allowSanitizationBypassAndThrow,
  bypassSanitizationTrustHtml,
  bypassSanitizationTrustResourceUrl,
  bypassSanitizationTrustScript,
  bypassSanitizationTrustStyle,
  bypassSanitizationTrustUrl,
  createPlatformFactory,
  formatRuntimeError,
  forwardRef,
  inject,
  internalCreateApplication,
  makeEnvironmentProviders,
  platformCore,
  setClassMetadata,
  setDocument,
  unwrapSafeValue,
  withDomHydration,
  withEventReplay,
  withI18nSupport,
  withIncrementalHydration,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵinject
} from "./chunk-EP22WXWE.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-CXCX2JKZ.js";

// node_modules/@angular/platform-browser/fesm2022/dom_renderer-DGKzginR.mjs
var EVENT_MANAGER_PLUGINS = new InjectionToken(ngDevMode ? "EventManagerPlugins" : "");
var EventManager = class _EventManager {
  _zone;
  _plugins;
  _eventNameToPlugin = /* @__PURE__ */ new Map();
  /**
   * Initializes an instance of the event-manager service.
   */
  constructor(plugins, _zone) {
    this._zone = _zone;
    plugins.forEach((plugin) => {
      plugin.manager = this;
    });
    this._plugins = plugins.slice().reverse();
  }
  /**
   * Registers a handler for a specific element and event.
   *
   * @param element The HTML element to receive event notifications.
   * @param eventName The name of the event to listen for.
   * @param handler A function to call when the notification occurs. Receives the
   * event object as an argument.
   * @param options Options that configure how the event listener is bound.
   * @returns  A callback function that can be used to remove the handler.
   */
  addEventListener(element, eventName, handler, options) {
    const plugin = this._findPluginFor(eventName);
    return plugin.addEventListener(element, eventName, handler, options);
  }
  /**
   * Retrieves the compilation zone in which event listeners are registered.
   */
  getZone() {
    return this._zone;
  }
  /** @internal */
  _findPluginFor(eventName) {
    let plugin = this._eventNameToPlugin.get(eventName);
    if (plugin) {
      return plugin;
    }
    const plugins = this._plugins;
    plugin = plugins.find((plugin2) => plugin2.supports(eventName));
    if (!plugin) {
      throw new RuntimeError(5101, (typeof ngDevMode === "undefined" || ngDevMode) && `No event manager plugin found for event ${eventName}`);
    }
    this._eventNameToPlugin.set(eventName, plugin);
    return plugin;
  }
  static ɵfac = function EventManager_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EventManager)(ɵɵinject(EVENT_MANAGER_PLUGINS), ɵɵinject(NgZone));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _EventManager,
    factory: _EventManager.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(EventManager, [{
    type: Injectable
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [EVENT_MANAGER_PLUGINS]
    }]
  }, {
    type: NgZone
  }], null);
})();
var EventManagerPlugin = class {
  _doc;
  // TODO: remove (has some usage in G3)
  constructor(_doc) {
    this._doc = _doc;
  }
  // Using non-null assertion because it's set by EventManager's constructor
  manager;
};
var APP_ID_ATTRIBUTE_NAME = "ng-app-id";
function removeElements(elements) {
  for (const element of elements) {
    element.remove();
  }
}
function createStyleElement(style, doc) {
  const styleElement = doc.createElement("style");
  styleElement.textContent = style;
  return styleElement;
}
function addServerStyles(doc, appId, inline, external) {
  const elements = doc.head?.querySelectorAll(`style[${APP_ID_ATTRIBUTE_NAME}="${appId}"],link[${APP_ID_ATTRIBUTE_NAME}="${appId}"]`);
  if (elements) {
    for (const styleElement of elements) {
      styleElement.removeAttribute(APP_ID_ATTRIBUTE_NAME);
      if (styleElement instanceof HTMLLinkElement) {
        external.set(styleElement.href.slice(styleElement.href.lastIndexOf("/") + 1), {
          usage: 0,
          elements: [styleElement]
        });
      } else if (styleElement.textContent) {
        inline.set(styleElement.textContent, {
          usage: 0,
          elements: [styleElement]
        });
      }
    }
  }
}
function createLinkElement(url, doc) {
  const linkElement = doc.createElement("link");
  linkElement.setAttribute("rel", "stylesheet");
  linkElement.setAttribute("href", url);
  return linkElement;
}
var SharedStylesHost = class _SharedStylesHost {
  doc;
  appId;
  nonce;
  /**
   * Provides usage information for active inline style content and associated HTML <style> elements.
   * Embedded styles typically originate from the `styles` metadata of a rendered component.
   */
  inline = /* @__PURE__ */ new Map();
  /**
   * Provides usage information for active external style URLs and the associated HTML <link> elements.
   * External styles typically originate from the `ɵɵExternalStylesFeature` of a rendered component.
   */
  external = /* @__PURE__ */ new Map();
  /**
   * Set of host DOM nodes that will have styles attached.
   */
  hosts = /* @__PURE__ */ new Set();
  /**
   * Whether the application code is currently executing on a server.
   */
  isServer;
  constructor(doc, appId, nonce, platformId = {}) {
    this.doc = doc;
    this.appId = appId;
    this.nonce = nonce;
    this.isServer = isPlatformServer(platformId);
    addServerStyles(doc, appId, this.inline, this.external);
    this.hosts.add(doc.head);
  }
  /**
   * Adds embedded styles to the DOM via HTML `style` elements.
   * @param styles An array of style content strings.
   */
  addStyles(styles, urls) {
    for (const value of styles) {
      this.addUsage(value, this.inline, createStyleElement);
    }
    urls?.forEach((value) => this.addUsage(value, this.external, createLinkElement));
  }
  /**
   * Removes embedded styles from the DOM that were added as HTML `style` elements.
   * @param styles An array of style content strings.
   */
  removeStyles(styles, urls) {
    for (const value of styles) {
      this.removeUsage(value, this.inline);
    }
    urls?.forEach((value) => this.removeUsage(value, this.external));
  }
  addUsage(value, usages, creator) {
    const record = usages.get(value);
    if (record) {
      if ((typeof ngDevMode === "undefined" || ngDevMode) && record.usage === 0) {
        record.elements.forEach((element) => element.setAttribute("ng-style-reused", ""));
      }
      record.usage++;
    } else {
      usages.set(value, {
        usage: 1,
        elements: [...this.hosts].map((host) => this.addElement(host, creator(value, this.doc)))
      });
    }
  }
  removeUsage(value, usages) {
    const record = usages.get(value);
    if (record) {
      record.usage--;
      if (record.usage <= 0) {
        removeElements(record.elements);
        usages.delete(value);
      }
    }
  }
  ngOnDestroy() {
    for (const [, {
      elements
    }] of [...this.inline, ...this.external]) {
      removeElements(elements);
    }
    this.hosts.clear();
  }
  /**
   * Adds a host node to the set of style hosts and adds all existing style usage to
   * the newly added host node.
   *
   * This is currently only used for Shadow DOM encapsulation mode.
   */
  addHost(hostNode) {
    this.hosts.add(hostNode);
    for (const [style, {
      elements
    }] of this.inline) {
      elements.push(this.addElement(hostNode, createStyleElement(style, this.doc)));
    }
    for (const [url, {
      elements
    }] of this.external) {
      elements.push(this.addElement(hostNode, createLinkElement(url, this.doc)));
    }
  }
  removeHost(hostNode) {
    this.hosts.delete(hostNode);
  }
  addElement(host, element) {
    if (this.nonce) {
      element.setAttribute("nonce", this.nonce);
    }
    if (this.isServer) {
      element.setAttribute(APP_ID_ATTRIBUTE_NAME, this.appId);
    }
    return host.appendChild(element);
  }
  static ɵfac = function SharedStylesHost_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SharedStylesHost)(ɵɵinject(DOCUMENT), ɵɵinject(APP_ID), ɵɵinject(CSP_NONCE, 8), ɵɵinject(PLATFORM_ID));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _SharedStylesHost,
    factory: _SharedStylesHost.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SharedStylesHost, [{
    type: Injectable
  }], () => [{
    type: Document,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [APP_ID]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [CSP_NONCE]
    }, {
      type: Optional
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [PLATFORM_ID]
    }]
  }], null);
})();
var NAMESPACE_URIS = {
  "svg": "http://www.w3.org/2000/svg",
  "xhtml": "http://www.w3.org/1999/xhtml",
  "xlink": "http://www.w3.org/1999/xlink",
  "xml": "http://www.w3.org/XML/1998/namespace",
  "xmlns": "http://www.w3.org/2000/xmlns/",
  "math": "http://www.w3.org/1998/Math/MathML"
};
var COMPONENT_REGEX = /%COMP%/g;
var SOURCEMAP_URL_REGEXP = /\/\*#\s*sourceMappingURL=(.+?)\s*\*\//;
var PROTOCOL_REGEXP = /^https?:/;
var COMPONENT_VARIABLE = "%COMP%";
var HOST_ATTR = `_nghost-${COMPONENT_VARIABLE}`;
var CONTENT_ATTR = `_ngcontent-${COMPONENT_VARIABLE}`;
var REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT = true;
var REMOVE_STYLES_ON_COMPONENT_DESTROY = new InjectionToken(ngDevMode ? "RemoveStylesOnCompDestroy" : "", {
  providedIn: "root",
  factory: () => REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT
});
function shimContentAttribute(componentShortId) {
  return CONTENT_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimHostAttribute(componentShortId) {
  return HOST_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimStylesContent(compId, styles) {
  return styles.map((s) => s.replace(COMPONENT_REGEX, compId));
}
function addBaseHrefToCssSourceMap(baseHref, styles) {
  if (!baseHref) {
    return styles;
  }
  const absoluteBaseHrefUrl = new URL(baseHref, "http://localhost");
  return styles.map((cssContent) => {
    if (!cssContent.includes("sourceMappingURL=")) {
      return cssContent;
    }
    return cssContent.replace(SOURCEMAP_URL_REGEXP, (_, sourceMapUrl) => {
      if (sourceMapUrl[0] === "/" || sourceMapUrl.startsWith("data:") || PROTOCOL_REGEXP.test(sourceMapUrl)) {
        return `/*# sourceMappingURL=${sourceMapUrl} */`;
      }
      const {
        pathname: resolvedSourceMapUrl
      } = new URL(sourceMapUrl, absoluteBaseHrefUrl);
      return `/*# sourceMappingURL=${resolvedSourceMapUrl} */`;
    });
  });
}
var DomRendererFactory2 = class _DomRendererFactory2 {
  eventManager;
  sharedStylesHost;
  appId;
  removeStylesOnCompDestroy;
  doc;
  platformId;
  ngZone;
  nonce;
  tracingService;
  rendererByCompId = /* @__PURE__ */ new Map();
  defaultRenderer;
  platformIsServer;
  constructor(eventManager, sharedStylesHost, appId, removeStylesOnCompDestroy, doc, platformId, ngZone, nonce = null, tracingService = null) {
    this.eventManager = eventManager;
    this.sharedStylesHost = sharedStylesHost;
    this.appId = appId;
    this.removeStylesOnCompDestroy = removeStylesOnCompDestroy;
    this.doc = doc;
    this.platformId = platformId;
    this.ngZone = ngZone;
    this.nonce = nonce;
    this.tracingService = tracingService;
    this.platformIsServer = isPlatformServer(platformId);
    this.defaultRenderer = new DefaultDomRenderer2(eventManager, doc, ngZone, this.platformIsServer, this.tracingService);
  }
  createRenderer(element, type) {
    if (!element || !type) {
      return this.defaultRenderer;
    }
    if (this.platformIsServer && type.encapsulation === ViewEncapsulation.ShadowDom) {
      type = __spreadProps(__spreadValues({}, type), {
        encapsulation: ViewEncapsulation.Emulated
      });
    }
    const renderer = this.getOrCreateRenderer(element, type);
    if (renderer instanceof EmulatedEncapsulationDomRenderer2) {
      renderer.applyToHost(element);
    } else if (renderer instanceof NoneEncapsulationDomRenderer) {
      renderer.applyStyles();
    }
    return renderer;
  }
  getOrCreateRenderer(element, type) {
    const rendererByCompId = this.rendererByCompId;
    let renderer = rendererByCompId.get(type.id);
    if (!renderer) {
      const doc = this.doc;
      const ngZone = this.ngZone;
      const eventManager = this.eventManager;
      const sharedStylesHost = this.sharedStylesHost;
      const removeStylesOnCompDestroy = this.removeStylesOnCompDestroy;
      const platformIsServer = this.platformIsServer;
      const tracingService = this.tracingService;
      switch (type.encapsulation) {
        case ViewEncapsulation.Emulated:
          renderer = new EmulatedEncapsulationDomRenderer2(eventManager, sharedStylesHost, type, this.appId, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService);
          break;
        case ViewEncapsulation.ShadowDom:
          return new ShadowDomRenderer(eventManager, sharedStylesHost, element, type, doc, ngZone, this.nonce, platformIsServer, tracingService);
        default:
          renderer = new NoneEncapsulationDomRenderer(eventManager, sharedStylesHost, type, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService);
          break;
      }
      rendererByCompId.set(type.id, renderer);
    }
    return renderer;
  }
  ngOnDestroy() {
    this.rendererByCompId.clear();
  }
  /**
   * Used during HMR to clear any cached data about a component.
   * @param componentId ID of the component that is being replaced.
   */
  componentReplaced(componentId) {
    this.rendererByCompId.delete(componentId);
  }
  static ɵfac = function DomRendererFactory2_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DomRendererFactory2)(ɵɵinject(EventManager), ɵɵinject(SharedStylesHost), ɵɵinject(APP_ID), ɵɵinject(REMOVE_STYLES_ON_COMPONENT_DESTROY), ɵɵinject(DOCUMENT), ɵɵinject(PLATFORM_ID), ɵɵinject(NgZone), ɵɵinject(CSP_NONCE), ɵɵinject(TracingService, 8));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _DomRendererFactory2,
    factory: _DomRendererFactory2.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomRendererFactory2, [{
    type: Injectable
  }], () => [{
    type: EventManager
  }, {
    type: SharedStylesHost
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [APP_ID]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [REMOVE_STYLES_ON_COMPONENT_DESTROY]
    }]
  }, {
    type: Document,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: Object,
    decorators: [{
      type: Inject,
      args: [PLATFORM_ID]
    }]
  }, {
    type: NgZone
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [CSP_NONCE]
    }]
  }, {
    type: TracingService,
    decorators: [{
      type: Inject,
      args: [TracingService]
    }, {
      type: Optional
    }]
  }], null);
})();
var DefaultDomRenderer2 = class {
  eventManager;
  doc;
  ngZone;
  platformIsServer;
  tracingService;
  data = /* @__PURE__ */ Object.create(null);
  /**
   * By default this renderer throws when encountering synthetic properties
   * This can be disabled for example by the AsyncAnimationRendererFactory
   */
  throwOnSyntheticProps = true;
  constructor(eventManager, doc, ngZone, platformIsServer, tracingService) {
    this.eventManager = eventManager;
    this.doc = doc;
    this.ngZone = ngZone;
    this.platformIsServer = platformIsServer;
    this.tracingService = tracingService;
  }
  destroy() {
  }
  destroyNode = null;
  createElement(name, namespace) {
    if (namespace) {
      return this.doc.createElementNS(NAMESPACE_URIS[namespace] || namespace, name);
    }
    return this.doc.createElement(name);
  }
  createComment(value) {
    return this.doc.createComment(value);
  }
  createText(value) {
    return this.doc.createTextNode(value);
  }
  appendChild(parent, newChild) {
    const targetParent = isTemplateNode(parent) ? parent.content : parent;
    targetParent.appendChild(newChild);
  }
  insertBefore(parent, newChild, refChild) {
    if (parent) {
      const targetParent = isTemplateNode(parent) ? parent.content : parent;
      targetParent.insertBefore(newChild, refChild);
    }
  }
  removeChild(_parent, oldChild) {
    oldChild.remove();
  }
  selectRootElement(selectorOrNode, preserveContent) {
    let el = typeof selectorOrNode === "string" ? this.doc.querySelector(selectorOrNode) : selectorOrNode;
    if (!el) {
      throw new RuntimeError(-5104, (typeof ngDevMode === "undefined" || ngDevMode) && `The selector "${selectorOrNode}" did not match any elements`);
    }
    if (!preserveContent) {
      el.textContent = "";
    }
    return el;
  }
  parentNode(node) {
    return node.parentNode;
  }
  nextSibling(node) {
    return node.nextSibling;
  }
  setAttribute(el, name, value, namespace) {
    if (namespace) {
      name = namespace + ":" + name;
      const namespaceUri = NAMESPACE_URIS[namespace];
      if (namespaceUri) {
        el.setAttributeNS(namespaceUri, name, value);
      } else {
        el.setAttribute(name, value);
      }
    } else {
      el.setAttribute(name, value);
    }
  }
  removeAttribute(el, name, namespace) {
    if (namespace) {
      const namespaceUri = NAMESPACE_URIS[namespace];
      if (namespaceUri) {
        el.removeAttributeNS(namespaceUri, name);
      } else {
        el.removeAttribute(`${namespace}:${name}`);
      }
    } else {
      el.removeAttribute(name);
    }
  }
  addClass(el, name) {
    el.classList.add(name);
  }
  removeClass(el, name) {
    el.classList.remove(name);
  }
  setStyle(el, style, value, flags) {
    if (flags & (RendererStyleFlags2.DashCase | RendererStyleFlags2.Important)) {
      el.style.setProperty(style, value, flags & RendererStyleFlags2.Important ? "important" : "");
    } else {
      el.style[style] = value;
    }
  }
  removeStyle(el, style, flags) {
    if (flags & RendererStyleFlags2.DashCase) {
      el.style.removeProperty(style);
    } else {
      el.style[style] = "";
    }
  }
  setProperty(el, name, value) {
    if (el == null) {
      return;
    }
    (typeof ngDevMode === "undefined" || ngDevMode) && this.throwOnSyntheticProps && checkNoSyntheticProp(name, "property");
    el[name] = value;
  }
  setValue(node, value) {
    node.nodeValue = value;
  }
  listen(target, event, callback, options) {
    (typeof ngDevMode === "undefined" || ngDevMode) && this.throwOnSyntheticProps && checkNoSyntheticProp(event, "listener");
    if (typeof target === "string") {
      target = getDOM().getGlobalEventTarget(this.doc, target);
      if (!target) {
        throw new RuntimeError(5102, (typeof ngDevMode === "undefined" || ngDevMode) && `Unsupported event target ${target} for event ${event}`);
      }
    }
    let wrappedCallback = this.decoratePreventDefault(callback);
    if (this.tracingService?.wrapEventListener) {
      wrappedCallback = this.tracingService.wrapEventListener(target, event, wrappedCallback);
    }
    return this.eventManager.addEventListener(target, event, wrappedCallback, options);
  }
  decoratePreventDefault(eventHandler) {
    return (event) => {
      if (event === "__ngUnwrap__") {
        return eventHandler;
      }
      const allowDefaultBehavior = this.platformIsServer ? this.ngZone.runGuarded(() => eventHandler(event)) : eventHandler(event);
      if (allowDefaultBehavior === false) {
        event.preventDefault();
      }
      return void 0;
    };
  }
};
var AT_CHARCODE = (() => "@".charCodeAt(0))();
function checkNoSyntheticProp(name, nameKind) {
  if (name.charCodeAt(0) === AT_CHARCODE) {
    throw new RuntimeError(5105, `Unexpected synthetic ${nameKind} ${name} found. Please make sure that:
  - Make sure \`provideAnimationsAsync()\`, \`provideAnimations()\` or \`provideNoopAnimations()\` call was added to a list of providers used to bootstrap an application.
  - There is a corresponding animation configuration named \`${name}\` defined in the \`animations\` field of the \`@Component\` decorator (see https://angular.dev/api/core/Component#animations).`);
  }
}
function isTemplateNode(node) {
  return node.tagName === "TEMPLATE" && node.content !== void 0;
}
var ShadowDomRenderer = class extends DefaultDomRenderer2 {
  sharedStylesHost;
  hostEl;
  shadowRoot;
  constructor(eventManager, sharedStylesHost, hostEl, component, doc, ngZone, nonce, platformIsServer, tracingService) {
    super(eventManager, doc, ngZone, platformIsServer, tracingService);
    this.sharedStylesHost = sharedStylesHost;
    this.hostEl = hostEl;
    this.shadowRoot = hostEl.attachShadow({
      mode: "open"
    });
    this.sharedStylesHost.addHost(this.shadowRoot);
    let styles = component.styles;
    if (ngDevMode) {
      const baseHref = getDOM().getBaseHref(doc) ?? "";
      styles = addBaseHrefToCssSourceMap(baseHref, styles);
    }
    styles = shimStylesContent(component.id, styles);
    for (const style of styles) {
      const styleEl = document.createElement("style");
      if (nonce) {
        styleEl.setAttribute("nonce", nonce);
      }
      styleEl.textContent = style;
      this.shadowRoot.appendChild(styleEl);
    }
    const styleUrls = component.getExternalStyles?.();
    if (styleUrls) {
      for (const styleUrl of styleUrls) {
        const linkEl = createLinkElement(styleUrl, doc);
        if (nonce) {
          linkEl.setAttribute("nonce", nonce);
        }
        this.shadowRoot.appendChild(linkEl);
      }
    }
  }
  nodeOrShadowRoot(node) {
    return node === this.hostEl ? this.shadowRoot : node;
  }
  appendChild(parent, newChild) {
    return super.appendChild(this.nodeOrShadowRoot(parent), newChild);
  }
  insertBefore(parent, newChild, refChild) {
    return super.insertBefore(this.nodeOrShadowRoot(parent), newChild, refChild);
  }
  removeChild(_parent, oldChild) {
    return super.removeChild(null, oldChild);
  }
  parentNode(node) {
    return this.nodeOrShadowRoot(super.parentNode(this.nodeOrShadowRoot(node)));
  }
  destroy() {
    this.sharedStylesHost.removeHost(this.shadowRoot);
  }
};
var NoneEncapsulationDomRenderer = class extends DefaultDomRenderer2 {
  sharedStylesHost;
  removeStylesOnCompDestroy;
  styles;
  styleUrls;
  constructor(eventManager, sharedStylesHost, component, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService, compId) {
    super(eventManager, doc, ngZone, platformIsServer, tracingService);
    this.sharedStylesHost = sharedStylesHost;
    this.removeStylesOnCompDestroy = removeStylesOnCompDestroy;
    let styles = component.styles;
    if (ngDevMode) {
      const baseHref = getDOM().getBaseHref(doc) ?? "";
      styles = addBaseHrefToCssSourceMap(baseHref, styles);
    }
    this.styles = compId ? shimStylesContent(compId, styles) : styles;
    this.styleUrls = component.getExternalStyles?.(compId);
  }
  applyStyles() {
    this.sharedStylesHost.addStyles(this.styles, this.styleUrls);
  }
  destroy() {
    if (!this.removeStylesOnCompDestroy) {
      return;
    }
    this.sharedStylesHost.removeStyles(this.styles, this.styleUrls);
  }
};
var EmulatedEncapsulationDomRenderer2 = class extends NoneEncapsulationDomRenderer {
  contentAttr;
  hostAttr;
  constructor(eventManager, sharedStylesHost, component, appId, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService) {
    const compId = appId + "-" + component.id;
    super(eventManager, sharedStylesHost, component, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService, compId);
    this.contentAttr = shimContentAttribute(compId);
    this.hostAttr = shimHostAttribute(compId);
  }
  applyToHost(element) {
    this.applyStyles();
    this.setAttribute(element, this.hostAttr, "");
  }
  createElement(parent, name) {
    const el = super.createElement(parent, name);
    super.setAttribute(el, this.contentAttr, "");
    return el;
  }
};

// node_modules/@angular/platform-browser/fesm2022/browser-0WrrQdE0.mjs
var BrowserDomAdapter = class _BrowserDomAdapter extends DomAdapter {
  supportsDOMEvents = true;
  static makeCurrent() {
    setRootDomAdapter(new _BrowserDomAdapter());
  }
  onAndCancel(el, evt, listener, options) {
    el.addEventListener(evt, listener, options);
    return () => {
      el.removeEventListener(evt, listener, options);
    };
  }
  dispatchEvent(el, evt) {
    el.dispatchEvent(evt);
  }
  remove(node) {
    node.remove();
  }
  createElement(tagName, doc) {
    doc = doc || this.getDefaultDocument();
    return doc.createElement(tagName);
  }
  createHtmlDocument() {
    return document.implementation.createHTMLDocument("fakeTitle");
  }
  getDefaultDocument() {
    return document;
  }
  isElementNode(node) {
    return node.nodeType === Node.ELEMENT_NODE;
  }
  isShadowRoot(node) {
    return node instanceof DocumentFragment;
  }
  /** @deprecated No longer being used in Ivy code. To be removed in version 14. */
  getGlobalEventTarget(doc, target) {
    if (target === "window") {
      return window;
    }
    if (target === "document") {
      return doc;
    }
    if (target === "body") {
      return doc.body;
    }
    return null;
  }
  getBaseHref(doc) {
    const href = getBaseElementHref();
    return href == null ? null : relativePath(href);
  }
  resetBaseElement() {
    baseElement = null;
  }
  getUserAgent() {
    return window.navigator.userAgent;
  }
  getCookie(name) {
    return parseCookieValue(document.cookie, name);
  }
};
var baseElement = null;
function getBaseElementHref() {
  baseElement = baseElement || document.head.querySelector("base");
  return baseElement ? baseElement.getAttribute("href") : null;
}
function relativePath(url) {
  return new URL(url, document.baseURI).pathname;
}
var BrowserGetTestability = class {
  addToWindow(registry) {
    _global["getAngularTestability"] = (elem, findInAncestors = true) => {
      const testability = registry.findTestabilityInTree(elem, findInAncestors);
      if (testability == null) {
        throw new RuntimeError(5103, (typeof ngDevMode === "undefined" || ngDevMode) && "Could not find testability for element.");
      }
      return testability;
    };
    _global["getAllAngularTestabilities"] = () => registry.getAllTestabilities();
    _global["getAllAngularRootElements"] = () => registry.getAllRootElements();
    const whenAllStable = (callback) => {
      const testabilities = _global["getAllAngularTestabilities"]();
      let count = testabilities.length;
      const decrement = function() {
        count--;
        if (count == 0) {
          callback();
        }
      };
      testabilities.forEach((testability) => {
        testability.whenStable(decrement);
      });
    };
    if (!_global["frameworkStabilizers"]) {
      _global["frameworkStabilizers"] = [];
    }
    _global["frameworkStabilizers"].push(whenAllStable);
  }
  findTestabilityInTree(registry, elem, findInAncestors) {
    if (elem == null) {
      return null;
    }
    const t = registry.getTestability(elem);
    if (t != null) {
      return t;
    } else if (!findInAncestors) {
      return null;
    }
    if (getDOM().isShadowRoot(elem)) {
      return this.findTestabilityInTree(registry, elem.host, true);
    }
    return this.findTestabilityInTree(registry, elem.parentElement, true);
  }
};
var BrowserXhr = class _BrowserXhr {
  build() {
    return new XMLHttpRequest();
  }
  static ɵfac = function BrowserXhr_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrowserXhr)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _BrowserXhr,
    factory: _BrowserXhr.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserXhr, [{
    type: Injectable
  }], null, null);
})();
var DomEventsPlugin = class _DomEventsPlugin extends EventManagerPlugin {
  constructor(doc) {
    super(doc);
  }
  // This plugin should come last in the list of plugins, because it accepts all
  // events.
  supports(eventName) {
    return true;
  }
  addEventListener(element, eventName, handler, options) {
    element.addEventListener(eventName, handler, options);
    return () => this.removeEventListener(element, eventName, handler, options);
  }
  removeEventListener(target, eventName, callback, options) {
    return target.removeEventListener(eventName, callback, options);
  }
  static ɵfac = function DomEventsPlugin_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DomEventsPlugin)(ɵɵinject(DOCUMENT));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _DomEventsPlugin,
    factory: _DomEventsPlugin.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomEventsPlugin, [{
    type: Injectable
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
var MODIFIER_KEYS = ["alt", "control", "meta", "shift"];
var _keyMap = {
  "\b": "Backspace",
  "	": "Tab",
  "": "Delete",
  "\x1B": "Escape",
  "Del": "Delete",
  "Esc": "Escape",
  "Left": "ArrowLeft",
  "Right": "ArrowRight",
  "Up": "ArrowUp",
  "Down": "ArrowDown",
  "Menu": "ContextMenu",
  "Scroll": "ScrollLock",
  "Win": "OS"
};
var MODIFIER_KEY_GETTERS = {
  "alt": (event) => event.altKey,
  "control": (event) => event.ctrlKey,
  "meta": (event) => event.metaKey,
  "shift": (event) => event.shiftKey
};
var KeyEventsPlugin = class _KeyEventsPlugin extends EventManagerPlugin {
  /**
   * Initializes an instance of the browser plug-in.
   * @param doc The document in which key events will be detected.
   */
  constructor(doc) {
    super(doc);
  }
  /**
   * Reports whether a named key event is supported.
   * @param eventName The event name to query.
   * @return True if the named key event is supported.
   */
  supports(eventName) {
    return _KeyEventsPlugin.parseEventName(eventName) != null;
  }
  /**
   * Registers a handler for a specific element and key event.
   * @param element The HTML element to receive event notifications.
   * @param eventName The name of the key event to listen for.
   * @param handler A function to call when the notification occurs. Receives the
   * event object as an argument.
   * @returns The key event that was registered.
   */
  addEventListener(element, eventName, handler, options) {
    const parsedEvent = _KeyEventsPlugin.parseEventName(eventName);
    const outsideHandler = _KeyEventsPlugin.eventCallback(parsedEvent["fullKey"], handler, this.manager.getZone());
    return this.manager.getZone().runOutsideAngular(() => {
      return getDOM().onAndCancel(element, parsedEvent["domEventName"], outsideHandler, options);
    });
  }
  /**
   * Parses the user provided full keyboard event definition and normalizes it for
   * later internal use. It ensures the string is all lowercase, converts special
   * characters to a standard spelling, and orders all the values consistently.
   *
   * @param eventName The name of the key event to listen for.
   * @returns an object with the full, normalized string, and the dom event name
   * or null in the case when the event doesn't match a keyboard event.
   */
  static parseEventName(eventName) {
    const parts = eventName.toLowerCase().split(".");
    const domEventName = parts.shift();
    if (parts.length === 0 || !(domEventName === "keydown" || domEventName === "keyup")) {
      return null;
    }
    const key = _KeyEventsPlugin._normalizeKey(parts.pop());
    let fullKey = "";
    let codeIX = parts.indexOf("code");
    if (codeIX > -1) {
      parts.splice(codeIX, 1);
      fullKey = "code.";
    }
    MODIFIER_KEYS.forEach((modifierName) => {
      const index = parts.indexOf(modifierName);
      if (index > -1) {
        parts.splice(index, 1);
        fullKey += modifierName + ".";
      }
    });
    fullKey += key;
    if (parts.length != 0 || key.length === 0) {
      return null;
    }
    const result = {};
    result["domEventName"] = domEventName;
    result["fullKey"] = fullKey;
    return result;
  }
  /**
   * Determines whether the actual keys pressed match the configured key code string.
   * The `fullKeyCode` event is normalized in the `parseEventName` method when the
   * event is attached to the DOM during the `addEventListener` call. This is unseen
   * by the end user and is normalized for internal consistency and parsing.
   *
   * @param event The keyboard event.
   * @param fullKeyCode The normalized user defined expected key event string
   * @returns boolean.
   */
  static matchEventFullKeyCode(event, fullKeyCode) {
    let keycode = _keyMap[event.key] || event.key;
    let key = "";
    if (fullKeyCode.indexOf("code.") > -1) {
      keycode = event.code;
      key = "code.";
    }
    if (keycode == null || !keycode) return false;
    keycode = keycode.toLowerCase();
    if (keycode === " ") {
      keycode = "space";
    } else if (keycode === ".") {
      keycode = "dot";
    }
    MODIFIER_KEYS.forEach((modifierName) => {
      if (modifierName !== keycode) {
        const modifierGetter = MODIFIER_KEY_GETTERS[modifierName];
        if (modifierGetter(event)) {
          key += modifierName + ".";
        }
      }
    });
    key += keycode;
    return key === fullKeyCode;
  }
  /**
   * Configures a handler callback for a key event.
   * @param fullKey The event name that combines all simultaneous keystrokes.
   * @param handler The function that responds to the key event.
   * @param zone The zone in which the event occurred.
   * @returns A callback function.
   */
  static eventCallback(fullKey, handler, zone) {
    return (event) => {
      if (_KeyEventsPlugin.matchEventFullKeyCode(event, fullKey)) {
        zone.runGuarded(() => handler(event));
      }
    };
  }
  /** @internal */
  static _normalizeKey(keyName) {
    return keyName === "esc" ? "escape" : keyName;
  }
  static ɵfac = function KeyEventsPlugin_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _KeyEventsPlugin)(ɵɵinject(DOCUMENT));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _KeyEventsPlugin,
    factory: _KeyEventsPlugin.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeyEventsPlugin, [{
    type: Injectable
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
function bootstrapApplication(rootComponent, options, context) {
  return internalCreateApplication(__spreadValues({
    rootComponent,
    platformRef: context?.platformRef
  }, createProvidersConfig(options)));
}
function createApplication(options) {
  return internalCreateApplication(createProvidersConfig(options));
}
function createProvidersConfig(options) {
  return {
    appProviders: [...BROWSER_MODULE_PROVIDERS, ...options?.providers ?? []],
    platformProviders: INTERNAL_BROWSER_PLATFORM_PROVIDERS
  };
}
function provideProtractorTestingSupport() {
  return [...TESTABILITY_PROVIDERS];
}
function initDomAdapter() {
  BrowserDomAdapter.makeCurrent();
}
function errorHandler() {
  return new ErrorHandler();
}
function _document() {
  setDocument(document);
  return document;
}
var INTERNAL_BROWSER_PLATFORM_PROVIDERS = [{
  provide: PLATFORM_ID,
  useValue: PLATFORM_BROWSER_ID
}, {
  provide: PLATFORM_INITIALIZER,
  useValue: initDomAdapter,
  multi: true
}, {
  provide: DOCUMENT,
  useFactory: _document
}];
var platformBrowser = createPlatformFactory(platformCore, "browser", INTERNAL_BROWSER_PLATFORM_PROVIDERS);
var BROWSER_MODULE_PROVIDERS_MARKER = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "BrowserModule Providers Marker" : "");
var TESTABILITY_PROVIDERS = [{
  provide: TESTABILITY_GETTER,
  useClass: BrowserGetTestability
}, {
  provide: TESTABILITY,
  useClass: Testability,
  deps: [NgZone, TestabilityRegistry, TESTABILITY_GETTER]
}, {
  provide: Testability,
  // Also provide as `Testability` for backwards-compatibility.
  useClass: Testability,
  deps: [NgZone, TestabilityRegistry, TESTABILITY_GETTER]
}];
var BROWSER_MODULE_PROVIDERS = [{
  provide: INJECTOR_SCOPE,
  useValue: "root"
}, {
  provide: ErrorHandler,
  useFactory: errorHandler
}, {
  provide: EVENT_MANAGER_PLUGINS,
  useClass: DomEventsPlugin,
  multi: true,
  deps: [DOCUMENT]
}, {
  provide: EVENT_MANAGER_PLUGINS,
  useClass: KeyEventsPlugin,
  multi: true,
  deps: [DOCUMENT]
}, DomRendererFactory2, SharedStylesHost, EventManager, {
  provide: RendererFactory2,
  useExisting: DomRendererFactory2
}, {
  provide: XhrFactory,
  useClass: BrowserXhr
}, typeof ngDevMode === "undefined" || ngDevMode ? {
  provide: BROWSER_MODULE_PROVIDERS_MARKER,
  useValue: true
} : []];
var BrowserModule = class _BrowserModule {
  constructor() {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      const providersAlreadyPresent = inject(BROWSER_MODULE_PROVIDERS_MARKER, {
        optional: true,
        skipSelf: true
      });
      if (providersAlreadyPresent) {
        throw new RuntimeError(5100, `Providers from the \`BrowserModule\` have already been loaded. If you need access to common directives such as NgIf and NgFor, import the \`CommonModule\` instead.`);
      }
    }
  }
  static ɵfac = function BrowserModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrowserModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _BrowserModule,
    exports: [CommonModule, ApplicationModule]
  });
  static ɵinj = ɵɵdefineInjector({
    providers: [...BROWSER_MODULE_PROVIDERS, ...TESTABILITY_PROVIDERS],
    imports: [CommonModule, ApplicationModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserModule, [{
    type: NgModule,
    args: [{
      providers: [...BROWSER_MODULE_PROVIDERS, ...TESTABILITY_PROVIDERS],
      exports: [CommonModule, ApplicationModule]
    }]
  }], () => [], null);
})();

// node_modules/@angular/platform-browser/fesm2022/platform-browser.mjs
var Meta = class _Meta {
  _doc;
  _dom;
  constructor(_doc) {
    this._doc = _doc;
    this._dom = getDOM();
  }
  /**
   * Retrieves or creates a specific `<meta>` tag element in the current HTML document.
   * In searching for an existing tag, Angular attempts to match the `name` or `property` attribute
   * values in the provided tag definition, and verifies that all other attribute values are equal.
   * If an existing element is found, it is returned and is not modified in any way.
   * @param tag The definition of a `<meta>` element to match or create.
   * @param forceCreation True to create a new element without checking whether one already exists.
   * @returns The existing element with the same attributes and values if found,
   * the new element if no match is found, or `null` if the tag parameter is not defined.
   */
  addTag(tag, forceCreation = false) {
    if (!tag) return null;
    return this._getOrCreateElement(tag, forceCreation);
  }
  /**
   * Retrieves or creates a set of `<meta>` tag elements in the current HTML document.
   * In searching for an existing tag, Angular attempts to match the `name` or `property` attribute
   * values in the provided tag definition, and verifies that all other attribute values are equal.
   * @param tags An array of tag definitions to match or create.
   * @param forceCreation True to create new elements without checking whether they already exist.
   * @returns The matching elements if found, or the new elements.
   */
  addTags(tags, forceCreation = false) {
    if (!tags) return [];
    return tags.reduce((result, tag) => {
      if (tag) {
        result.push(this._getOrCreateElement(tag, forceCreation));
      }
      return result;
    }, []);
  }
  /**
   * Retrieves a `<meta>` tag element in the current HTML document.
   * @param attrSelector The tag attribute and value to match against, in the format
   * `"tag_attribute='value string'"`.
   * @returns The matching element, if any.
   */
  getTag(attrSelector) {
    if (!attrSelector) return null;
    return this._doc.querySelector(`meta[${attrSelector}]`) || null;
  }
  /**
   * Retrieves a set of `<meta>` tag elements in the current HTML document.
   * @param attrSelector The tag attribute and value to match against, in the format
   * `"tag_attribute='value string'"`.
   * @returns The matching elements, if any.
   */
  getTags(attrSelector) {
    if (!attrSelector) return [];
    const list = this._doc.querySelectorAll(`meta[${attrSelector}]`);
    return list ? [].slice.call(list) : [];
  }
  /**
   * Modifies an existing `<meta>` tag element in the current HTML document.
   * @param tag The tag description with which to replace the existing tag content.
   * @param selector A tag attribute and value to match against, to identify
   * an existing tag. A string in the format `"tag_attribute=`value string`"`.
   * If not supplied, matches a tag with the same `name` or `property` attribute value as the
   * replacement tag.
   * @return The modified element.
   */
  updateTag(tag, selector) {
    if (!tag) return null;
    selector = selector || this._parseSelector(tag);
    const meta = this.getTag(selector);
    if (meta) {
      return this._setMetaElementAttributes(tag, meta);
    }
    return this._getOrCreateElement(tag, true);
  }
  /**
   * Removes an existing `<meta>` tag element from the current HTML document.
   * @param attrSelector A tag attribute and value to match against, to identify
   * an existing tag. A string in the format `"tag_attribute=`value string`"`.
   */
  removeTag(attrSelector) {
    this.removeTagElement(this.getTag(attrSelector));
  }
  /**
   * Removes an existing `<meta>` tag element from the current HTML document.
   * @param meta The tag definition to match against to identify an existing tag.
   */
  removeTagElement(meta) {
    if (meta) {
      this._dom.remove(meta);
    }
  }
  _getOrCreateElement(meta, forceCreation = false) {
    if (!forceCreation) {
      const selector = this._parseSelector(meta);
      const elem = this.getTags(selector).filter((elem2) => this._containsAttributes(meta, elem2))[0];
      if (elem !== void 0) return elem;
    }
    const element = this._dom.createElement("meta");
    this._setMetaElementAttributes(meta, element);
    const head = this._doc.getElementsByTagName("head")[0];
    head.appendChild(element);
    return element;
  }
  _setMetaElementAttributes(tag, el) {
    Object.keys(tag).forEach((prop) => el.setAttribute(this._getMetaKeyMap(prop), tag[prop]));
    return el;
  }
  _parseSelector(tag) {
    const attr = tag.name ? "name" : "property";
    return `${attr}="${tag[attr]}"`;
  }
  _containsAttributes(tag, elem) {
    return Object.keys(tag).every((key) => elem.getAttribute(this._getMetaKeyMap(key)) === tag[key]);
  }
  _getMetaKeyMap(prop) {
    return META_KEYS_MAP[prop] || prop;
  }
  static ɵfac = function Meta_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Meta)(ɵɵinject(DOCUMENT));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _Meta,
    factory: _Meta.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Meta, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
var META_KEYS_MAP = {
  httpEquiv: "http-equiv"
};
var Title = class _Title {
  _doc;
  constructor(_doc) {
    this._doc = _doc;
  }
  /**
   * Get the title of the current HTML document.
   */
  getTitle() {
    return this._doc.title;
  }
  /**
   * Set the title of the current HTML document.
   * @param newTitle
   */
  setTitle(newTitle) {
    this._doc.title = newTitle || "";
  }
  static ɵfac = function Title_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Title)(ɵɵinject(DOCUMENT));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _Title,
    factory: _Title.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Title, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
function exportNgVar(name, value) {
  if (typeof COMPILED === "undefined" || !COMPILED) {
    const ng = _global["ng"] = _global["ng"] || {};
    ng[name] = value;
  }
}
var ChangeDetectionPerfRecord = class {
  msPerTick;
  numTicks;
  constructor(msPerTick, numTicks) {
    this.msPerTick = msPerTick;
    this.numTicks = numTicks;
  }
};
var AngularProfiler = class {
  appRef;
  constructor(ref) {
    this.appRef = ref.injector.get(ApplicationRef);
  }
  // tslint:disable:no-console
  /**
   * Exercises change detection in a loop and then prints the average amount of
   * time in milliseconds how long a single round of change detection takes for
   * the current state of the UI. It runs a minimum of 5 rounds for a minimum
   * of 500 milliseconds.
   *
   * Optionally, a user may pass a `config` parameter containing a map of
   * options. Supported options are:
   *
   * `record` (boolean) - causes the profiler to record a CPU profile while
   * it exercises the change detector. Example:
   *
   * ```ts
   * ng.profiler.timeChangeDetection({record: true})
   * ```
   */
  timeChangeDetection(config) {
    const record = config && config["record"];
    const profileName = "Change Detection";
    if (record && "profile" in console && typeof console.profile === "function") {
      console.profile(profileName);
    }
    const start = performance.now();
    let numTicks = 0;
    while (numTicks < 5 || performance.now() - start < 500) {
      this.appRef.tick();
      numTicks++;
    }
    const end = performance.now();
    if (record && "profileEnd" in console && typeof console.profileEnd === "function") {
      console.profileEnd(profileName);
    }
    const msPerTick = (end - start) / numTicks;
    console.log(`ran ${numTicks} change detection cycles`);
    console.log(`${msPerTick.toFixed(2)} ms per check`);
    return new ChangeDetectionPerfRecord(msPerTick, numTicks);
  }
};
var PROFILER_GLOBAL_NAME = "profiler";
function enableDebugTools(ref) {
  exportNgVar(PROFILER_GLOBAL_NAME, new AngularProfiler(ref));
  return ref;
}
function disableDebugTools() {
  exportNgVar(PROFILER_GLOBAL_NAME, null);
}
var By = class {
  /**
   * Match all nodes.
   *
   * @usageNotes
   * ### Example
   *
   * {@example platform-browser/dom/debug/ts/by/by.ts region='by_all'}
   */
  static all() {
    return () => true;
  }
  /**
   * Match elements by the given CSS selector.
   *
   * @usageNotes
   * ### Example
   *
   * {@example platform-browser/dom/debug/ts/by/by.ts region='by_css'}
   */
  static css(selector) {
    return (debugElement) => {
      return debugElement.nativeElement != null ? elementMatches(debugElement.nativeElement, selector) : false;
    };
  }
  /**
   * Match nodes that have the given directive present.
   *
   * @usageNotes
   * ### Example
   *
   * {@example platform-browser/dom/debug/ts/by/by.ts region='by_directive'}
   */
  static directive(type) {
    return (debugNode) => debugNode.providerTokens.indexOf(type) !== -1;
  }
};
function elementMatches(n, selector) {
  if (getDOM().isElementNode(n)) {
    return n.matches && n.matches(selector) || n.msMatchesSelector && n.msMatchesSelector(selector) || n.webkitMatchesSelector && n.webkitMatchesSelector(selector);
  }
  return false;
}
var EVENT_NAMES = {
  // pan
  "pan": true,
  "panstart": true,
  "panmove": true,
  "panend": true,
  "pancancel": true,
  "panleft": true,
  "panright": true,
  "panup": true,
  "pandown": true,
  // pinch
  "pinch": true,
  "pinchstart": true,
  "pinchmove": true,
  "pinchend": true,
  "pinchcancel": true,
  "pinchin": true,
  "pinchout": true,
  // press
  "press": true,
  "pressup": true,
  // rotate
  "rotate": true,
  "rotatestart": true,
  "rotatemove": true,
  "rotateend": true,
  "rotatecancel": true,
  // swipe
  "swipe": true,
  "swipeleft": true,
  "swiperight": true,
  "swipeup": true,
  "swipedown": true,
  // tap
  "tap": true,
  "doubletap": true
};
var HAMMER_GESTURE_CONFIG = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "HammerGestureConfig" : "");
var HAMMER_LOADER = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "HammerLoader" : "");
var HammerGestureConfig = class _HammerGestureConfig {
  /**
   * A set of supported event names for gestures to be used in Angular.
   * Angular supports all built-in recognizers, as listed in
   * [HammerJS documentation](https://hammerjs.github.io/).
   */
  events = [];
  /**
   * Maps gesture event names to a set of configuration options
   * that specify overrides to the default values for specific properties.
   *
   * The key is a supported event name to be configured,
   * and the options object contains a set of properties, with override values
   * to be applied to the named recognizer event.
   * For example, to disable recognition of the rotate event, specify
   *  `{"rotate": {"enable": false}}`.
   *
   * Properties that are not present take the HammerJS default values.
   * For information about which properties are supported for which events,
   * and their allowed and default values, see
   * [HammerJS documentation](https://hammerjs.github.io/).
   *
   */
  overrides = {};
  /**
   * Properties whose default values can be overridden for a given event.
   * Different sets of properties apply to different events.
   * For information about which properties are supported for which events,
   * and their allowed and default values, see
   * [HammerJS documentation](https://hammerjs.github.io/).
   */
  options;
  /**
   * Creates a [HammerJS Manager](https://hammerjs.github.io/api/#hammermanager)
   * and attaches it to a given HTML element.
   * @param element The element that will recognize gestures.
   * @returns A HammerJS event-manager object.
   */
  buildHammer(element) {
    const mc = new Hammer(element, this.options);
    mc.get("pinch").set({
      enable: true
    });
    mc.get("rotate").set({
      enable: true
    });
    for (const eventName in this.overrides) {
      mc.get(eventName).set(this.overrides[eventName]);
    }
    return mc;
  }
  static ɵfac = function HammerGestureConfig_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HammerGestureConfig)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _HammerGestureConfig,
    factory: _HammerGestureConfig.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HammerGestureConfig, [{
    type: Injectable
  }], null, null);
})();
var HammerGesturesPlugin = class _HammerGesturesPlugin extends EventManagerPlugin {
  _config;
  _injector;
  loader;
  _loaderPromise = null;
  constructor(doc, _config, _injector, loader) {
    super(doc);
    this._config = _config;
    this._injector = _injector;
    this.loader = loader;
  }
  supports(eventName) {
    if (!EVENT_NAMES.hasOwnProperty(eventName.toLowerCase()) && !this.isCustomEvent(eventName)) {
      return false;
    }
    if (!window.Hammer && !this.loader) {
      if (typeof ngDevMode === "undefined" || ngDevMode) {
        const _console = this._injector.get(Console);
        _console.warn(`The "${eventName}" event cannot be bound because Hammer.JS is not loaded and no custom loader has been specified.`);
      }
      return false;
    }
    return true;
  }
  addEventListener(element, eventName, handler) {
    const zone = this.manager.getZone();
    eventName = eventName.toLowerCase();
    if (!window.Hammer && this.loader) {
      this._loaderPromise = this._loaderPromise || zone.runOutsideAngular(() => this.loader());
      let cancelRegistration = false;
      let deregister = () => {
        cancelRegistration = true;
      };
      zone.runOutsideAngular(() => this._loaderPromise.then(() => {
        if (!window.Hammer) {
          if (typeof ngDevMode === "undefined" || ngDevMode) {
            const _console = this._injector.get(Console);
            _console.warn(`The custom HAMMER_LOADER completed, but Hammer.JS is not present.`);
          }
          deregister = () => {
          };
          return;
        }
        if (!cancelRegistration) {
          deregister = this.addEventListener(element, eventName, handler);
        }
      }).catch(() => {
        if (typeof ngDevMode === "undefined" || ngDevMode) {
          const _console = this._injector.get(Console);
          _console.warn(`The "${eventName}" event cannot be bound because the custom Hammer.JS loader failed.`);
        }
        deregister = () => {
        };
      }));
      return () => {
        deregister();
      };
    }
    return zone.runOutsideAngular(() => {
      const mc = this._config.buildHammer(element);
      const callback = function(eventObj) {
        zone.runGuarded(function() {
          handler(eventObj);
        });
      };
      mc.on(eventName, callback);
      return () => {
        mc.off(eventName, callback);
        if (typeof mc.destroy === "function") {
          mc.destroy();
        }
      };
    });
  }
  isCustomEvent(eventName) {
    return this._config.events.indexOf(eventName) > -1;
  }
  static ɵfac = function HammerGesturesPlugin_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HammerGesturesPlugin)(ɵɵinject(DOCUMENT), ɵɵinject(HAMMER_GESTURE_CONFIG), ɵɵinject(Injector), ɵɵinject(HAMMER_LOADER, 8));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _HammerGesturesPlugin,
    factory: _HammerGesturesPlugin.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HammerGesturesPlugin, [{
    type: Injectable
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: HammerGestureConfig,
    decorators: [{
      type: Inject,
      args: [HAMMER_GESTURE_CONFIG]
    }]
  }, {
    type: Injector
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [HAMMER_LOADER]
    }]
  }], null);
})();
var HammerModule = class _HammerModule {
  static ɵfac = function HammerModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HammerModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _HammerModule
  });
  static ɵinj = ɵɵdefineInjector({
    providers: [{
      provide: EVENT_MANAGER_PLUGINS,
      useClass: HammerGesturesPlugin,
      multi: true,
      deps: [DOCUMENT, HAMMER_GESTURE_CONFIG, Injector, [new Optional(), HAMMER_LOADER]]
    }, {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: HammerGestureConfig
    }]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HammerModule, [{
    type: NgModule,
    args: [{
      providers: [{
        provide: EVENT_MANAGER_PLUGINS,
        useClass: HammerGesturesPlugin,
        multi: true,
        deps: [DOCUMENT, HAMMER_GESTURE_CONFIG, Injector, [new Optional(), HAMMER_LOADER]]
      }, {
        provide: HAMMER_GESTURE_CONFIG,
        useClass: HammerGestureConfig
      }]
    }]
  }], null, null);
})();
var DomSanitizer = class _DomSanitizer {
  static ɵfac = function DomSanitizer_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DomSanitizer)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _DomSanitizer,
    factory: function DomSanitizer_Factory(__ngFactoryType__) {
      let __ngConditionalFactory__ = null;
      if (__ngFactoryType__) {
        __ngConditionalFactory__ = new (__ngFactoryType__ || _DomSanitizer)();
      } else {
        __ngConditionalFactory__ = ɵɵinject(DomSanitizerImpl);
      }
      return __ngConditionalFactory__;
    },
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomSanitizer, [{
    type: Injectable,
    args: [{
      providedIn: "root",
      useExisting: forwardRef(() => DomSanitizerImpl)
    }]
  }], null, null);
})();
var DomSanitizerImpl = class _DomSanitizerImpl extends DomSanitizer {
  _doc;
  constructor(_doc) {
    super();
    this._doc = _doc;
  }
  sanitize(ctx, value) {
    if (value == null) return null;
    switch (ctx) {
      case SecurityContext.NONE:
        return value;
      case SecurityContext.HTML:
        if (allowSanitizationBypassAndThrow(
          value,
          "HTML"
          /* BypassType.Html */
        )) {
          return unwrapSafeValue(value);
        }
        return _sanitizeHtml(this._doc, String(value)).toString();
      case SecurityContext.STYLE:
        if (allowSanitizationBypassAndThrow(
          value,
          "Style"
          /* BypassType.Style */
        )) {
          return unwrapSafeValue(value);
        }
        return value;
      case SecurityContext.SCRIPT:
        if (allowSanitizationBypassAndThrow(
          value,
          "Script"
          /* BypassType.Script */
        )) {
          return unwrapSafeValue(value);
        }
        throw new RuntimeError(5200, (typeof ngDevMode === "undefined" || ngDevMode) && "unsafe value used in a script context");
      case SecurityContext.URL:
        if (allowSanitizationBypassAndThrow(
          value,
          "URL"
          /* BypassType.Url */
        )) {
          return unwrapSafeValue(value);
        }
        return _sanitizeUrl(String(value));
      case SecurityContext.RESOURCE_URL:
        if (allowSanitizationBypassAndThrow(
          value,
          "ResourceURL"
          /* BypassType.ResourceUrl */
        )) {
          return unwrapSafeValue(value);
        }
        throw new RuntimeError(5201, (typeof ngDevMode === "undefined" || ngDevMode) && `unsafe value used in a resource URL context (see ${XSS_SECURITY_URL})`);
      default:
        throw new RuntimeError(5202, (typeof ngDevMode === "undefined" || ngDevMode) && `Unexpected SecurityContext ${ctx} (see ${XSS_SECURITY_URL})`);
    }
  }
  bypassSecurityTrustHtml(value) {
    return bypassSanitizationTrustHtml(value);
  }
  bypassSecurityTrustStyle(value) {
    return bypassSanitizationTrustStyle(value);
  }
  bypassSecurityTrustScript(value) {
    return bypassSanitizationTrustScript(value);
  }
  bypassSecurityTrustUrl(value) {
    return bypassSanitizationTrustUrl(value);
  }
  bypassSecurityTrustResourceUrl(value) {
    return bypassSanitizationTrustResourceUrl(value);
  }
  static ɵfac = function DomSanitizerImpl_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DomSanitizerImpl)(ɵɵinject(DOCUMENT));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _DomSanitizerImpl,
    factory: _DomSanitizerImpl.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomSanitizerImpl, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
var HydrationFeatureKind;
(function(HydrationFeatureKind2) {
  HydrationFeatureKind2[HydrationFeatureKind2["NoHttpTransferCache"] = 0] = "NoHttpTransferCache";
  HydrationFeatureKind2[HydrationFeatureKind2["HttpTransferCacheOptions"] = 1] = "HttpTransferCacheOptions";
  HydrationFeatureKind2[HydrationFeatureKind2["I18nSupport"] = 2] = "I18nSupport";
  HydrationFeatureKind2[HydrationFeatureKind2["EventReplay"] = 3] = "EventReplay";
  HydrationFeatureKind2[HydrationFeatureKind2["IncrementalHydration"] = 4] = "IncrementalHydration";
})(HydrationFeatureKind || (HydrationFeatureKind = {}));
function hydrationFeature(ɵkind, ɵproviders = [], ɵoptions = {}) {
  return {
    ɵkind,
    ɵproviders
  };
}
function withNoHttpTransferCache() {
  return hydrationFeature(HydrationFeatureKind.NoHttpTransferCache);
}
function withHttpTransferCacheOptions(options) {
  return hydrationFeature(HydrationFeatureKind.HttpTransferCacheOptions, withHttpTransferCache(options));
}
function withI18nSupport2() {
  return hydrationFeature(HydrationFeatureKind.I18nSupport, withI18nSupport());
}
function withEventReplay2() {
  return hydrationFeature(HydrationFeatureKind.EventReplay, withEventReplay());
}
function withIncrementalHydration2() {
  return hydrationFeature(HydrationFeatureKind.IncrementalHydration, withIncrementalHydration());
}
function provideZoneJsCompatibilityDetector() {
  return [{
    provide: ENVIRONMENT_INITIALIZER,
    useValue: () => {
      const ngZone = inject(NgZone);
      const isZoneless = inject(ZONELESS_ENABLED);
      if (!isZoneless && ngZone.constructor !== NgZone) {
        const console2 = inject(Console);
        const message = formatRuntimeError(-5e3, "Angular detected that hydration was enabled for an application that uses a custom or a noop Zone.js implementation. This is not yet a fully supported configuration.");
        console2.warn(message);
      }
    },
    multi: true
  }];
}
function provideClientHydration(...features) {
  const providers = [];
  const featuresKind = /* @__PURE__ */ new Set();
  for (const {
    ɵproviders,
    ɵkind
  } of features) {
    featuresKind.add(ɵkind);
    if (ɵproviders.length) {
      providers.push(ɵproviders);
    }
  }
  const hasHttpTransferCacheOptions = featuresKind.has(HydrationFeatureKind.HttpTransferCacheOptions);
  if (typeof ngDevMode !== "undefined" && ngDevMode && featuresKind.has(HydrationFeatureKind.NoHttpTransferCache) && hasHttpTransferCacheOptions) {
    throw new Error("Configuration error: found both withHttpTransferCacheOptions() and withNoHttpTransferCache() in the same call to provideClientHydration(), which is a contradiction.");
  }
  return makeEnvironmentProviders([typeof ngDevMode !== "undefined" && ngDevMode ? provideZoneJsCompatibilityDetector() : [], withDomHydration(), featuresKind.has(HydrationFeatureKind.NoHttpTransferCache) || hasHttpTransferCacheOptions ? [] : withHttpTransferCache({}), providers]);
}
var VERSION = new Version("19.2.17");

export {
  EVENT_MANAGER_PLUGINS,
  EventManager,
  EventManagerPlugin,
  SharedStylesHost,
  REMOVE_STYLES_ON_COMPONENT_DESTROY,
  DomRendererFactory2,
  BrowserDomAdapter,
  BrowserGetTestability,
  DomEventsPlugin,
  KeyEventsPlugin,
  bootstrapApplication,
  createApplication,
  provideProtractorTestingSupport,
  platformBrowser,
  BrowserModule,
  Meta,
  Title,
  enableDebugTools,
  disableDebugTools,
  By,
  HAMMER_GESTURE_CONFIG,
  HAMMER_LOADER,
  HammerGestureConfig,
  HammerGesturesPlugin,
  HammerModule,
  DomSanitizer,
  DomSanitizerImpl,
  HydrationFeatureKind,
  withNoHttpTransferCache,
  withHttpTransferCacheOptions,
  withI18nSupport2 as withI18nSupport,
  withEventReplay2 as withEventReplay,
  withIncrementalHydration2 as withIncrementalHydration,
  provideClientHydration,
  VERSION
};
/*! Bundled license information:

@angular/platform-browser/fesm2022/dom_renderer-DGKzginR.mjs:
@angular/platform-browser/fesm2022/browser-0WrrQdE0.mjs:
@angular/platform-browser/fesm2022/platform-browser.mjs:
  (**
   * @license Angular v19.2.17
   * (c) 2010-2025 Google LLC. https://angular.io/
   * License: MIT
   *)
*/
//# sourceMappingURL=chunk-WMQUX6DB.js.map

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/chunk-CXCX2JKZ.js (SKIPPED - TOO LARGE > 100KB)

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/rxjs.js
```typescript
import {
  NEVER,
  VirtualAction,
  VirtualTimeScheduler,
  animationFrame,
  animationFrameScheduler,
  animationFrames,
  asap,
  asapScheduler,
  bindCallback,
  bindNodeCallback,
  connectable,
  defer,
  firstValueFrom,
  forkJoin,
  fromEvent,
  fromEventPattern,
  generate,
  iif,
  isObservable,
  lastValueFrom,
  merge,
  never,
  pairs,
  partition,
  queue,
  queueScheduler,
  range,
  using
} from "./chunk-FFZIAYYX.js";
import {
  ArgumentOutOfRangeError,
  AsyncSubject,
  BehaviorSubject,
  ConnectableObservable,
  EMPTY,
  EmptyError,
  NotFoundError,
  Notification,
  NotificationKind,
  ObjectUnsubscribedError,
  Observable,
  ReplaySubject,
  Scheduler,
  SequenceError,
  Subject,
  Subscriber,
  Subscription,
  TimeoutError,
  UnsubscriptionError,
  async,
  asyncScheduler,
  audit,
  auditTime,
  buffer,
  bufferCount,
  bufferTime,
  bufferToggle,
  bufferWhen,
  catchError,
  combineAll,
  combineLatest,
  combineLatestAll,
  combineLatestWith,
  concat,
  concatAll,
  concatMap,
  concatMapTo,
  concatWith,
  config,
  connect,
  count,
  debounce,
  debounceTime,
  defaultIfEmpty,
  delay,
  delayWhen,
  dematerialize,
  distinct,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  elementAt,
  empty,
  endWith,
  every,
  exhaust,
  exhaustAll,
  exhaustMap,
  expand,
  filter,
  finalize,
  find,
  findIndex,
  first,
  flatMap,
  from,
  groupBy,
  identity,
  ignoreElements,
  interval,
  isEmpty,
  last,
  map,
  mapTo,
  materialize,
  max,
  mergeAll,
  mergeMap,
  mergeMapTo,
  mergeScan,
  mergeWith,
  min,
  multicast,
  noop,
  observable,
  observeOn,
  of,
  onErrorResumeNext,
  onErrorResumeNextWith,
  pairwise,
  pipe,
  pluck,
  publish,
  publishBehavior,
  publishLast,
  publishReplay,
  race,
  raceWith,
  reduce,
  refCount,
  repeat,
  repeatWhen,
  retry,
  retryWhen,
  sample,
  sampleTime,
  scan,
  scheduled,
  sequenceEqual,
  share,
  shareReplay,
  single,
  skip,
  skipLast,
  skipUntil,
  skipWhile,
  startWith,
  subscribeOn,
  switchAll,
  switchMap,
  switchMapTo,
  switchScan,
  take,
  takeLast,
  takeUntil,
  takeWhile,
  tap,
  throttle,
  throttleTime,
  throwError,
  throwIfEmpty,
  timeInterval,
  timeout,
  timeoutWith,
  timer,
  timestamp,
  toArray,
  window,
  windowCount,
  windowTime,
  windowToggle,
  windowWhen,
  withLatestFrom,
  zip,
  zipAll,
  zipWith
} from "./chunk-CXCX2JKZ.js";
export {
  ArgumentOutOfRangeError,
  AsyncSubject,
  BehaviorSubject,
  ConnectableObservable,
  EMPTY,
  EmptyError,
  NEVER,
  NotFoundError,
  Notification,
  NotificationKind,
  ObjectUnsubscribedError,
  Observable,
  ReplaySubject,
  Scheduler,
  SequenceError,
  Subject,
  Subscriber,
  Subscription,
  TimeoutError,
  UnsubscriptionError,
  VirtualAction,
  VirtualTimeScheduler,
  animationFrame,
  animationFrameScheduler,
  animationFrames,
  asap,
  asapScheduler,
  async,
  asyncScheduler,
  audit,
  auditTime,
  bindCallback,
  bindNodeCallback,
  buffer,
  bufferCount,
  bufferTime,
  bufferToggle,
  bufferWhen,
  catchError,
  combineAll,
  combineLatest,
  combineLatestAll,
  combineLatestWith,
  concat,
  concatAll,
  concatMap,
  concatMapTo,
  concatWith,
  config,
  connect,
  connectable,
  count,
  debounce,
  debounceTime,
  defaultIfEmpty,
  defer,
  delay,
  delayWhen,
  dematerialize,
  distinct,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  elementAt,
  empty,
  endWith,
  every,
  exhaust,
  exhaustAll,
  exhaustMap,
  expand,
  filter,
  finalize,
  find,
  findIndex,
  first,
  firstValueFrom,
  flatMap,
  forkJoin,
  from,
  fromEvent,
  fromEventPattern,
  generate,
  groupBy,
  identity,
  ignoreElements,
  iif,
  interval,
  isEmpty,
  isObservable,
  last,
  lastValueFrom,
  map,
  mapTo,
  materialize,
  max,
  merge,
  mergeAll,
  mergeMap,
  mergeMapTo,
  mergeScan,
  mergeWith,
  min,
  multicast,
  never,
  noop,
  observable,
  observeOn,
  of,
  onErrorResumeNext,
  onErrorResumeNextWith,
  pairs,
  pairwise,
  partition,
  pipe,
  pluck,
  publish,
  publishBehavior,
  publishLast,
  publishReplay,
  queue,
  queueScheduler,
  race,
  raceWith,
  range,
  reduce,
  refCount,
  repeat,
  repeatWhen,
  retry,
  retryWhen,
  sample,
  sampleTime,
  scan,
  scheduled,
  sequenceEqual,
  share,
  shareReplay,
  single,
  skip,
  skipLast,
  skipUntil,
  skipWhile,
  startWith,
  subscribeOn,
  switchAll,
  switchMap,
  switchMapTo,
  switchScan,
  take,
  takeLast,
  takeUntil,
  takeWhile,
  tap,
  throttle,
  throttleTime,
  throwError,
  throwIfEmpty,
  timeInterval,
  timeout,
  timeoutWith,
  timer,
  timestamp,
  toArray,
  using,
  window,
  windowCount,
  windowTime,
  windowToggle,
  windowWhen,
  withLatestFrom,
  zip,
  zipAll,
  zipWith
};

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/package.json
```json
{
  "type": "module"
}

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/chunk-6Q4RANH6.js
```typescript
import {
  __read,
  __spreadArray,
  argsOrArgArray,
  filter,
  not,
  raceWith
} from "./chunk-CXCX2JKZ.js";

// node_modules/rxjs/dist/esm5/internal/operators/partition.js
function partition(predicate, thisArg) {
  return function(source) {
    return [filter(predicate, thisArg)(source), filter(not(predicate, thisArg))(source)];
  };
}

// node_modules/rxjs/dist/esm5/internal/operators/race.js
function race() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  return raceWith.apply(void 0, __spreadArray([], __read(argsOrArgArray(args))));
}

export {
  partition,
  race
};
//# sourceMappingURL=chunk-6Q4RANH6.js.map

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/chunk-257AE5XC.js
```typescript
import {
  DOCUMENT,
  XhrFactory,
  isPlatformServer,
  parseCookieValue
} from "./chunk-KJ2FTQNQ.js";
import {
  APP_BOOTSTRAP_LISTENER,
  ApplicationRef,
  Console,
  DestroyRef,
  EnvironmentInjector,
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  NgModule,
  NgZone,
  PLATFORM_ID,
  PendingTasksInternal,
  ResourceImpl,
  ResourceStatus,
  RuntimeError,
  TransferState,
  assertInInjectionContext,
  computed,
  formatRuntimeError,
  inject,
  linkedSignal,
  makeEnvironmentProviders,
  makeStateKey,
  performanceMarkFeature,
  runInInjectionContext,
  setClassMetadata,
  signal,
  truncateMiddle,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵinject
} from "./chunk-EP22WXWE.js";
import {
  Observable,
  __async,
  __objRest,
  __spreadValues,
  concatMap,
  filter,
  finalize,
  from,
  map,
  of,
  switchMap,
  tap
} from "./chunk-CXCX2JKZ.js";

// node_modules/@angular/common/fesm2022/module-JS82OH2B.mjs
var HttpHandler = class {
};
var HttpBackend = class {
};
var HttpHeaders = class _HttpHeaders {
  /**
   * Internal map of lowercase header names to values.
   */
  headers;
  /**
   * Internal map of lowercased header names to the normalized
   * form of the name (the form seen first).
   */
  normalizedNames = /* @__PURE__ */ new Map();
  /**
   * Complete the lazy initialization of this object (needed before reading).
   */
  lazyInit;
  /**
   * Queued updates to be materialized the next initialization.
   */
  lazyUpdate = null;
  /**  Constructs a new HTTP header object with the given values.*/
  constructor(headers) {
    if (!headers) {
      this.headers = /* @__PURE__ */ new Map();
    } else if (typeof headers === "string") {
      this.lazyInit = () => {
        this.headers = /* @__PURE__ */ new Map();
        headers.split("\n").forEach((line) => {
          const index = line.indexOf(":");
          if (index > 0) {
            const name = line.slice(0, index);
            const value = line.slice(index + 1).trim();
            this.addHeaderEntry(name, value);
          }
        });
      };
    } else if (typeof Headers !== "undefined" && headers instanceof Headers) {
      this.headers = /* @__PURE__ */ new Map();
      headers.forEach((value, name) => {
        this.addHeaderEntry(name, value);
      });
    } else {
      this.lazyInit = () => {
        if (typeof ngDevMode === "undefined" || ngDevMode) {
          assertValidHeaders(headers);
        }
        this.headers = /* @__PURE__ */ new Map();
        Object.entries(headers).forEach(([name, values]) => {
          this.setHeaderEntries(name, values);
        });
      };
    }
  }
  /**
   * Checks for existence of a given header.
   *
   * @param name The header name to check for existence.
   *
   * @returns True if the header exists, false otherwise.
   */
  has(name) {
    this.init();
    return this.headers.has(name.toLowerCase());
  }
  /**
   * Retrieves the first value of a given header.
   *
   * @param name The header name.
   *
   * @returns The value string if the header exists, null otherwise
   */
  get(name) {
    this.init();
    const values = this.headers.get(name.toLowerCase());
    return values && values.length > 0 ? values[0] : null;
  }
  /**
   * Retrieves the names of the headers.
   *
   * @returns A list of header names.
   */
  keys() {
    this.init();
    return Array.from(this.normalizedNames.values());
  }
  /**
   * Retrieves a list of values for a given header.
   *
   * @param name The header name from which to retrieve values.
   *
   * @returns A string of values if the header exists, null otherwise.
   */
  getAll(name) {
    this.init();
    return this.headers.get(name.toLowerCase()) || null;
  }
  /**
   * Appends a new value to the existing set of values for a header
   * and returns them in a clone of the original instance.
   *
   * @param name The header name for which to append the values.
   * @param value The value to append.
   *
   * @returns A clone of the HTTP headers object with the value appended to the given header.
   */
  append(name, value) {
    return this.clone({
      name,
      value,
      op: "a"
    });
  }
  /**
   * Sets or modifies a value for a given header in a clone of the original instance.
   * If the header already exists, its value is replaced with the given value
   * in the returned object.
   *
   * @param name The header name.
   * @param value The value or values to set or override for the given header.
   *
   * @returns A clone of the HTTP headers object with the newly set header value.
   */
  set(name, value) {
    return this.clone({
      name,
      value,
      op: "s"
    });
  }
  /**
   * Deletes values for a given header in a clone of the original instance.
   *
   * @param name The header name.
   * @param value The value or values to delete for the given header.
   *
   * @returns A clone of the HTTP headers object with the given value deleted.
   */
  delete(name, value) {
    return this.clone({
      name,
      value,
      op: "d"
    });
  }
  maybeSetNormalizedName(name, lcName) {
    if (!this.normalizedNames.has(lcName)) {
      this.normalizedNames.set(lcName, name);
    }
  }
  init() {
    if (!!this.lazyInit) {
      if (this.lazyInit instanceof _HttpHeaders) {
        this.copyFrom(this.lazyInit);
      } else {
        this.lazyInit();
      }
      this.lazyInit = null;
      if (!!this.lazyUpdate) {
        this.lazyUpdate.forEach((update) => this.applyUpdate(update));
        this.lazyUpdate = null;
      }
    }
  }
  copyFrom(other) {
    other.init();
    Array.from(other.headers.keys()).forEach((key) => {
      this.headers.set(key, other.headers.get(key));
      this.normalizedNames.set(key, other.normalizedNames.get(key));
    });
  }
  clone(update) {
    const clone = new _HttpHeaders();
    clone.lazyInit = !!this.lazyInit && this.lazyInit instanceof _HttpHeaders ? this.lazyInit : this;
    clone.lazyUpdate = (this.lazyUpdate || []).concat([update]);
    return clone;
  }
  applyUpdate(update) {
    const key = update.name.toLowerCase();
    switch (update.op) {
      case "a":
      case "s":
        let value = update.value;
        if (typeof value === "string") {
          value = [value];
        }
        if (value.length === 0) {
          return;
        }
        this.maybeSetNormalizedName(update.name, key);
        const base = (update.op === "a" ? this.headers.get(key) : void 0) || [];
        base.push(...value);
        this.headers.set(key, base);
        break;
      case "d":
        const toDelete = update.value;
        if (!toDelete) {
          this.headers.delete(key);
          this.normalizedNames.delete(key);
        } else {
          let existing = this.headers.get(key);
          if (!existing) {
            return;
          }
          existing = existing.filter((value2) => toDelete.indexOf(value2) === -1);
          if (existing.length === 0) {
            this.headers.delete(key);
            this.normalizedNames.delete(key);
          } else {
            this.headers.set(key, existing);
          }
        }
        break;
    }
  }
  addHeaderEntry(name, value) {
    const key = name.toLowerCase();
    this.maybeSetNormalizedName(name, key);
    if (this.headers.has(key)) {
      this.headers.get(key).push(value);
    } else {
      this.headers.set(key, [value]);
    }
  }
  setHeaderEntries(name, values) {
    const headerValues = (Array.isArray(values) ? values : [values]).map((value) => value.toString());
    const key = name.toLowerCase();
    this.headers.set(key, headerValues);
    this.maybeSetNormalizedName(name, key);
  }
  /**
   * @internal
   */
  forEach(fn) {
    this.init();
    Array.from(this.normalizedNames.keys()).forEach((key) => fn(this.normalizedNames.get(key), this.headers.get(key)));
  }
};
function assertValidHeaders(headers) {
  for (const [key, value] of Object.entries(headers)) {
    if (!(typeof value === "string" || typeof value === "number") && !Array.isArray(value)) {
      throw new Error(`Unexpected value of the \`${key}\` header provided. Expecting either a string, a number or an array, but got: \`${value}\`.`);
    }
  }
}
var HttpUrlEncodingCodec = class {
  /**
   * Encodes a key name for a URL parameter or query-string.
   * @param key The key name.
   * @returns The encoded key name.
   */
  encodeKey(key) {
    return standardEncoding(key);
  }
  /**
   * Encodes the value of a URL parameter or query-string.
   * @param value The value.
   * @returns The encoded value.
   */
  encodeValue(value) {
    return standardEncoding(value);
  }
  /**
   * Decodes an encoded URL parameter or query-string key.
   * @param key The encoded key name.
   * @returns The decoded key name.
   */
  decodeKey(key) {
    return decodeURIComponent(key);
  }
  /**
   * Decodes an encoded URL parameter or query-string value.
   * @param value The encoded value.
   * @returns The decoded value.
   */
  decodeValue(value) {
    return decodeURIComponent(value);
  }
};
function paramParser(rawParams, codec) {
  const map2 = /* @__PURE__ */ new Map();
  if (rawParams.length > 0) {
    const params = rawParams.replace(/^\?/, "").split("&");
    params.forEach((param) => {
      const eqIdx = param.indexOf("=");
      const [key, val] = eqIdx == -1 ? [codec.decodeKey(param), ""] : [codec.decodeKey(param.slice(0, eqIdx)), codec.decodeValue(param.slice(eqIdx + 1))];
      const list = map2.get(key) || [];
      list.push(val);
      map2.set(key, list);
    });
  }
  return map2;
}
var STANDARD_ENCODING_REGEX = /%(\d[a-f0-9])/gi;
var STANDARD_ENCODING_REPLACEMENTS = {
  "40": "@",
  "3A": ":",
  "24": "$",
  "2C": ",",
  "3B": ";",
  "3D": "=",
  "3F": "?",
  "2F": "/"
};
function standardEncoding(v) {
  return encodeURIComponent(v).replace(STANDARD_ENCODING_REGEX, (s, t) => STANDARD_ENCODING_REPLACEMENTS[t] ?? s);
}
function valueToString(value) {
  return `${value}`;
}
var HttpParams = class _HttpParams {
  map;
  encoder;
  updates = null;
  cloneFrom = null;
  constructor(options = {}) {
    this.encoder = options.encoder || new HttpUrlEncodingCodec();
    if (options.fromString) {
      if (options.fromObject) {
        throw new RuntimeError(2805, ngDevMode && "Cannot specify both fromString and fromObject.");
      }
      this.map = paramParser(options.fromString, this.encoder);
    } else if (!!options.fromObject) {
      this.map = /* @__PURE__ */ new Map();
      Object.keys(options.fromObject).forEach((key) => {
        const value = options.fromObject[key];
        const values = Array.isArray(value) ? value.map(valueToString) : [valueToString(value)];
        this.map.set(key, values);
      });
    } else {
      this.map = null;
    }
  }
  /**
   * Reports whether the body includes one or more values for a given parameter.
   * @param param The parameter name.
   * @returns True if the parameter has one or more values,
   * false if it has no value or is not present.
   */
  has(param) {
    this.init();
    return this.map.has(param);
  }
  /**
   * Retrieves the first value for a parameter.
   * @param param The parameter name.
   * @returns The first value of the given parameter,
   * or `null` if the parameter is not present.
   */
  get(param) {
    this.init();
    const res = this.map.get(param);
    return !!res ? res[0] : null;
  }
  /**
   * Retrieves all values for a  parameter.
   * @param param The parameter name.
   * @returns All values in a string array,
   * or `null` if the parameter not present.
   */
  getAll(param) {
    this.init();
    return this.map.get(param) || null;
  }
  /**
   * Retrieves all the parameters for this body.
   * @returns The parameter names in a string array.
   */
  keys() {
    this.init();
    return Array.from(this.map.keys());
  }
  /**
   * Appends a new value to existing values for a parameter.
   * @param param The parameter name.
   * @param value The new value to add.
   * @return A new body with the appended value.
   */
  append(param, value) {
    return this.clone({
      param,
      value,
      op: "a"
    });
  }
  /**
   * Constructs a new body with appended values for the given parameter name.
   * @param params parameters and values
   * @return A new body with the new value.
   */
  appendAll(params) {
    const updates = [];
    Object.keys(params).forEach((param) => {
      const value = params[param];
      if (Array.isArray(value)) {
        value.forEach((_value) => {
          updates.push({
            param,
            value: _value,
            op: "a"
          });
        });
      } else {
        updates.push({
          param,
          value,
          op: "a"
        });
      }
    });
    return this.clone(updates);
  }
  /**
   * Replaces the value for a parameter.
   * @param param The parameter name.
   * @param value The new value.
   * @return A new body with the new value.
   */
  set(param, value) {
    return this.clone({
      param,
      value,
      op: "s"
    });
  }
  /**
   * Removes a given value or all values from a parameter.
   * @param param The parameter name.
   * @param value The value to remove, if provided.
   * @return A new body with the given value removed, or with all values
   * removed if no value is specified.
   */
  delete(param, value) {
    return this.clone({
      param,
      value,
      op: "d"
    });
  }
  /**
   * Serializes the body to an encoded string, where key-value pairs (separated by `=`) are
   * separated by `&`s.
   */
  toString() {
    this.init();
    return this.keys().map((key) => {
      const eKey = this.encoder.encodeKey(key);
      return this.map.get(key).map((value) => eKey + "=" + this.encoder.encodeValue(value)).join("&");
    }).filter((param) => param !== "").join("&");
  }
  clone(update) {
    const clone = new _HttpParams({
      encoder: this.encoder
    });
    clone.cloneFrom = this.cloneFrom || this;
    clone.updates = (this.updates || []).concat(update);
    return clone;
  }
  init() {
    if (this.map === null) {
      this.map = /* @__PURE__ */ new Map();
    }
    if (this.cloneFrom !== null) {
      this.cloneFrom.init();
      this.cloneFrom.keys().forEach((key) => this.map.set(key, this.cloneFrom.map.get(key)));
      this.updates.forEach((update) => {
        switch (update.op) {
          case "a":
          case "s":
            const base = (update.op === "a" ? this.map.get(update.param) : void 0) || [];
            base.push(valueToString(update.value));
            this.map.set(update.param, base);
            break;
          case "d":
            if (update.value !== void 0) {
              let base2 = this.map.get(update.param) || [];
              const idx = base2.indexOf(valueToString(update.value));
              if (idx !== -1) {
                base2.splice(idx, 1);
              }
              if (base2.length > 0) {
                this.map.set(update.param, base2);
              } else {
                this.map.delete(update.param);
              }
            } else {
              this.map.delete(update.param);
              break;
            }
        }
      });
      this.cloneFrom = this.updates = null;
    }
  }
};
var HttpContextToken = class {
  defaultValue;
  constructor(defaultValue) {
    this.defaultValue = defaultValue;
  }
};
var HttpContext = class {
  map = /* @__PURE__ */ new Map();
  /**
   * Store a value in the context. If a value is already present it will be overwritten.
   *
   * @param token The reference to an instance of `HttpContextToken`.
   * @param value The value to store.
   *
   * @returns A reference to itself for easy chaining.
   */
  set(token, value) {
    this.map.set(token, value);
    return this;
  }
  /**
   * Retrieve the value associated with the given token.
   *
   * @param token The reference to an instance of `HttpContextToken`.
   *
   * @returns The stored value or default if one is defined.
   */
  get(token) {
    if (!this.map.has(token)) {
      this.map.set(token, token.defaultValue());
    }
    return this.map.get(token);
  }
  /**
   * Delete the value associated with the given token.
   *
   * @param token The reference to an instance of `HttpContextToken`.
   *
   * @returns A reference to itself for easy chaining.
   */
  delete(token) {
    this.map.delete(token);
    return this;
  }
  /**
   * Checks for existence of a given token.
   *
   * @param token The reference to an instance of `HttpContextToken`.
   *
   * @returns True if the token exists, false otherwise.
   */
  has(token) {
    return this.map.has(token);
  }
  /**
   * @returns a list of tokens currently stored in the context.
   */
  keys() {
    return this.map.keys();
  }
};
function mightHaveBody(method) {
  switch (method) {
    case "DELETE":
    case "GET":
    case "HEAD":
    case "OPTIONS":
    case "JSONP":
      return false;
    default:
      return true;
  }
}
function isArrayBuffer(value) {
  return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}
function isBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}
function isFormData(value) {
  return typeof FormData !== "undefined" && value instanceof FormData;
}
function isUrlSearchParams(value) {
  return typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams;
}
var CONTENT_TYPE_HEADER = "Content-Type";
var ACCEPT_HEADER = "Accept";
var X_REQUEST_URL_HEADER = "X-Request-URL";
var TEXT_CONTENT_TYPE = "text/plain";
var JSON_CONTENT_TYPE = "application/json";
var ACCEPT_HEADER_VALUE = `${JSON_CONTENT_TYPE}, ${TEXT_CONTENT_TYPE}, */*`;
var HttpRequest = class _HttpRequest {
  url;
  /**
   * The request body, or `null` if one isn't set.
   *
   * Bodies are not enforced to be immutable, as they can include a reference to any
   * user-defined data type. However, interceptors should take care to preserve
   * idempotence by treating them as such.
   */
  body = null;
  /**
   * Outgoing headers for this request.
   */
  headers;
  /**
   * Shared and mutable context that can be used by interceptors
   */
  context;
  /**
   * Whether this request should be made in a way that exposes progress events.
   *
   * Progress events are expensive (change detection runs on each event) and so
   * they should only be requested if the consumer intends to monitor them.
   *
   * Note: The `FetchBackend` doesn't support progress report on uploads.
   */
  reportProgress = false;
  /**
   * Whether this request should be sent with outgoing credentials (cookies).
   */
  withCredentials = false;
  /**
   * The expected response type of the server.
   *
   * This is used to parse the response appropriately before returning it to
   * the requestee.
   */
  responseType = "json";
  /**
   * The outgoing HTTP request method.
   */
  method;
  /**
   * Outgoing URL parameters.
   *
   * To pass a string representation of HTTP parameters in the URL-query-string format,
   * the `HttpParamsOptions`' `fromString` may be used. For example:
   *
   * ```ts
   * new HttpParams({fromString: 'angular=awesome'})
   * ```
   */
  params;
  /**
   * The outgoing URL with all URL parameters set.
   */
  urlWithParams;
  /**
   * The HttpTransferCache option for the request
   */
  transferCache;
  constructor(method, url, third, fourth) {
    this.url = url;
    this.method = method.toUpperCase();
    let options;
    if (mightHaveBody(this.method) || !!fourth) {
      this.body = third !== void 0 ? third : null;
      options = fourth;
    } else {
      options = third;
    }
    if (options) {
      this.reportProgress = !!options.reportProgress;
      this.withCredentials = !!options.withCredentials;
      if (!!options.responseType) {
        this.responseType = options.responseType;
      }
      if (!!options.headers) {
        this.headers = options.headers;
      }
      if (!!options.context) {
        this.context = options.context;
      }
      if (!!options.params) {
        this.params = options.params;
      }
      this.transferCache = options.transferCache;
    }
    this.headers ??= new HttpHeaders();
    this.context ??= new HttpContext();
    if (!this.params) {
      this.params = new HttpParams();
      this.urlWithParams = url;
    } else {
      const params = this.params.toString();
      if (params.length === 0) {
        this.urlWithParams = url;
      } else {
        const qIdx = url.indexOf("?");
        const sep = qIdx === -1 ? "?" : qIdx < url.length - 1 ? "&" : "";
        this.urlWithParams = url + sep + params;
      }
    }
  }
  /**
   * Transform the free-form body into a serialized format suitable for
   * transmission to the server.
   */
  serializeBody() {
    if (this.body === null) {
      return null;
    }
    if (typeof this.body === "string" || isArrayBuffer(this.body) || isBlob(this.body) || isFormData(this.body) || isUrlSearchParams(this.body)) {
      return this.body;
    }
    if (this.body instanceof HttpParams) {
      return this.body.toString();
    }
    if (typeof this.body === "object" || typeof this.body === "boolean" || Array.isArray(this.body)) {
      return JSON.stringify(this.body);
    }
    return this.body.toString();
  }
  /**
   * Examine the body and attempt to infer an appropriate MIME type
   * for it.
   *
   * If no such type can be inferred, this method will return `null`.
   */
  detectContentTypeHeader() {
    if (this.body === null) {
      return null;
    }
    if (isFormData(this.body)) {
      return null;
    }
    if (isBlob(this.body)) {
      return this.body.type || null;
    }
    if (isArrayBuffer(this.body)) {
      return null;
    }
    if (typeof this.body === "string") {
      return TEXT_CONTENT_TYPE;
    }
    if (this.body instanceof HttpParams) {
      return "application/x-www-form-urlencoded;charset=UTF-8";
    }
    if (typeof this.body === "object" || typeof this.body === "number" || typeof this.body === "boolean") {
      return JSON_CONTENT_TYPE;
    }
    return null;
  }
  clone(update = {}) {
    const method = update.method || this.method;
    const url = update.url || this.url;
    const responseType = update.responseType || this.responseType;
    const transferCache = update.transferCache ?? this.transferCache;
    const body = update.body !== void 0 ? update.body : this.body;
    const withCredentials = update.withCredentials ?? this.withCredentials;
    const reportProgress = update.reportProgress ?? this.reportProgress;
    let headers = update.headers || this.headers;
    let params = update.params || this.params;
    const context = update.context ?? this.context;
    if (update.setHeaders !== void 0) {
      headers = Object.keys(update.setHeaders).reduce((headers2, name) => headers2.set(name, update.setHeaders[name]), headers);
    }
    if (update.setParams) {
      params = Object.keys(update.setParams).reduce((params2, param) => params2.set(param, update.setParams[param]), params);
    }
    return new _HttpRequest(method, url, body, {
      params,
      headers,
      context,
      reportProgress,
      responseType,
      withCredentials,
      transferCache
    });
  }
};
var HttpEventType;
(function(HttpEventType2) {
  HttpEventType2[HttpEventType2["Sent"] = 0] = "Sent";
  HttpEventType2[HttpEventType2["UploadProgress"] = 1] = "UploadProgress";
  HttpEventType2[HttpEventType2["ResponseHeader"] = 2] = "ResponseHeader";
  HttpEventType2[HttpEventType2["DownloadProgress"] = 3] = "DownloadProgress";
  HttpEventType2[HttpEventType2["Response"] = 4] = "Response";
  HttpEventType2[HttpEventType2["User"] = 5] = "User";
})(HttpEventType || (HttpEventType = {}));
var HttpResponseBase = class {
  /**
   * All response headers.
   */
  headers;
  /**
   * Response status code.
   */
  status;
  /**
   * Textual description of response status code, defaults to OK.
   *
   * Do not depend on this.
   */
  statusText;
  /**
   * URL of the resource retrieved, or null if not available.
   */
  url;
  /**
   * Whether the status code falls in the 2xx range.
   */
  ok;
  /**
   * Type of the response, narrowed to either the full response or the header.
   */
  type;
  /**
   * Super-constructor for all responses.
   *
   * The single parameter accepted is an initialization hash. Any properties
   * of the response passed there will override the default values.
   */
  constructor(init, defaultStatus = 200, defaultStatusText = "OK") {
    this.headers = init.headers || new HttpHeaders();
    this.status = init.status !== void 0 ? init.status : defaultStatus;
    this.statusText = init.statusText || defaultStatusText;
    this.url = init.url || null;
    this.ok = this.status >= 200 && this.status < 300;
  }
};
var HttpHeaderResponse = class _HttpHeaderResponse extends HttpResponseBase {
  /**
   * Create a new `HttpHeaderResponse` with the given parameters.
   */
  constructor(init = {}) {
    super(init);
  }
  type = HttpEventType.ResponseHeader;
  /**
   * Copy this `HttpHeaderResponse`, overriding its contents with the
   * given parameter hash.
   */
  clone(update = {}) {
    return new _HttpHeaderResponse({
      headers: update.headers || this.headers,
      status: update.status !== void 0 ? update.status : this.status,
      statusText: update.statusText || this.statusText,
      url: update.url || this.url || void 0
    });
  }
};
var HttpResponse = class _HttpResponse extends HttpResponseBase {
  /**
   * The response body, or `null` if one was not returned.
   */
  body;
  /**
   * Construct a new `HttpResponse`.
   */
  constructor(init = {}) {
    super(init);
    this.body = init.body !== void 0 ? init.body : null;
  }
  type = HttpEventType.Response;
  clone(update = {}) {
    return new _HttpResponse({
      body: update.body !== void 0 ? update.body : this.body,
      headers: update.headers || this.headers,
      status: update.status !== void 0 ? update.status : this.status,
      statusText: update.statusText || this.statusText,
      url: update.url || this.url || void 0
    });
  }
};
var HttpErrorResponse = class extends HttpResponseBase {
  name = "HttpErrorResponse";
  message;
  error;
  /**
   * Errors are never okay, even when the status code is in the 2xx success range.
   */
  ok = false;
  constructor(init) {
    super(init, 0, "Unknown Error");
    if (this.status >= 200 && this.status < 300) {
      this.message = `Http failure during parsing for ${init.url || "(unknown url)"}`;
    } else {
      this.message = `Http failure response for ${init.url || "(unknown url)"}: ${init.status} ${init.statusText}`;
    }
    this.error = init.error || null;
  }
};
var HTTP_STATUS_CODE_OK = 200;
var HTTP_STATUS_CODE_NO_CONTENT = 204;
var HttpStatusCode;
(function(HttpStatusCode2) {
  HttpStatusCode2[HttpStatusCode2["Continue"] = 100] = "Continue";
  HttpStatusCode2[HttpStatusCode2["SwitchingProtocols"] = 101] = "SwitchingProtocols";
  HttpStatusCode2[HttpStatusCode2["Processing"] = 102] = "Processing";
  HttpStatusCode2[HttpStatusCode2["EarlyHints"] = 103] = "EarlyHints";
  HttpStatusCode2[HttpStatusCode2["Ok"] = 200] = "Ok";
  HttpStatusCode2[HttpStatusCode2["Created"] = 201] = "Created";
  HttpStatusCode2[HttpStatusCode2["Accepted"] = 202] = "Accepted";
  HttpStatusCode2[HttpStatusCode2["NonAuthoritativeInformation"] = 203] = "NonAuthoritativeInformation";
  HttpStatusCode2[HttpStatusCode2["NoContent"] = 204] = "NoContent";
  HttpStatusCode2[HttpStatusCode2["ResetContent"] = 205] = "ResetContent";
  HttpStatusCode2[HttpStatusCode2["PartialContent"] = 206] = "PartialContent";
  HttpStatusCode2[HttpStatusCode2["MultiStatus"] = 207] = "MultiStatus";
  HttpStatusCode2[HttpStatusCode2["AlreadyReported"] = 208] = "AlreadyReported";
  HttpStatusCode2[HttpStatusCode2["ImUsed"] = 226] = "ImUsed";
  HttpStatusCode2[HttpStatusCode2["MultipleChoices"] = 300] = "MultipleChoices";
  HttpStatusCode2[HttpStatusCode2["MovedPermanently"] = 301] = "MovedPermanently";
  HttpStatusCode2[HttpStatusCode2["Found"] = 302] = "Found";
  HttpStatusCode2[HttpStatusCode2["SeeOther"] = 303] = "SeeOther";
  HttpStatusCode2[HttpStatusCode2["NotModified"] = 304] = "NotModified";
  HttpStatusCode2[HttpStatusCode2["UseProxy"] = 305] = "UseProxy";
  HttpStatusCode2[HttpStatusCode2["Unused"] = 306] = "Unused";
  HttpStatusCode2[HttpStatusCode2["TemporaryRedirect"] = 307] = "TemporaryRedirect";
  HttpStatusCode2[HttpStatusCode2["PermanentRedirect"] = 308] = "PermanentRedirect";
  HttpStatusCode2[HttpStatusCode2["BadRequest"] = 400] = "BadRequest";
  HttpStatusCode2[HttpStatusCode2["Unauthorized"] = 401] = "Unauthorized";
  HttpStatusCode2[HttpStatusCode2["PaymentRequired"] = 402] = "PaymentRequired";
  HttpStatusCode2[HttpStatusCode2["Forbidden"] = 403] = "Forbidden";
  HttpStatusCode2[HttpStatusCode2["NotFound"] = 404] = "NotFound";
  HttpStatusCode2[HttpStatusCode2["MethodNotAllowed"] = 405] = "MethodNotAllowed";
  HttpStatusCode2[HttpStatusCode2["NotAcceptable"] = 406] = "NotAcceptable";
  HttpStatusCode2[HttpStatusCode2["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
  HttpStatusCode2[HttpStatusCode2["RequestTimeout"] = 408] = "RequestTimeout";
  HttpStatusCode2[HttpStatusCode2["Conflict"] = 409] = "Conflict";
  HttpStatusCode2[HttpStatusCode2["Gone"] = 410] = "Gone";
  HttpStatusCode2[HttpStatusCode2["LengthRequired"] = 411] = "LengthRequired";
  HttpStatusCode2[HttpStatusCode2["PreconditionFailed"] = 412] = "PreconditionFailed";
  HttpStatusCode2[HttpStatusCode2["PayloadTooLarge"] = 413] = "PayloadTooLarge";
  HttpStatusCode2[HttpStatusCode2["UriTooLong"] = 414] = "UriTooLong";
  HttpStatusCode2[HttpStatusCode2["UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
  HttpStatusCode2[HttpStatusCode2["RangeNotSatisfiable"] = 416] = "RangeNotSatisfiable";
  HttpStatusCode2[HttpStatusCode2["ExpectationFailed"] = 417] = "ExpectationFailed";
  HttpStatusCode2[HttpStatusCode2["ImATeapot"] = 418] = "ImATeapot";
  HttpStatusCode2[HttpStatusCode2["MisdirectedRequest"] = 421] = "MisdirectedRequest";
  HttpStatusCode2[HttpStatusCode2["UnprocessableEntity"] = 422] = "UnprocessableEntity";
  HttpStatusCode2[HttpStatusCode2["Locked"] = 423] = "Locked";
  HttpStatusCode2[HttpStatusCode2["FailedDependency"] = 424] = "FailedDependency";
  HttpStatusCode2[HttpStatusCode2["TooEarly"] = 425] = "TooEarly";
  HttpStatusCode2[HttpStatusCode2["UpgradeRequired"] = 426] = "UpgradeRequired";
  HttpStatusCode2[HttpStatusCode2["PreconditionRequired"] = 428] = "PreconditionRequired";
  HttpStatusCode2[HttpStatusCode2["TooManyRequests"] = 429] = "TooManyRequests";
  HttpStatusCode2[HttpStatusCode2["RequestHeaderFieldsTooLarge"] = 431] = "RequestHeaderFieldsTooLarge";
  HttpStatusCode2[HttpStatusCode2["UnavailableForLegalReasons"] = 451] = "UnavailableForLegalReasons";
  HttpStatusCode2[HttpStatusCode2["InternalServerError"] = 500] = "InternalServerError";
  HttpStatusCode2[HttpStatusCode2["NotImplemented"] = 501] = "NotImplemented";
  HttpStatusCode2[HttpStatusCode2["BadGateway"] = 502] = "BadGateway";
  HttpStatusCode2[HttpStatusCode2["ServiceUnavailable"] = 503] = "ServiceUnavailable";
  HttpStatusCode2[HttpStatusCode2["GatewayTimeout"] = 504] = "GatewayTimeout";
  HttpStatusCode2[HttpStatusCode2["HttpVersionNotSupported"] = 505] = "HttpVersionNotSupported";
  HttpStatusCode2[HttpStatusCode2["VariantAlsoNegotiates"] = 506] = "VariantAlsoNegotiates";
  HttpStatusCode2[HttpStatusCode2["InsufficientStorage"] = 507] = "InsufficientStorage";
  HttpStatusCode2[HttpStatusCode2["LoopDetected"] = 508] = "LoopDetected";
  HttpStatusCode2[HttpStatusCode2["NotExtended"] = 510] = "NotExtended";
  HttpStatusCode2[HttpStatusCode2["NetworkAuthenticationRequired"] = 511] = "NetworkAuthenticationRequired";
})(HttpStatusCode || (HttpStatusCode = {}));
function addBody(options, body) {
  return {
    body,
    headers: options.headers,
    context: options.context,
    observe: options.observe,
    params: options.params,
    reportProgress: options.reportProgress,
    responseType: options.responseType,
    withCredentials: options.withCredentials,
    transferCache: options.transferCache
  };
}
var HttpClient = class _HttpClient {
  handler;
  constructor(handler) {
    this.handler = handler;
  }
  /**
   * Constructs an observable for a generic HTTP request that, when subscribed,
   * fires the request through the chain of registered interceptors and on to the
   * server.
   *
   * You can pass an `HttpRequest` directly as the only parameter. In this case,
   * the call returns an observable of the raw `HttpEvent` stream.
   *
   * Alternatively you can pass an HTTP method as the first parameter,
   * a URL string as the second, and an options hash containing the request body as the third.
   * See `addBody()`. In this case, the specified `responseType` and `observe` options determine the
   * type of returned observable.
   *   * The `responseType` value determines how a successful response body is parsed.
   *   * If `responseType` is the default `json`, you can pass a type interface for the resulting
   * object as a type parameter to the call.
   *
   * The `observe` value determines the return type, according to what you are interested in
   * observing.
   *   * An `observe` value of events returns an observable of the raw `HttpEvent` stream, including
   * progress events by default.
   *   * An `observe` value of response returns an observable of `HttpResponse<T>`,
   * where the `T` parameter depends on the `responseType` and any optionally provided type
   * parameter.
   *   * An `observe` value of body returns an observable of `<T>` with the same `T` body type.
   *
   */
  request(first, url, options = {}) {
    let req;
    if (first instanceof HttpRequest) {
      req = first;
    } else {
      let headers = void 0;
      if (options.headers instanceof HttpHeaders) {
        headers = options.headers;
      } else {
        headers = new HttpHeaders(options.headers);
      }
      let params = void 0;
      if (!!options.params) {
        if (options.params instanceof HttpParams) {
          params = options.params;
        } else {
          params = new HttpParams({
            fromObject: options.params
          });
        }
      }
      req = new HttpRequest(first, url, options.body !== void 0 ? options.body : null, {
        headers,
        context: options.context,
        params,
        reportProgress: options.reportProgress,
        // By default, JSON is assumed to be returned for all calls.
        responseType: options.responseType || "json",
        withCredentials: options.withCredentials,
        transferCache: options.transferCache
      });
    }
    const events$ = of(req).pipe(concatMap((req2) => this.handler.handle(req2)));
    if (first instanceof HttpRequest || options.observe === "events") {
      return events$;
    }
    const res$ = events$.pipe(filter((event) => event instanceof HttpResponse));
    switch (options.observe || "body") {
      case "body":
        switch (req.responseType) {
          case "arraybuffer":
            return res$.pipe(map((res) => {
              if (res.body !== null && !(res.body instanceof ArrayBuffer)) {
                throw new RuntimeError(2806, ngDevMode && "Response is not an ArrayBuffer.");
              }
              return res.body;
            }));
          case "blob":
            return res$.pipe(map((res) => {
              if (res.body !== null && !(res.body instanceof Blob)) {
                throw new RuntimeError(2807, ngDevMode && "Response is not a Blob.");
              }
              return res.body;
            }));
          case "text":
            return res$.pipe(map((res) => {
              if (res.body !== null && typeof res.body !== "string") {
                throw new RuntimeError(2808, ngDevMode && "Response is not a string.");
              }
              return res.body;
            }));
          case "json":
          default:
            return res$.pipe(map((res) => res.body));
        }
      case "response":
        return res$;
      default:
        throw new RuntimeError(2809, ngDevMode && `Unreachable: unhandled observe type ${options.observe}}`);
    }
  }
  /**
   * Constructs an observable that, when subscribed, causes the configured
   * `DELETE` request to execute on the server. See the individual overloads for
   * details on the return type.
   *
   * @param url     The endpoint URL.
   * @param options The HTTP options to send with the request.
   *
   */
  delete(url, options = {}) {
    return this.request("DELETE", url, options);
  }
  /**
   * Constructs an observable that, when subscribed, causes the configured
   * `GET` request to execute on the server. See the individual overloads for
   * details on the return type.
   */
  get(url, options = {}) {
    return this.request("GET", url, options);
  }
  /**
   * Constructs an observable that, when subscribed, causes the configured
   * `HEAD` request to execute on the server. The `HEAD` method returns
   * meta information about the resource without transferring the
   * resource itself. See the individual overloads for
   * details on the return type.
   */
  head(url, options = {}) {
    return this.request("HEAD", url, options);
  }
  /**
   * Constructs an `Observable` that, when subscribed, causes a request with the special method
   * `JSONP` to be dispatched via the interceptor pipeline.
   * The [JSONP pattern](https://en.wikipedia.org/wiki/JSONP) works around limitations of certain
   * API endpoints that don't support newer,
   * and preferable [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) protocol.
   * JSONP treats the endpoint API as a JavaScript file and tricks the browser to process the
   * requests even if the API endpoint is not located on the same domain (origin) as the client-side
   * application making the request.
   * The endpoint API must support JSONP callback for JSONP requests to work.
   * The resource API returns the JSON response wrapped in a callback function.
   * You can pass the callback function name as one of the query parameters.
   * Note that JSONP requests can only be used with `GET` requests.
   *
   * @param url The resource URL.
   * @param callbackParam The callback function name.
   *
   */
  jsonp(url, callbackParam) {
    return this.request("JSONP", url, {
      params: new HttpParams().append(callbackParam, "JSONP_CALLBACK"),
      observe: "body",
      responseType: "json"
    });
  }
  /**
   * Constructs an `Observable` that, when subscribed, causes the configured
   * `OPTIONS` request to execute on the server. This method allows the client
   * to determine the supported HTTP methods and other capabilities of an endpoint,
   * without implying a resource action. See the individual overloads for
   * details on the return type.
   */
  options(url, options = {}) {
    return this.request("OPTIONS", url, options);
  }
  /**
   * Constructs an observable that, when subscribed, causes the configured
   * `PATCH` request to execute on the server. See the individual overloads for
   * details on the return type.
   */
  patch(url, body, options = {}) {
    return this.request("PATCH", url, addBody(options, body));
  }
  /**
   * Constructs an observable that, when subscribed, causes the configured
   * `POST` request to execute on the server. The server responds with the location of
   * the replaced resource. See the individual overloads for
   * details on the return type.
   */
  post(url, body, options = {}) {
    return this.request("POST", url, addBody(options, body));
  }
  /**
   * Constructs an observable that, when subscribed, causes the configured
   * `PUT` request to execute on the server. The `PUT` method replaces an existing resource
   * with a new set of values.
   * See the individual overloads for details on the return type.
   */
  put(url, body, options = {}) {
    return this.request("PUT", url, addBody(options, body));
  }
  static ɵfac = function HttpClient_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HttpClient)(ɵɵinject(HttpHandler));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _HttpClient,
    factory: _HttpClient.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClient, [{
    type: Injectable
  }], () => [{
    type: HttpHandler
  }], null);
})();
var XSSI_PREFIX$1 = /^\)\]\}',?\n/;
function getResponseUrl$1(response) {
  if (response.url) {
    return response.url;
  }
  const xRequestUrl = X_REQUEST_URL_HEADER.toLocaleLowerCase();
  return response.headers.get(xRequestUrl);
}
var FETCH_BACKEND = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "FETCH_BACKEND" : "");
var FetchBackend = class _FetchBackend {
  // We use an arrow function to always reference the current global implementation of `fetch`.
  // This is helpful for cases when the global `fetch` implementation is modified by external code,
  // see https://github.com/angular/angular/issues/57527.
  fetchImpl = inject(FetchFactory, {
    optional: true
  })?.fetch ?? ((...args) => globalThis.fetch(...args));
  ngZone = inject(NgZone);
  destroyRef = inject(DestroyRef);
  destroyed = false;
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });
  }
  handle(request) {
    return new Observable((observer) => {
      const aborter = new AbortController();
      this.doRequest(request, aborter.signal, observer).then(noop, (error) => observer.error(new HttpErrorResponse({
        error
      })));
      return () => aborter.abort();
    });
  }
  doRequest(request, signal2, observer) {
    return __async(this, null, function* () {
      const init = this.createRequestInit(request);
      let response;
      try {
        const fetchPromise = this.ngZone.runOutsideAngular(() => this.fetchImpl(request.urlWithParams, __spreadValues({
          signal: signal2
        }, init)));
        silenceSuperfluousUnhandledPromiseRejection(fetchPromise);
        observer.next({
          type: HttpEventType.Sent
        });
        response = yield fetchPromise;
      } catch (error) {
        observer.error(new HttpErrorResponse({
          error,
          status: error.status ?? 0,
          statusText: error.statusText,
          url: request.urlWithParams,
          headers: error.headers
        }));
        return;
      }
      const headers = new HttpHeaders(response.headers);
      const statusText = response.statusText;
      const url = getResponseUrl$1(response) ?? request.urlWithParams;
      let status = response.status;
      let body = null;
      if (request.reportProgress) {
        observer.next(new HttpHeaderResponse({
          headers,
          status,
          statusText,
          url
        }));
      }
      if (response.body) {
        const contentLength = response.headers.get("content-length");
        const chunks = [];
        const reader = response.body.getReader();
        let receivedLength = 0;
        let decoder;
        let partialText;
        const reqZone = typeof Zone !== "undefined" && Zone.current;
        let canceled = false;
        yield this.ngZone.runOutsideAngular(() => __async(this, null, function* () {
          while (true) {
            if (this.destroyed) {
              yield reader.cancel();
              canceled = true;
              break;
            }
            const {
              done,
              value
            } = yield reader.read();
            if (done) {
              break;
            }
            chunks.push(value);
            receivedLength += value.length;
            if (request.reportProgress) {
              partialText = request.responseType === "text" ? (partialText ?? "") + (decoder ??= new TextDecoder()).decode(value, {
                stream: true
              }) : void 0;
              const reportProgress = () => observer.next({
                type: HttpEventType.DownloadProgress,
                total: contentLength ? +contentLength : void 0,
                loaded: receivedLength,
                partialText
              });
              reqZone ? reqZone.run(reportProgress) : reportProgress();
            }
          }
        }));
        if (canceled) {
          observer.complete();
          return;
        }
        const chunksAll = this.concatChunks(chunks, receivedLength);
        try {
          const contentType = response.headers.get(CONTENT_TYPE_HEADER) ?? "";
          body = this.parseBody(request, chunksAll, contentType);
        } catch (error) {
          observer.error(new HttpErrorResponse({
            error,
            headers: new HttpHeaders(response.headers),
            status: response.status,
            statusText: response.statusText,
            url: getResponseUrl$1(response) ?? request.urlWithParams
          }));
          return;
        }
      }
      if (status === 0) {
        status = body ? HTTP_STATUS_CODE_OK : 0;
      }
      const ok = status >= 200 && status < 300;
      if (ok) {
        observer.next(new HttpResponse({
          body,
          headers,
          status,
          statusText,
          url
        }));
        observer.complete();
      } else {
        observer.error(new HttpErrorResponse({
          error: body,
          headers,
          status,
          statusText,
          url
        }));
      }
    });
  }
  parseBody(request, binContent, contentType) {
    switch (request.responseType) {
      case "json":
        const text = new TextDecoder().decode(binContent).replace(XSSI_PREFIX$1, "");
        return text === "" ? null : JSON.parse(text);
      case "text":
        return new TextDecoder().decode(binContent);
      case "blob":
        return new Blob([binContent], {
          type: contentType
        });
      case "arraybuffer":
        return binContent.buffer;
    }
  }
  createRequestInit(req) {
    const headers = {};
    const credentials = req.withCredentials ? "include" : void 0;
    req.headers.forEach((name, values) => headers[name] = values.join(","));
    if (!req.headers.has(ACCEPT_HEADER)) {
      headers[ACCEPT_HEADER] = ACCEPT_HEADER_VALUE;
    }
    if (!req.headers.has(CONTENT_TYPE_HEADER)) {
      const detectedType = req.detectContentTypeHeader();
      if (detectedType !== null) {
        headers[CONTENT_TYPE_HEADER] = detectedType;
      }
    }
    return {
      body: req.serializeBody(),
      method: req.method,
      headers,
      credentials
    };
  }
  concatChunks(chunks, totalLength) {
    const chunksAll = new Uint8Array(totalLength);
    let position = 0;
    for (const chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }
    return chunksAll;
  }
  static ɵfac = function FetchBackend_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FetchBackend)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _FetchBackend,
    factory: _FetchBackend.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FetchBackend, [{
    type: Injectable
  }], () => [], null);
})();
var FetchFactory = class {
};
function noop() {
}
function silenceSuperfluousUnhandledPromiseRejection(promise) {
  promise.then(noop, noop);
}
function interceptorChainEndFn(req, finalHandlerFn) {
  return finalHandlerFn(req);
}
function adaptLegacyInterceptorToChain(chainTailFn, interceptor) {
  return (initialRequest, finalHandlerFn) => interceptor.intercept(initialRequest, {
    handle: (downstreamRequest) => chainTailFn(downstreamRequest, finalHandlerFn)
  });
}
function chainedInterceptorFn(chainTailFn, interceptorFn, injector) {
  return (initialRequest, finalHandlerFn) => runInInjectionContext(injector, () => interceptorFn(initialRequest, (downstreamRequest) => chainTailFn(downstreamRequest, finalHandlerFn)));
}
var HTTP_INTERCEPTORS = new InjectionToken(ngDevMode ? "HTTP_INTERCEPTORS" : "");
var HTTP_INTERCEPTOR_FNS = new InjectionToken(ngDevMode ? "HTTP_INTERCEPTOR_FNS" : "");
var HTTP_ROOT_INTERCEPTOR_FNS = new InjectionToken(ngDevMode ? "HTTP_ROOT_INTERCEPTOR_FNS" : "");
var REQUESTS_CONTRIBUTE_TO_STABILITY = new InjectionToken(ngDevMode ? "REQUESTS_CONTRIBUTE_TO_STABILITY" : "", {
  providedIn: "root",
  factory: () => true
});
function legacyInterceptorFnFactory() {
  let chain = null;
  return (req, handler) => {
    if (chain === null) {
      const interceptors = inject(HTTP_INTERCEPTORS, {
        optional: true
      }) ?? [];
      chain = interceptors.reduceRight(adaptLegacyInterceptorToChain, interceptorChainEndFn);
    }
    const pendingTasks = inject(PendingTasksInternal);
    const contributeToStability = inject(REQUESTS_CONTRIBUTE_TO_STABILITY);
    if (contributeToStability) {
      const taskId = pendingTasks.add();
      return chain(req, handler).pipe(finalize(() => pendingTasks.remove(taskId)));
    } else {
      return chain(req, handler);
    }
  };
}
var fetchBackendWarningDisplayed = false;
var HttpInterceptorHandler = class _HttpInterceptorHandler extends HttpHandler {
  backend;
  injector;
  chain = null;
  pendingTasks = inject(PendingTasksInternal);
  contributeToStability = inject(REQUESTS_CONTRIBUTE_TO_STABILITY);
  constructor(backend, injector) {
    super();
    this.backend = backend;
    this.injector = injector;
    if ((typeof ngDevMode === "undefined" || ngDevMode) && !fetchBackendWarningDisplayed) {
      const isServer = isPlatformServer(injector.get(PLATFORM_ID));
      const isTestingBackend = this.backend.isTestingBackend;
      if (isServer && !(this.backend instanceof FetchBackend) && !isTestingBackend) {
        fetchBackendWarningDisplayed = true;
        injector.get(Console).warn(formatRuntimeError(2801, "Angular detected that `HttpClient` is not configured to use `fetch` APIs. It's strongly recommended to enable `fetch` for applications that use Server-Side Rendering for better performance and compatibility. To enable `fetch`, add the `withFetch()` to the `provideHttpClient()` call at the root of the application."));
      }
    }
  }
  handle(initialRequest) {
    if (this.chain === null) {
      const dedupedInterceptorFns = Array.from(/* @__PURE__ */ new Set([...this.injector.get(HTTP_INTERCEPTOR_FNS), ...this.injector.get(HTTP_ROOT_INTERCEPTOR_FNS, [])]));
      this.chain = dedupedInterceptorFns.reduceRight((nextSequencedFn, interceptorFn) => chainedInterceptorFn(nextSequencedFn, interceptorFn, this.injector), interceptorChainEndFn);
    }
    if (this.contributeToStability) {
      const taskId = this.pendingTasks.add();
      return this.chain(initialRequest, (downstreamRequest) => this.backend.handle(downstreamRequest)).pipe(finalize(() => this.pendingTasks.remove(taskId)));
    } else {
      return this.chain(initialRequest, (downstreamRequest) => this.backend.handle(downstreamRequest));
    }
  }
  static ɵfac = function HttpInterceptorHandler_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HttpInterceptorHandler)(ɵɵinject(HttpBackend), ɵɵinject(EnvironmentInjector));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _HttpInterceptorHandler,
    factory: _HttpInterceptorHandler.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpInterceptorHandler, [{
    type: Injectable
  }], () => [{
    type: HttpBackend
  }, {
    type: EnvironmentInjector
  }], null);
})();
var nextRequestId = 0;
var foreignDocument;
var JSONP_ERR_NO_CALLBACK = "JSONP injected script did not invoke callback.";
var JSONP_ERR_WRONG_METHOD = "JSONP requests must use JSONP request method.";
var JSONP_ERR_WRONG_RESPONSE_TYPE = "JSONP requests must use Json response type.";
var JSONP_ERR_HEADERS_NOT_SUPPORTED = "JSONP requests do not support headers.";
var JsonpCallbackContext = class {
};
function jsonpCallbackContext() {
  if (typeof window === "object") {
    return window;
  }
  return {};
}
var JsonpClientBackend = class _JsonpClientBackend {
  callbackMap;
  document;
  /**
   * A resolved promise that can be used to schedule microtasks in the event handlers.
   */
  resolvedPromise = Promise.resolve();
  constructor(callbackMap, document) {
    this.callbackMap = callbackMap;
    this.document = document;
  }
  /**
   * Get the name of the next callback method, by incrementing the global `nextRequestId`.
   */
  nextCallback() {
    return `ng_jsonp_callback_${nextRequestId++}`;
  }
  /**
   * Processes a JSONP request and returns an event stream of the results.
   * @param req The request object.
   * @returns An observable of the response events.
   *
   */
  handle(req) {
    if (req.method !== "JSONP") {
      throw new Error(JSONP_ERR_WRONG_METHOD);
    } else if (req.responseType !== "json") {
      throw new Error(JSONP_ERR_WRONG_RESPONSE_TYPE);
    }
    if (req.headers.keys().length > 0) {
      throw new Error(JSONP_ERR_HEADERS_NOT_SUPPORTED);
    }
    return new Observable((observer) => {
      const callback = this.nextCallback();
      const url = req.urlWithParams.replace(/=JSONP_CALLBACK(&|$)/, `=${callback}$1`);
      const node = this.document.createElement("script");
      node.src = url;
      let body = null;
      let finished = false;
      this.callbackMap[callback] = (data) => {
        delete this.callbackMap[callback];
        body = data;
        finished = true;
      };
      const cleanup = () => {
        node.removeEventListener("load", onLoad);
        node.removeEventListener("error", onError);
        node.remove();
        delete this.callbackMap[callback];
      };
      const onLoad = (event) => {
        this.resolvedPromise.then(() => {
          cleanup();
          if (!finished) {
            observer.error(new HttpErrorResponse({
              url,
              status: 0,
              statusText: "JSONP Error",
              error: new Error(JSONP_ERR_NO_CALLBACK)
            }));
            return;
          }
          observer.next(new HttpResponse({
            body,
            status: HTTP_STATUS_CODE_OK,
            statusText: "OK",
            url
          }));
          observer.complete();
        });
      };
      const onError = (error) => {
        cleanup();
        observer.error(new HttpErrorResponse({
          error,
          status: 0,
          statusText: "JSONP Error",
          url
        }));
      };
      node.addEventListener("load", onLoad);
      node.addEventListener("error", onError);
      this.document.body.appendChild(node);
      observer.next({
        type: HttpEventType.Sent
      });
      return () => {
        if (!finished) {
          this.removeListeners(node);
        }
        cleanup();
      };
    });
  }
  removeListeners(script) {
    foreignDocument ??= this.document.implementation.createHTMLDocument();
    foreignDocument.adoptNode(script);
  }
  static ɵfac = function JsonpClientBackend_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _JsonpClientBackend)(ɵɵinject(JsonpCallbackContext), ɵɵinject(DOCUMENT));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _JsonpClientBackend,
    factory: _JsonpClientBackend.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(JsonpClientBackend, [{
    type: Injectable
  }], () => [{
    type: JsonpCallbackContext
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
function jsonpInterceptorFn(req, next) {
  if (req.method === "JSONP") {
    return inject(JsonpClientBackend).handle(req);
  }
  return next(req);
}
var JsonpInterceptor = class _JsonpInterceptor {
  injector;
  constructor(injector) {
    this.injector = injector;
  }
  /**
   * Identifies and handles a given JSONP request.
   * @param initialRequest The outgoing request object to handle.
   * @param next The next interceptor in the chain, or the backend
   * if no interceptors remain in the chain.
   * @returns An observable of the event stream.
   */
  intercept(initialRequest, next) {
    return runInInjectionContext(this.injector, () => jsonpInterceptorFn(initialRequest, (downstreamRequest) => next.handle(downstreamRequest)));
  }
  static ɵfac = function JsonpInterceptor_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _JsonpInterceptor)(ɵɵinject(EnvironmentInjector));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _JsonpInterceptor,
    factory: _JsonpInterceptor.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(JsonpInterceptor, [{
    type: Injectable
  }], () => [{
    type: EnvironmentInjector
  }], null);
})();
var XSSI_PREFIX = /^\)\]\}',?\n/;
var X_REQUEST_URL_REGEXP = RegExp(`^${X_REQUEST_URL_HEADER}:`, "m");
function getResponseUrl(xhr) {
  if ("responseURL" in xhr && xhr.responseURL) {
    return xhr.responseURL;
  }
  if (X_REQUEST_URL_REGEXP.test(xhr.getAllResponseHeaders())) {
    return xhr.getResponseHeader(X_REQUEST_URL_HEADER);
  }
  return null;
}
var HttpXhrBackend = class _HttpXhrBackend {
  xhrFactory;
  constructor(xhrFactory) {
    this.xhrFactory = xhrFactory;
  }
  /**
   * Processes a request and returns a stream of response events.
   * @param req The request object.
   * @returns An observable of the response events.
   */
  handle(req) {
    if (req.method === "JSONP") {
      throw new RuntimeError(-2800, (typeof ngDevMode === "undefined" || ngDevMode) && `Cannot make a JSONP request without JSONP support. To fix the problem, either add the \`withJsonpSupport()\` call (if \`provideHttpClient()\` is used) or import the \`HttpClientJsonpModule\` in the root NgModule.`);
    }
    const xhrFactory = this.xhrFactory;
    const source = xhrFactory.ɵloadImpl ? from(xhrFactory.ɵloadImpl()) : of(null);
    return source.pipe(switchMap(() => {
      return new Observable((observer) => {
        const xhr = xhrFactory.build();
        xhr.open(req.method, req.urlWithParams);
        if (req.withCredentials) {
          xhr.withCredentials = true;
        }
        req.headers.forEach((name, values) => xhr.setRequestHeader(name, values.join(",")));
        if (!req.headers.has(ACCEPT_HEADER)) {
          xhr.setRequestHeader(ACCEPT_HEADER, ACCEPT_HEADER_VALUE);
        }
        if (!req.headers.has(CONTENT_TYPE_HEADER)) {
          const detectedType = req.detectContentTypeHeader();
          if (detectedType !== null) {
            xhr.setRequestHeader(CONTENT_TYPE_HEADER, detectedType);
          }
        }
        if (req.responseType) {
          const responseType = req.responseType.toLowerCase();
          xhr.responseType = responseType !== "json" ? responseType : "text";
        }
        const reqBody = req.serializeBody();
        let headerResponse = null;
        const partialFromXhr = () => {
          if (headerResponse !== null) {
            return headerResponse;
          }
          const statusText = xhr.statusText || "OK";
          const headers = new HttpHeaders(xhr.getAllResponseHeaders());
          const url = getResponseUrl(xhr) || req.url;
          headerResponse = new HttpHeaderResponse({
            headers,
            status: xhr.status,
            statusText,
            url
          });
          return headerResponse;
        };
        const onLoad = () => {
          let {
            headers,
            status,
            statusText,
            url
          } = partialFromXhr();
          let body = null;
          if (status !== HTTP_STATUS_CODE_NO_CONTENT) {
            body = typeof xhr.response === "undefined" ? xhr.responseText : xhr.response;
          }
          if (status === 0) {
            status = !!body ? HTTP_STATUS_CODE_OK : 0;
          }
          let ok = status >= 200 && status < 300;
          if (req.responseType === "json" && typeof body === "string") {
            const originalBody = body;
            body = body.replace(XSSI_PREFIX, "");
            try {
              body = body !== "" ? JSON.parse(body) : null;
            } catch (error) {
              body = originalBody;
              if (ok) {
                ok = false;
                body = {
                  error,
                  text: body
                };
              }
            }
          }
          if (ok) {
            observer.next(new HttpResponse({
              body,
              headers,
              status,
              statusText,
              url: url || void 0
            }));
            observer.complete();
          } else {
            observer.error(new HttpErrorResponse({
              // The error in this case is the response body (error from the server).
              error: body,
              headers,
              status,
              statusText,
              url: url || void 0
            }));
          }
        };
        const onError = (error) => {
          const {
            url
          } = partialFromXhr();
          const res = new HttpErrorResponse({
            error,
            status: xhr.status || 0,
            statusText: xhr.statusText || "Unknown Error",
            url: url || void 0
          });
          observer.error(res);
        };
        let sentHeaders = false;
        const onDownProgress = (event) => {
          if (!sentHeaders) {
            observer.next(partialFromXhr());
            sentHeaders = true;
          }
          let progressEvent = {
            type: HttpEventType.DownloadProgress,
            loaded: event.loaded
          };
          if (event.lengthComputable) {
            progressEvent.total = event.total;
          }
          if (req.responseType === "text" && !!xhr.responseText) {
            progressEvent.partialText = xhr.responseText;
          }
          observer.next(progressEvent);
        };
        const onUpProgress = (event) => {
          let progress = {
            type: HttpEventType.UploadProgress,
            loaded: event.loaded
          };
          if (event.lengthComputable) {
            progress.total = event.total;
          }
          observer.next(progress);
        };
        xhr.addEventListener("load", onLoad);
        xhr.addEventListener("error", onError);
        xhr.addEventListener("timeout", onError);
        xhr.addEventListener("abort", onError);
        if (req.reportProgress) {
          xhr.addEventListener("progress", onDownProgress);
          if (reqBody !== null && xhr.upload) {
            xhr.upload.addEventListener("progress", onUpProgress);
          }
        }
        xhr.send(reqBody);
        observer.next({
          type: HttpEventType.Sent
        });
        return () => {
          xhr.removeEventListener("error", onError);
          xhr.removeEventListener("abort", onError);
          xhr.removeEventListener("load", onLoad);
          xhr.removeEventListener("timeout", onError);
          if (req.reportProgress) {
            xhr.removeEventListener("progress", onDownProgress);
            if (reqBody !== null && xhr.upload) {
              xhr.upload.removeEventListener("progress", onUpProgress);
            }
          }
          if (xhr.readyState !== xhr.DONE) {
            xhr.abort();
          }
        };
      });
    }));
  }
  static ɵfac = function HttpXhrBackend_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HttpXhrBackend)(ɵɵinject(XhrFactory));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _HttpXhrBackend,
    factory: _HttpXhrBackend.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXhrBackend, [{
    type: Injectable
  }], () => [{
    type: XhrFactory
  }], null);
})();
var XSRF_ENABLED = new InjectionToken(ngDevMode ? "XSRF_ENABLED" : "");
var XSRF_DEFAULT_COOKIE_NAME = "XSRF-TOKEN";
var XSRF_COOKIE_NAME = new InjectionToken(ngDevMode ? "XSRF_COOKIE_NAME" : "", {
  providedIn: "root",
  factory: () => XSRF_DEFAULT_COOKIE_NAME
});
var XSRF_DEFAULT_HEADER_NAME = "X-XSRF-TOKEN";
var XSRF_HEADER_NAME = new InjectionToken(ngDevMode ? "XSRF_HEADER_NAME" : "", {
  providedIn: "root",
  factory: () => XSRF_DEFAULT_HEADER_NAME
});
var HttpXsrfTokenExtractor = class {
};
var HttpXsrfCookieExtractor = class _HttpXsrfCookieExtractor {
  doc;
  cookieName;
  lastCookieString = "";
  lastToken = null;
  /**
   * @internal for testing
   */
  parseCount = 0;
  constructor(doc, cookieName) {
    this.doc = doc;
    this.cookieName = cookieName;
  }
  getToken() {
    if (false) {
      return null;
    }
    const cookieString = this.doc.cookie || "";
    if (cookieString !== this.lastCookieString) {
      this.parseCount++;
      this.lastToken = parseCookieValue(cookieString, this.cookieName);
      this.lastCookieString = cookieString;
    }
    return this.lastToken;
  }
  static ɵfac = function HttpXsrfCookieExtractor_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HttpXsrfCookieExtractor)(ɵɵinject(DOCUMENT), ɵɵinject(XSRF_COOKIE_NAME));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _HttpXsrfCookieExtractor,
    factory: _HttpXsrfCookieExtractor.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXsrfCookieExtractor, [{
    type: Injectable
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [XSRF_COOKIE_NAME]
    }]
  }], null);
})();
var ABSOLUTE_URL_REGEX = /^(?:https?:)?\/\//i;
function xsrfInterceptorFn(req, next) {
  if (!inject(XSRF_ENABLED) || req.method === "GET" || req.method === "HEAD" || ABSOLUTE_URL_REGEX.test(req.url)) {
    return next(req);
  }
  const token = inject(HttpXsrfTokenExtractor).getToken();
  const headerName = inject(XSRF_HEADER_NAME);
  if (token != null && !req.headers.has(headerName)) {
    req = req.clone({
      headers: req.headers.set(headerName, token)
    });
  }
  return next(req);
}
var HttpXsrfInterceptor = class _HttpXsrfInterceptor {
  injector;
  constructor(injector) {
    this.injector = injector;
  }
  intercept(initialRequest, next) {
    return runInInjectionContext(this.injector, () => xsrfInterceptorFn(initialRequest, (downstreamRequest) => next.handle(downstreamRequest)));
  }
  static ɵfac = function HttpXsrfInterceptor_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HttpXsrfInterceptor)(ɵɵinject(EnvironmentInjector));
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _HttpXsrfInterceptor,
    factory: _HttpXsrfInterceptor.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXsrfInterceptor, [{
    type: Injectable
  }], () => [{
    type: EnvironmentInjector
  }], null);
})();
var HttpFeatureKind;
(function(HttpFeatureKind2) {
  HttpFeatureKind2[HttpFeatureKind2["Interceptors"] = 0] = "Interceptors";
  HttpFeatureKind2[HttpFeatureKind2["LegacyInterceptors"] = 1] = "LegacyInterceptors";
  HttpFeatureKind2[HttpFeatureKind2["CustomXsrfConfiguration"] = 2] = "CustomXsrfConfiguration";
  HttpFeatureKind2[HttpFeatureKind2["NoXsrfProtection"] = 3] = "NoXsrfProtection";
  HttpFeatureKind2[HttpFeatureKind2["JsonpSupport"] = 4] = "JsonpSupport";
  HttpFeatureKind2[HttpFeatureKind2["RequestsMadeViaParent"] = 5] = "RequestsMadeViaParent";
  HttpFeatureKind2[HttpFeatureKind2["Fetch"] = 6] = "Fetch";
})(HttpFeatureKind || (HttpFeatureKind = {}));
function makeHttpFeature(kind, providers) {
  return {
    ɵkind: kind,
    ɵproviders: providers
  };
}
function provideHttpClient(...features) {
  if (ngDevMode) {
    const featureKinds = new Set(features.map((f) => f.ɵkind));
    if (featureKinds.has(HttpFeatureKind.NoXsrfProtection) && featureKinds.has(HttpFeatureKind.CustomXsrfConfiguration)) {
      throw new Error(ngDevMode ? `Configuration error: found both withXsrfConfiguration() and withNoXsrfProtection() in the same call to provideHttpClient(), which is a contradiction.` : "");
    }
  }
  const providers = [HttpClient, HttpXhrBackend, HttpInterceptorHandler, {
    provide: HttpHandler,
    useExisting: HttpInterceptorHandler
  }, {
    provide: HttpBackend,
    useFactory: () => {
      return inject(FETCH_BACKEND, {
        optional: true
      }) ?? inject(HttpXhrBackend);
    }
  }, {
    provide: HTTP_INTERCEPTOR_FNS,
    useValue: xsrfInterceptorFn,
    multi: true
  }, {
    provide: XSRF_ENABLED,
    useValue: true
  }, {
    provide: HttpXsrfTokenExtractor,
    useClass: HttpXsrfCookieExtractor
  }];
  for (const feature of features) {
    providers.push(...feature.ɵproviders);
  }
  return makeEnvironmentProviders(providers);
}
function withInterceptors(interceptorFns) {
  return makeHttpFeature(HttpFeatureKind.Interceptors, interceptorFns.map((interceptorFn) => {
    return {
      provide: HTTP_INTERCEPTOR_FNS,
      useValue: interceptorFn,
      multi: true
    };
  }));
}
var LEGACY_INTERCEPTOR_FN = new InjectionToken(ngDevMode ? "LEGACY_INTERCEPTOR_FN" : "");
function withInterceptorsFromDi() {
  return makeHttpFeature(HttpFeatureKind.LegacyInterceptors, [{
    provide: LEGACY_INTERCEPTOR_FN,
    useFactory: legacyInterceptorFnFactory
  }, {
    provide: HTTP_INTERCEPTOR_FNS,
    useExisting: LEGACY_INTERCEPTOR_FN,
    multi: true
  }]);
}
function withXsrfConfiguration({
  cookieName,
  headerName
}) {
  const providers = [];
  if (cookieName !== void 0) {
    providers.push({
      provide: XSRF_COOKIE_NAME,
      useValue: cookieName
    });
  }
  if (headerName !== void 0) {
    providers.push({
      provide: XSRF_HEADER_NAME,
      useValue: headerName
    });
  }
  return makeHttpFeature(HttpFeatureKind.CustomXsrfConfiguration, providers);
}
function withNoXsrfProtection() {
  return makeHttpFeature(HttpFeatureKind.NoXsrfProtection, [{
    provide: XSRF_ENABLED,
    useValue: false
  }]);
}
function withJsonpSupport() {
  return makeHttpFeature(HttpFeatureKind.JsonpSupport, [JsonpClientBackend, {
    provide: JsonpCallbackContext,
    useFactory: jsonpCallbackContext
  }, {
    provide: HTTP_INTERCEPTOR_FNS,
    useValue: jsonpInterceptorFn,
    multi: true
  }]);
}
function withRequestsMadeViaParent() {
  return makeHttpFeature(HttpFeatureKind.RequestsMadeViaParent, [{
    provide: HttpBackend,
    useFactory: () => {
      const handlerFromParent = inject(HttpHandler, {
        skipSelf: true,
        optional: true
      });
      if (ngDevMode && handlerFromParent === null) {
        throw new Error("withRequestsMadeViaParent() can only be used when the parent injector also configures HttpClient");
      }
      return handlerFromParent;
    }
  }]);
}
function withFetch() {
  return makeHttpFeature(HttpFeatureKind.Fetch, [FetchBackend, {
    provide: FETCH_BACKEND,
    useExisting: FetchBackend
  }, {
    provide: HttpBackend,
    useExisting: FetchBackend
  }]);
}
var HttpClientXsrfModule = class _HttpClientXsrfModule {
  /**
   * Disable the default XSRF protection.
   */
  static disable() {
    return {
      ngModule: _HttpClientXsrfModule,
      providers: [withNoXsrfProtection().ɵproviders]
    };
  }
  /**
   * Configure XSRF protection.
   * @param options An object that can specify either or both
   * cookie name or header name.
   * - Cookie name default is `XSRF-TOKEN`.
   * - Header name default is `X-XSRF-TOKEN`.
   *
   */
  static withOptions(options = {}) {
    return {
      ngModule: _HttpClientXsrfModule,
      providers: withXsrfConfiguration(options).ɵproviders
    };
  }
  static ɵfac = function HttpClientXsrfModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HttpClientXsrfModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _HttpClientXsrfModule
  });
  static ɵinj = ɵɵdefineInjector({
    providers: [HttpXsrfInterceptor, {
      provide: HTTP_INTERCEPTORS,
      useExisting: HttpXsrfInterceptor,
      multi: true
    }, {
      provide: HttpXsrfTokenExtractor,
      useClass: HttpXsrfCookieExtractor
    }, withXsrfConfiguration({
      cookieName: XSRF_DEFAULT_COOKIE_NAME,
      headerName: XSRF_DEFAULT_HEADER_NAME
    }).ɵproviders, {
      provide: XSRF_ENABLED,
      useValue: true
    }]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClientXsrfModule, [{
    type: NgModule,
    args: [{
      providers: [HttpXsrfInterceptor, {
        provide: HTTP_INTERCEPTORS,
        useExisting: HttpXsrfInterceptor,
        multi: true
      }, {
        provide: HttpXsrfTokenExtractor,
        useClass: HttpXsrfCookieExtractor
      }, withXsrfConfiguration({
        cookieName: XSRF_DEFAULT_COOKIE_NAME,
        headerName: XSRF_DEFAULT_HEADER_NAME
      }).ɵproviders, {
        provide: XSRF_ENABLED,
        useValue: true
      }]
    }]
  }], null, null);
})();
var HttpClientModule = class _HttpClientModule {
  static ɵfac = function HttpClientModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HttpClientModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _HttpClientModule
  });
  static ɵinj = ɵɵdefineInjector({
    providers: [provideHttpClient(withInterceptorsFromDi())]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClientModule, [{
    type: NgModule,
    args: [{
      /**
       * Configures the dependency injector where it is imported
       * with supporting services for HTTP communications.
       */
      providers: [provideHttpClient(withInterceptorsFromDi())]
    }]
  }], null, null);
})();
var HttpClientJsonpModule = class _HttpClientJsonpModule {
  static ɵfac = function HttpClientJsonpModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HttpClientJsonpModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _HttpClientJsonpModule
  });
  static ɵinj = ɵɵdefineInjector({
    providers: [withJsonpSupport().ɵproviders]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClientJsonpModule, [{
    type: NgModule,
    args: [{
      providers: [withJsonpSupport().ɵproviders]
    }]
  }], null, null);
})();

// node_modules/@angular/common/fesm2022/http.mjs
var httpResource = (() => {
  const jsonFn = makeHttpResourceFn("json");
  jsonFn.arrayBuffer = makeHttpResourceFn("arraybuffer");
  jsonFn.blob = makeHttpResourceFn("blob");
  jsonFn.text = makeHttpResourceFn("text");
  return jsonFn;
})();
function makeHttpResourceFn(responseType) {
  return function httpResourceRef(request, options) {
    options?.injector || assertInInjectionContext(httpResource);
    const injector = options?.injector ?? inject(Injector);
    return new HttpResourceImpl(injector, () => normalizeRequest(request, responseType), options?.defaultValue, options?.parse, options?.equal);
  };
}
function normalizeRequest(request, responseType) {
  let unwrappedRequest = typeof request === "function" ? request() : request;
  if (unwrappedRequest === void 0) {
    return void 0;
  } else if (typeof unwrappedRequest === "string") {
    unwrappedRequest = {
      url: unwrappedRequest
    };
  }
  const headers = unwrappedRequest.headers instanceof HttpHeaders ? unwrappedRequest.headers : new HttpHeaders(unwrappedRequest.headers);
  const params = unwrappedRequest.params instanceof HttpParams ? unwrappedRequest.params : new HttpParams({
    fromObject: unwrappedRequest.params
  });
  return new HttpRequest(unwrappedRequest.method ?? "GET", unwrappedRequest.url, unwrappedRequest.body ?? null, {
    headers,
    params,
    reportProgress: unwrappedRequest.reportProgress,
    withCredentials: unwrappedRequest.withCredentials,
    responseType,
    context: unwrappedRequest.context,
    transferCache: unwrappedRequest.transferCache
  });
}
var HttpResourceImpl = class extends ResourceImpl {
  client;
  _headers = linkedSignal({
    source: this.extRequest,
    computation: () => void 0
  });
  _progress = linkedSignal({
    source: this.extRequest,
    computation: () => void 0
  });
  _statusCode = linkedSignal({
    source: this.extRequest,
    computation: () => void 0
  });
  headers = computed(() => this.status() === ResourceStatus.Resolved || this.status() === ResourceStatus.Error ? this._headers() : void 0);
  progress = this._progress.asReadonly();
  statusCode = this._statusCode.asReadonly();
  constructor(injector, request, defaultValue, parse, equal) {
    super(request, ({
      request: request2,
      abortSignal
    }) => {
      let sub;
      const onAbort = () => sub.unsubscribe();
      abortSignal.addEventListener("abort", onAbort);
      const stream = signal({
        value: void 0
      });
      let resolve;
      const promise = new Promise((r) => resolve = r);
      const send = (value) => {
        stream.set(value);
        resolve?.(stream);
        resolve = void 0;
      };
      sub = this.client.request(request2).subscribe({
        next: (event) => {
          switch (event.type) {
            case HttpEventType.Response:
              this._headers.set(event.headers);
              this._statusCode.set(event.status);
              try {
                send({
                  value: parse ? parse(event.body) : event.body
                });
              } catch (error) {
                send({
                  error
                });
              }
              break;
            case HttpEventType.DownloadProgress:
              this._progress.set(event);
              break;
          }
        },
        error: (error) => {
          if (error instanceof HttpErrorResponse) {
            this._headers.set(error.headers);
            this._statusCode.set(error.status);
          }
          send({
            error
          });
          abortSignal.removeEventListener("abort", onAbort);
        },
        complete: () => {
          if (resolve) {
            send({
              error: new Error("Resource completed before producing a value")
            });
          }
          abortSignal.removeEventListener("abort", onAbort);
        }
      });
      return promise;
    }, defaultValue, equal, injector);
    this.client = injector.get(HttpClient);
  }
};
var HTTP_TRANSFER_CACHE_ORIGIN_MAP = new InjectionToken(ngDevMode ? "HTTP_TRANSFER_CACHE_ORIGIN_MAP" : "");
var BODY = "b";
var HEADERS = "h";
var STATUS = "s";
var STATUS_TEXT = "st";
var REQ_URL = "u";
var RESPONSE_TYPE = "rt";
var CACHE_OPTIONS = new InjectionToken(ngDevMode ? "HTTP_TRANSFER_STATE_CACHE_OPTIONS" : "");
var ALLOWED_METHODS = ["GET", "HEAD"];
function transferCacheInterceptorFn(req, next) {
  const _a = inject(CACHE_OPTIONS), {
    isCacheActive
  } = _a, globalOptions = __objRest(_a, [
    "isCacheActive"
  ]);
  const {
    transferCache: requestOptions,
    method: requestMethod
  } = req;
  if (!isCacheActive || requestOptions === false || // POST requests are allowed either globally or at request level
  requestMethod === "POST" && !globalOptions.includePostRequests && !requestOptions || requestMethod !== "POST" && !ALLOWED_METHODS.includes(requestMethod) || // Do not cache request that require authorization when includeRequestsWithAuthHeaders is falsey
  !globalOptions.includeRequestsWithAuthHeaders && hasAuthHeaders(req) || globalOptions.filter?.(req) === false) {
    return next(req);
  }
  const transferState = inject(TransferState);
  const originMap = inject(HTTP_TRANSFER_CACHE_ORIGIN_MAP, {
    optional: true
  });
  if (originMap) {
    throw new RuntimeError(2803, ngDevMode && "Angular detected that the `HTTP_TRANSFER_CACHE_ORIGIN_MAP` token is configured and present in the client side code. Please ensure that this token is only provided in the server code of the application.");
  }
  const requestUrl = false ? mapRequestOriginUrl(req.url, originMap) : req.url;
  const storeKey = makeCacheKey(req, requestUrl);
  const response = transferState.get(storeKey, null);
  let headersToInclude = globalOptions.includeHeaders;
  if (typeof requestOptions === "object" && requestOptions.includeHeaders) {
    headersToInclude = requestOptions.includeHeaders;
  }
  if (response) {
    const {
      [BODY]: undecodedBody,
      [RESPONSE_TYPE]: responseType,
      [HEADERS]: httpHeaders,
      [STATUS]: status,
      [STATUS_TEXT]: statusText,
      [REQ_URL]: url
    } = response;
    let body = undecodedBody;
    switch (responseType) {
      case "arraybuffer":
        body = new TextEncoder().encode(undecodedBody).buffer;
        break;
      case "blob":
        body = new Blob([undecodedBody]);
        break;
    }
    let headers = new HttpHeaders(httpHeaders);
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      headers = appendMissingHeadersDetection(req.url, headers, headersToInclude ?? []);
    }
    return of(new HttpResponse({
      body,
      headers,
      status,
      statusText,
      url
    }));
  }
  return next(req).pipe(tap((event) => {
    if (event instanceof HttpResponse && true && false) {
      transferState.set(storeKey, {
        [BODY]: event.body,
        [HEADERS]: getFilteredHeaders(event.headers, headersToInclude),
        [STATUS]: event.status,
        [STATUS_TEXT]: event.statusText,
        [REQ_URL]: requestUrl,
        [RESPONSE_TYPE]: req.responseType
      });
    }
  }));
}
function hasAuthHeaders(req) {
  return req.headers.has("authorization") || req.headers.has("proxy-authorization");
}
function sortAndConcatParams(params) {
  return [...params.keys()].sort().map((k) => `${k}=${params.getAll(k)}`).join("&");
}
function makeCacheKey(request, mappedRequestUrl) {
  const {
    params,
    method,
    responseType
  } = request;
  const encodedParams = sortAndConcatParams(params);
  let serializedBody = request.serializeBody();
  if (serializedBody instanceof URLSearchParams) {
    serializedBody = sortAndConcatParams(serializedBody);
  } else if (typeof serializedBody !== "string") {
    serializedBody = "";
  }
  const key = [method, responseType, mappedRequestUrl, serializedBody, encodedParams].join("|");
  const hash = generateHash(key);
  return makeStateKey(hash);
}
function generateHash(value) {
  let hash = 0;
  for (const char of value) {
    hash = Math.imul(31, hash) + char.charCodeAt(0) << 0;
  }
  hash += 2147483647 + 1;
  return hash.toString();
}
function withHttpTransferCache(cacheOptions) {
  return [{
    provide: CACHE_OPTIONS,
    useFactory: () => {
      performanceMarkFeature("NgHttpTransferCache");
      return __spreadValues({
        isCacheActive: true
      }, cacheOptions);
    }
  }, {
    provide: HTTP_ROOT_INTERCEPTOR_FNS,
    useValue: transferCacheInterceptorFn,
    multi: true
  }, {
    provide: APP_BOOTSTRAP_LISTENER,
    multi: true,
    useFactory: () => {
      const appRef = inject(ApplicationRef);
      const cacheState = inject(CACHE_OPTIONS);
      return () => {
        appRef.whenStable().then(() => {
          cacheState.isCacheActive = false;
        });
      };
    }
  }];
}
function appendMissingHeadersDetection(url, headers, headersToInclude) {
  const warningProduced = /* @__PURE__ */ new Set();
  return new Proxy(headers, {
    get(target, prop) {
      const value = Reflect.get(target, prop);
      const methods = /* @__PURE__ */ new Set(["get", "has", "getAll"]);
      if (typeof value !== "function" || !methods.has(prop)) {
        return value;
      }
      return (headerName) => {
        const key = (prop + ":" + headerName).toLowerCase();
        if (!headersToInclude.includes(headerName) && !warningProduced.has(key)) {
          warningProduced.add(key);
          const truncatedUrl = truncateMiddle(url);
          console.warn(formatRuntimeError(2802, `Angular detected that the \`${headerName}\` header is accessed, but the value of the header was not transferred from the server to the client by the HttpTransferCache. To include the value of the \`${headerName}\` header for the \`${truncatedUrl}\` request, use the \`includeHeaders\` list. The \`includeHeaders\` can be defined either on a request level by adding the \`transferCache\` parameter, or on an application level by adding the \`httpCacheTransfer.includeHeaders\` argument to the \`provideClientHydration()\` call. `));
        }
        return value.apply(target, [headerName]);
      };
    }
  });
}

export {
  HttpHandler,
  HttpBackend,
  HttpHeaders,
  HttpUrlEncodingCodec,
  HttpParams,
  HttpContextToken,
  HttpContext,
  HttpRequest,
  HttpEventType,
  HttpResponseBase,
  HttpHeaderResponse,
  HttpResponse,
  HttpErrorResponse,
  HttpStatusCode,
  HttpClient,
  FetchBackend,
  HTTP_INTERCEPTORS,
  HTTP_ROOT_INTERCEPTOR_FNS,
  REQUESTS_CONTRIBUTE_TO_STABILITY,
  HttpInterceptorHandler,
  JsonpClientBackend,
  JsonpInterceptor,
  HttpXhrBackend,
  HttpXsrfTokenExtractor,
  HttpFeatureKind,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
  withXsrfConfiguration,
  withNoXsrfProtection,
  withJsonpSupport,
  withRequestsMadeViaParent,
  withFetch,
  HttpClientXsrfModule,
  HttpClientModule,
  HttpClientJsonpModule,
  httpResource,
  HTTP_TRANSFER_CACHE_ORIGIN_MAP,
  withHttpTransferCache
};
/*! Bundled license information:

@angular/common/fesm2022/module-JS82OH2B.mjs:
@angular/common/fesm2022/http.mjs:
  (**
   * @license Angular v19.2.17
   * (c) 2010-2025 Google LLC. https://angular.io/
   * License: MIT
   *)
*/
//# sourceMappingURL=chunk-257AE5XC.js.map

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/chunk-KJ2FTQNQ.js
```typescript
import {
  InjectionToken
} from "./chunk-EP22WXWE.js";

// node_modules/@angular/common/fesm2022/dom_tokens-rA0ACyx7.mjs
var DOCUMENT = new InjectionToken(ngDevMode ? "DocumentToken" : "");

// node_modules/@angular/common/fesm2022/xhr-BfNfxNDv.mjs
function parseCookieValue(cookieStr, name) {
  name = encodeURIComponent(name);
  for (const cookie of cookieStr.split(";")) {
    const eqIndex = cookie.indexOf("=");
    const [cookieName, cookieValue] = eqIndex == -1 ? [cookie, ""] : [cookie.slice(0, eqIndex), cookie.slice(eqIndex + 1)];
    if (cookieName.trim() === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}
var PLATFORM_BROWSER_ID = "browser";
var PLATFORM_SERVER_ID = "server";
function isPlatformBrowser(platformId) {
  return platformId === PLATFORM_BROWSER_ID;
}
function isPlatformServer(platformId) {
  return platformId === PLATFORM_SERVER_ID;
}
var XhrFactory = class {
};

export {
  DOCUMENT,
  parseCookieValue,
  PLATFORM_BROWSER_ID,
  PLATFORM_SERVER_ID,
  isPlatformBrowser,
  isPlatformServer,
  XhrFactory
};
/*! Bundled license information:

@angular/common/fesm2022/dom_tokens-rA0ACyx7.mjs:
@angular/common/fesm2022/xhr-BfNfxNDv.mjs:
  (**
   * @license Angular v19.2.17
   * (c) 2010-2025 Google LLC. https://angular.io/
   * License: MIT
   *)
*/
//# sourceMappingURL=chunk-KJ2FTQNQ.js.map

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/@angular_platform-browser.js
```typescript
import {
  BrowserDomAdapter,
  BrowserGetTestability,
  BrowserModule,
  By,
  DomEventsPlugin,
  DomRendererFactory2,
  DomSanitizer,
  DomSanitizerImpl,
  EVENT_MANAGER_PLUGINS,
  EventManager,
  EventManagerPlugin,
  HAMMER_GESTURE_CONFIG,
  HAMMER_LOADER,
  HammerGestureConfig,
  HammerGesturesPlugin,
  HammerModule,
  HydrationFeatureKind,
  KeyEventsPlugin,
  Meta,
  REMOVE_STYLES_ON_COMPONENT_DESTROY,
  SharedStylesHost,
  Title,
  VERSION,
  bootstrapApplication,
  createApplication,
  disableDebugTools,
  enableDebugTools,
  platformBrowser,
  provideClientHydration,
  provideProtractorTestingSupport,
  withEventReplay,
  withHttpTransferCacheOptions,
  withI18nSupport,
  withIncrementalHydration,
  withNoHttpTransferCache
} from "./chunk-WMQUX6DB.js";
import "./chunk-257AE5XC.js";
import {
  getDOM
} from "./chunk-E2IFQTEF.js";
import "./chunk-KJ2FTQNQ.js";
import "./chunk-EP22WXWE.js";
import "./chunk-6Q4RANH6.js";
import "./chunk-FFZIAYYX.js";
import "./chunk-CXCX2JKZ.js";
export {
  BrowserModule,
  By,
  DomSanitizer,
  EVENT_MANAGER_PLUGINS,
  EventManager,
  EventManagerPlugin,
  HAMMER_GESTURE_CONFIG,
  HAMMER_LOADER,
  HammerGestureConfig,
  HammerModule,
  HydrationFeatureKind,
  Meta,
  REMOVE_STYLES_ON_COMPONENT_DESTROY,
  Title,
  VERSION,
  bootstrapApplication,
  createApplication,
  disableDebugTools,
  enableDebugTools,
  platformBrowser,
  provideClientHydration,
  provideProtractorTestingSupport,
  withEventReplay,
  withHttpTransferCacheOptions,
  withI18nSupport,
  withIncrementalHydration,
  withNoHttpTransferCache,
  BrowserDomAdapter as ɵBrowserDomAdapter,
  BrowserGetTestability as ɵBrowserGetTestability,
  DomEventsPlugin as ɵDomEventsPlugin,
  DomRendererFactory2 as ɵDomRendererFactory2,
  DomSanitizerImpl as ɵDomSanitizerImpl,
  HammerGesturesPlugin as ɵHammerGesturesPlugin,
  KeyEventsPlugin as ɵKeyEventsPlugin,
  SharedStylesHost as ɵSharedStylesHost,
  getDOM as ɵgetDOM
};

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/@angular_common_http.js
```typescript
import {
  FetchBackend,
  HTTP_INTERCEPTORS,
  HTTP_ROOT_INTERCEPTOR_FNS,
  HTTP_TRANSFER_CACHE_ORIGIN_MAP,
  HttpBackend,
  HttpClient,
  HttpClientJsonpModule,
  HttpClientModule,
  HttpClientXsrfModule,
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpEventType,
  HttpFeatureKind,
  HttpHandler,
  HttpHeaderResponse,
  HttpHeaders,
  HttpInterceptorHandler,
  HttpParams,
  HttpRequest,
  HttpResponse,
  HttpResponseBase,
  HttpStatusCode,
  HttpUrlEncodingCodec,
  HttpXhrBackend,
  HttpXsrfTokenExtractor,
  JsonpClientBackend,
  JsonpInterceptor,
  REQUESTS_CONTRIBUTE_TO_STABILITY,
  httpResource,
  provideHttpClient,
  withFetch,
  withHttpTransferCache,
  withInterceptors,
  withInterceptorsFromDi,
  withJsonpSupport,
  withNoXsrfProtection,
  withRequestsMadeViaParent,
  withXsrfConfiguration
} from "./chunk-257AE5XC.js";
import "./chunk-KJ2FTQNQ.js";
import "./chunk-EP22WXWE.js";
import "./chunk-6Q4RANH6.js";
import "./chunk-FFZIAYYX.js";
import "./chunk-CXCX2JKZ.js";
export {
  FetchBackend,
  HTTP_INTERCEPTORS,
  HTTP_TRANSFER_CACHE_ORIGIN_MAP,
  HttpBackend,
  HttpClient,
  HttpClientJsonpModule,
  HttpClientModule,
  HttpClientXsrfModule,
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpEventType,
  HttpFeatureKind,
  HttpHandler,
  HttpHeaderResponse,
  HttpHeaders,
  HttpParams,
  HttpRequest,
  HttpResponse,
  HttpResponseBase,
  HttpStatusCode,
  HttpUrlEncodingCodec,
  HttpXhrBackend,
  HttpXsrfTokenExtractor,
  JsonpClientBackend,
  JsonpInterceptor,
  httpResource,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
  withJsonpSupport,
  withNoXsrfProtection,
  withRequestsMadeViaParent,
  withXsrfConfiguration,
  HTTP_ROOT_INTERCEPTOR_FNS as ɵHTTP_ROOT_INTERCEPTOR_FNS,
  HttpInterceptorHandler as ɵHttpInterceptingHandler,
  HttpInterceptorHandler as ɵHttpInterceptorHandler,
  REQUESTS_CONTRIBUTE_TO_STABILITY as ɵREQUESTS_CONTRIBUTE_TO_STABILITY,
  withHttpTransferCache as ɵwithHttpTransferCache
};

```

## File: frontend/.angular/cache/19.2.19/frontend/vite/deps/@angular_core.js
```typescript
import {
  ANIMATION_MODULE_TYPE,
  APP_BOOTSTRAP_LISTENER,
  APP_ID,
  APP_INITIALIZER,
  AfterRenderManager,
  AfterRenderPhase,
  ApplicationInitStatus,
  ApplicationModule,
  ApplicationRef,
  Attribute,
  CLIENT_RENDER_MODE_FLAG,
  COMPILER_OPTIONS,
  CONTAINER_HEADER_OFFSET,
  CSP_NONCE,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionScheduler,
  ChangeDetectionSchedulerImpl,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Compiler,
  CompilerFactory,
  Component,
  ComponentFactory,
  ComponentFactory$1,
  ComponentFactoryResolver$1,
  ComponentRef,
  ComponentRef$1,
  Console,
  ContentChild,
  ContentChildren,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_LOCALE_ID,
  DEFER_BLOCK_CONFIG,
  DEFER_BLOCK_DEPENDENCY_INTERCEPTOR,
  DEHYDRATED_BLOCK_REGISTRY,
  DebugElement,
  DebugEventListener,
  DebugNode,
  DefaultIterableDiffer,
  DeferBlockBehavior,
  DeferBlockState,
  DestroyRef,
  Directive,
  ENABLE_ROOT_COMPONENT_BOOTSTRAP,
  ENVIRONMENT_INITIALIZER,
  EffectScheduler,
  ElementRef,
  EmbeddedViewRef,
  EnvironmentInjector,
  ErrorHandler,
  EventEmitter,
  FactoryTarget,
  HOST_TAG_NAME,
  Host,
  HostAttributeToken,
  HostBinding,
  HostListener,
  HydrationStatus,
  IMAGE_CONFIG,
  IMAGE_CONFIG_DEFAULTS,
  INJECTOR$1,
  INJECTOR_SCOPE,
  INTERNAL_APPLICATION_ERROR_HANDLER,
  IS_HYDRATION_DOM_REUSE_ENABLED,
  IS_INCREMENTAL_HYDRATION_ENABLED,
  Inject,
  InjectFlags,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  IterableDiffers,
  JSACTION_BLOCK_ELEMENT_MAP,
  JSACTION_EVENT_CONTRACT,
  KeyValueDiffers,
  LContext,
  LOCALE_ID,
  LocaleDataIndex,
  MicrotaskEffectScheduler,
  MissingTranslationStrategy,
  ModuleWithComponentFactories,
  NG_COMP_DEF,
  NG_DIR_DEF,
  NG_ELEMENT_ID,
  NG_INJ_DEF,
  NG_MOD_DEF,
  NG_PIPE_DEF,
  NG_PROV_DEF,
  NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR,
  NO_CHANGE,
  NO_ERRORS_SCHEMA,
  NgModule,
  NgModuleFactory,
  NgModuleFactory$1,
  NgModuleRef,
  NgModuleRef$1,
  NgProbeToken,
  NgZone,
  NoopNgZone,
  Optional,
  Output,
  OutputEmitterRef,
  PACKAGE_ROOT_URL,
  PERFORMANCE_MARK_PREFIX,
  PLATFORM_ID,
  PLATFORM_INITIALIZER,
  PROVIDED_NG_ZONE,
  PendingTasks,
  PendingTasksInternal,
  Pipe,
  PlatformRef,
  Query,
  QueryList,
  R3Injector,
  REQUEST,
  REQUEST_CONTEXT,
  RESPONSE_INIT,
  ReflectionCapabilities,
  Renderer2,
  RendererFactory2,
  RendererStyleFlags2,
  ResourceImpl,
  ResourceStatus,
  RuntimeError,
  SIGNAL,
  SSR_CONTENT_INTEGRITY_MARKER,
  Sanitizer,
  SecurityContext,
  Self,
  SimpleChange,
  SkipSelf,
  TESTABILITY,
  TESTABILITY_GETTER,
  TRANSLATIONS,
  TRANSLATIONS_FORMAT,
  TemplateRef,
  Testability,
  TestabilityRegistry,
  TimerScheduler,
  TracingAction,
  TracingService,
  TransferState,
  Type,
  USE_RUNTIME_DEPS_TRACKER_FOR_JIT,
  VERSION,
  Version,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
  ViewEncapsulation,
  ViewRef,
  ViewRef$1,
  XSS_SECURITY_URL,
  ZONELESS_ENABLED,
  _global,
  _sanitizeHtml,
  _sanitizeUrl,
  afterNextRender,
  afterRender,
  afterRenderEffect,
  allowSanitizationBypassAndThrow,
  annotateForHydration,
  asNativeElements,
  assertInInjectionContext,
  assertNotInReactiveContext,
  assertPlatform,
  booleanAttribute,
  bypassSanitizationTrustHtml,
  bypassSanitizationTrustResourceUrl,
  bypassSanitizationTrustScript,
  bypassSanitizationTrustStyle,
  bypassSanitizationTrustUrl,
  clearResolutionOfComponentResourcesQueue,
  compileComponent,
  compileDirective,
  compileNgModule,
  compileNgModuleDefs,
  compileNgModuleFactory,
  compilePipe,
  computed,
  contentChild,
  contentChildren,
  convertToBitFlags,
  createComponent,
  createEnvironmentInjector,
  createInjector,
  createNgModule,
  createNgModuleRef,
  createOrReusePlatformInjector,
  createPlatform,
  createPlatformFactory,
  defaultIterableDiffers,
  defaultKeyValueDiffers,
  defineInjectable,
  depsTracker,
  destroyPlatform,
  detectChangesInViewIfRequired,
  devModeEqual,
  disableProfiling,
  effect,
  enableProdMode,
  enableProfiling,
  findLocaleData,
  flushModuleScopingQueueAsMuchAsPossible,
  formatRuntimeError,
  forwardRef,
  generateStandaloneInDeclarationsError,
  getAsyncClassMetadataFn,
  getClosestComponentName,
  getComponentDef,
  getDebugNode,
  getDeferBlocks$1,
  getDirectives,
  getDocument,
  getHostElement,
  getInjectableDef,
  getLContext,
  getLocaleCurrencyCode,
  getLocalePluralCase,
  getModuleFactory,
  getNgModuleById,
  getOutputDestroyRef,
  getPlatform,
  getSanitizationBypassType,
  importProvidersFrom,
  inject,
  injectChangeDetectorRef,
  input,
  internalCreateApplication,
  internalProvideZoneChangeDetection,
  isBoundToModule,
  isComponentDefPendingResolution,
  isDevMode,
  isEnvironmentProviders,
  isInjectable,
  isNgModule,
  isPromise,
  isSignal,
  isStandalone,
  isSubscribable,
  isViewDirty,
  linkedSignal,
  makeEnvironmentProviders,
  makeStateKey,
  markForRefresh,
  mergeApplicationConfig,
  microtaskEffect,
  model,
  noSideEffects,
  numberAttribute,
  output,
  patchComponentDefWithScope,
  performanceMarkFeature,
  platformCore,
  provideAppInitializer,
  provideEnvironmentInitializer,
  provideExperimentalCheckNoChangesForDebug,
  provideExperimentalZonelessChangeDetection,
  providePlatformInitializer,
  provideZoneChangeDetection,
  publishExternalGlobalUtil,
  readHydrationInfo,
  reflectComponentType,
  registerLocaleData,
  registerNgModuleType,
  renderDeferBlockState,
  resetCompiledComponents,
  resetJitOptions,
  resolveComponentResources,
  resolveForwardRef,
  resource,
  restoreComponentResolutionQueue,
  runInInjectionContext,
  setAllowDuplicateNgModuleIdsForTest,
  setAlternateWeakRefImpl,
  setClassMetadata,
  setClassMetadataAsync,
  setCurrentInjector,
  setDocument,
  setInjectorProfilerContext,
  setLocaleId,
  setTestabilityGetter,
  signal,
  startMeasuring,
  stopMeasuring,
  store,
  stringify,
  transitiveScopesFor,
  triggerResourceLoading,
  truncateMiddle,
  unregisterAllLocaleData,
  untracked,
  unwrapSafeValue,
  viewChild,
  viewChildren,
  withDomHydration,
  withEventReplay,
  withI18nSupport,
  withIncrementalHydration,
  ɵINPUT_SIGNAL_BRAND_WRITE_TYPE,
  ɵgetUnknownElementStrictMode,
  ɵgetUnknownPropertyStrictMode,
  ɵsetClassDebugInfo,
  ɵsetUnknownElementStrictMode,
  ɵsetUnknownPropertyStrictMode,
  ɵunwrapWritableSignal,
  ɵɵCopyDefinitionFeature,
  ɵɵExternalStylesFeature,
  ɵɵHostDirectivesFeature,
  ɵɵInheritDefinitionFeature,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattachSourceLocations,
  ɵɵattribute,
  ɵɵattributeInterpolate1,
  ɵɵattributeInterpolate2,
  ɵɵattributeInterpolate3,
  ɵɵattributeInterpolate4,
  ɵɵattributeInterpolate5,
  ɵɵattributeInterpolate6,
  ɵɵattributeInterpolate7,
  ɵɵattributeInterpolate8,
  ɵɵattributeInterpolateV,
  ɵɵclassMap,
  ɵɵclassMapInterpolate1,
  ɵɵclassMapInterpolate2,
  ɵɵclassMapInterpolate3,
  ɵɵclassMapInterpolate4,
  ɵɵclassMapInterpolate5,
  ɵɵclassMapInterpolate6,
  ɵɵclassMapInterpolate7,
  ɵɵclassMapInterpolate8,
  ɵɵclassMapInterpolateV,
  ɵɵclassProp,
  ɵɵcomponentInstance,
  ɵɵconditional,
  ɵɵcontentQuery,
  ɵɵcontentQuerySignal,
  ɵɵdeclareLet,
  ɵɵdefer,
  ɵɵdeferEnableTimerScheduling,
  ɵɵdeferHydrateNever,
  ɵɵdeferHydrateOnHover,
  ɵɵdeferHydrateOnIdle,
  ɵɵdeferHydrateOnImmediate,
  ɵɵdeferHydrateOnInteraction,
  ɵɵdeferHydrateOnTimer,
  ɵɵdeferHydrateOnViewport,
  ɵɵdeferHydrateWhen,
  ɵɵdeferOnHover,
  ɵɵdeferOnIdle,
  ɵɵdeferOnImmediate,
  ɵɵdeferOnInteraction,
  ɵɵdeferOnTimer,
  ɵɵdeferOnViewport,
  ɵɵdeferPrefetchOnHover,
  ɵɵdeferPrefetchOnIdle,
  ɵɵdeferPrefetchOnImmediate,
  ɵɵdeferPrefetchOnInteraction,
  ɵɵdeferPrefetchOnTimer,
  ɵɵdeferPrefetchOnViewport,
  ɵɵdeferPrefetchWhen,
  ɵɵdeferWhen,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdefinePipe,
  ɵɵdirectiveInject,
  ɵɵdisableBindings,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵenableBindings,
  ɵɵgetComponentDepsFactory,
  ɵɵgetCurrentView,
  ɵɵgetInheritedFactory,
  ɵɵgetReplaceMetadataURL,
  ɵɵhostProperty,
  ɵɵi18n,
  ɵɵi18nApply,
  ɵɵi18nAttributes,
  ɵɵi18nEnd,
  ɵɵi18nExp,
  ɵɵi18nPostprocess,
  ɵɵi18nStart,
  ɵɵinject,
  ɵɵinjectAttribute,
  ɵɵinvalidFactory,
  ɵɵinvalidFactoryDep,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceMathML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵngDeclareClassMetadata,
  ɵɵngDeclareClassMetadataAsync,
  ɵɵngDeclareComponent,
  ɵɵngDeclareDirective,
  ɵɵngDeclareFactory,
  ɵɵngDeclareInjectable,
  ɵɵngDeclareInjector,
  ɵɵngDeclareNgModule,
  ɵɵngDeclarePipe,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵpipeBind3,
  ɵɵpipeBind4,
  ɵɵpipeBindV,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpropertyInterpolate,
  ɵɵpropertyInterpolate1,
  ɵɵpropertyInterpolate2,
  ɵɵpropertyInterpolate3,
  ɵɵpropertyInterpolate4,
  ɵɵpropertyInterpolate5,
  ɵɵpropertyInterpolate6,
  ɵɵpropertyInterpolate7,
  ɵɵpropertyInterpolate8,
  ɵɵpropertyInterpolateV,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction3,
  ɵɵpureFunction4,
  ɵɵpureFunction5,
  ɵɵpureFunction6,
  ɵɵpureFunction7,
  ɵɵpureFunction8,
  ɵɵpureFunctionV,
  ɵɵqueryAdvance,
  ɵɵqueryRefresh,
  ɵɵreadContextLet,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵreplaceMetadata,
  ɵɵresetView,
  ɵɵresolveBody,
  ɵɵresolveDocument,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeResourceUrl,
  ɵɵsanitizeScript,
  ɵɵsanitizeStyle,
  ɵɵsanitizeUrl,
  ɵɵsanitizeUrlOrResourceUrl,
  ɵɵsetComponentScope,
  ɵɵsetNgModuleScope,
  ɵɵstoreLet,
  ɵɵstyleMap,
  ɵɵstyleMapInterpolate1,
  ɵɵstyleMapInterpolate2,
  ɵɵstyleMapInterpolate3,
  ɵɵstyleMapInterpolate4,
  ɵɵstyleMapInterpolate5,
  ɵɵstyleMapInterpolate6,
  ɵɵstyleMapInterpolate7,
  ɵɵstyleMapInterpolate8,
  ɵɵstyleMapInterpolateV,
  ɵɵstyleProp,
  ɵɵstylePropInterpolate1,
  ɵɵstylePropInterpolate2,
  ɵɵstylePropInterpolate3,
  ɵɵstylePropInterpolate4,
  ɵɵstylePropInterpolate5,
  ɵɵstylePropInterpolate6,
  ɵɵstylePropInterpolate7,
  ɵɵstylePropInterpolate8,
  ɵɵstylePropInterpolateV,
  ɵɵsyntheticHostListener,
  ɵɵsyntheticHostProperty,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtextInterpolate3,
  ɵɵtextInterpolate4,
  ɵɵtextInterpolate5,
  ɵɵtextInterpolate6,
  ɵɵtextInterpolate7,
  ɵɵtextInterpolate8,
  ɵɵtextInterpolateV,
  ɵɵtrustConstantHtml,
  ɵɵtrustConstantResourceUrl,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵvalidateAttribute,
  ɵɵviewQuery,
  ɵɵviewQuerySignal
} from "./chunk-EP22WXWE.js";
import "./chunk-6Q4RANH6.js";
import "./chunk-FFZIAYYX.js";
import "./chunk-CXCX2JKZ.js";
export {
  ANIMATION_MODULE_TYPE,
  APP_BOOTSTRAP_LISTENER,
  APP_ID,
  APP_INITIALIZER,
  AfterRenderPhase,
  ApplicationInitStatus,
  ApplicationModule,
  ApplicationRef,
  Attribute,
  COMPILER_OPTIONS,
  CSP_NONCE,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Compiler,
  CompilerFactory,
  Component,
  ComponentFactory$1 as ComponentFactory,
  ComponentFactoryResolver$1 as ComponentFactoryResolver,
  ComponentRef$1 as ComponentRef,
  ContentChild,
  ContentChildren,
  DEFAULT_CURRENCY_CODE,
  DebugElement,
  DebugEventListener,
  DebugNode,
  DefaultIterableDiffer,
  DestroyRef,
  Directive,
  ENVIRONMENT_INITIALIZER,
  ElementRef,
  EmbeddedViewRef,
  EnvironmentInjector,
  ErrorHandler,
  EventEmitter,
  HOST_TAG_NAME,
  Host,
  HostAttributeToken,
  HostBinding,
  HostListener,
  INJECTOR$1 as INJECTOR,
  Inject,
  InjectFlags,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  IterableDiffers,
  KeyValueDiffers,
  LOCALE_ID,
  MissingTranslationStrategy,
  ModuleWithComponentFactories,
  NO_ERRORS_SCHEMA,
  NgModule,
  NgModuleFactory$1 as NgModuleFactory,
  NgModuleRef$1 as NgModuleRef,
  NgProbeToken,
  NgZone,
  Optional,
  Output,
  OutputEmitterRef,
  PACKAGE_ROOT_URL,
  PLATFORM_ID,
  PLATFORM_INITIALIZER,
  PendingTasks,
  Pipe,
  PlatformRef,
  Query,
  QueryList,
  REQUEST,
  REQUEST_CONTEXT,
  RESPONSE_INIT,
  Renderer2,
  RendererFactory2,
  RendererStyleFlags2,
  ResourceStatus,
  Sanitizer,
  SecurityContext,
  Self,
  SimpleChange,
  SkipSelf,
  TRANSLATIONS,
  TRANSLATIONS_FORMAT,
  TemplateRef,
  Testability,
  TestabilityRegistry,
  TransferState,
  Type,
  VERSION,
  Version,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
  ViewEncapsulation,
  ViewRef,
  afterNextRender,
  afterRender,
  afterRenderEffect,
  asNativeElements,
  assertInInjectionContext,
  assertNotInReactiveContext,
  assertPlatform,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  createComponent,
  createEnvironmentInjector,
  createNgModule,
  createNgModuleRef,
  createPlatform,
  createPlatformFactory,
  defineInjectable,
  destroyPlatform,
  effect,
  enableProdMode,
  forwardRef,
  getDebugNode,
  getModuleFactory,
  getNgModuleById,
  getPlatform,
  importProvidersFrom,
  inject,
  input,
  isDevMode,
  isSignal,
  isStandalone,
  linkedSignal,
  makeEnvironmentProviders,
  makeStateKey,
  mergeApplicationConfig,
  model,
  numberAttribute,
  output,
  platformCore,
  provideAppInitializer,
  provideEnvironmentInitializer,
  provideExperimentalCheckNoChangesForDebug,
  provideExperimentalZonelessChangeDetection,
  providePlatformInitializer,
  provideZoneChangeDetection,
  reflectComponentType,
  resolveForwardRef,
  resource,
  runInInjectionContext,
  setTestabilityGetter,
  signal,
  untracked,
  viewChild,
  viewChildren,
  AfterRenderManager as ɵAfterRenderManager,
  CLIENT_RENDER_MODE_FLAG as ɵCLIENT_RENDER_MODE_FLAG,
  CONTAINER_HEADER_OFFSET as ɵCONTAINER_HEADER_OFFSET,
  ChangeDetectionScheduler as ɵChangeDetectionScheduler,
  ChangeDetectionSchedulerImpl as ɵChangeDetectionSchedulerImpl,
  ComponentFactory$1 as ɵComponentFactory,
  Console as ɵConsole,
  DEFAULT_LOCALE_ID as ɵDEFAULT_LOCALE_ID,
  DEFER_BLOCK_CONFIG as ɵDEFER_BLOCK_CONFIG,
  DEFER_BLOCK_DEPENDENCY_INTERCEPTOR as ɵDEFER_BLOCK_DEPENDENCY_INTERCEPTOR,
  DEHYDRATED_BLOCK_REGISTRY as ɵDEHYDRATED_BLOCK_REGISTRY,
  DeferBlockBehavior as ɵDeferBlockBehavior,
  DeferBlockState as ɵDeferBlockState,
  ENABLE_ROOT_COMPONENT_BOOTSTRAP as ɵENABLE_ROOT_COMPONENT_BOOTSTRAP,
  EffectScheduler as ɵEffectScheduler,
  HydrationStatus as ɵHydrationStatus,
  IMAGE_CONFIG as ɵIMAGE_CONFIG,
  IMAGE_CONFIG_DEFAULTS as ɵIMAGE_CONFIG_DEFAULTS,
  INJECTOR_SCOPE as ɵINJECTOR_SCOPE,
  ɵINPUT_SIGNAL_BRAND_WRITE_TYPE,
  INTERNAL_APPLICATION_ERROR_HANDLER as ɵINTERNAL_APPLICATION_ERROR_HANDLER,
  IS_HYDRATION_DOM_REUSE_ENABLED as ɵIS_HYDRATION_DOM_REUSE_ENABLED,
  IS_INCREMENTAL_HYDRATION_ENABLED as ɵIS_INCREMENTAL_HYDRATION_ENABLED,
  JSACTION_BLOCK_ELEMENT_MAP as ɵJSACTION_BLOCK_ELEMENT_MAP,
  JSACTION_EVENT_CONTRACT as ɵJSACTION_EVENT_CONTRACT,
  LContext as ɵLContext,
  LocaleDataIndex as ɵLocaleDataIndex,
  MicrotaskEffectScheduler as ɵMicrotaskEffectScheduler,
  NG_COMP_DEF as ɵNG_COMP_DEF,
  NG_DIR_DEF as ɵNG_DIR_DEF,
  NG_ELEMENT_ID as ɵNG_ELEMENT_ID,
  NG_INJ_DEF as ɵNG_INJ_DEF,
  NG_MOD_DEF as ɵNG_MOD_DEF,
  NG_PIPE_DEF as ɵNG_PIPE_DEF,
  NG_PROV_DEF as ɵNG_PROV_DEF,
  NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR as ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR,
  NO_CHANGE as ɵNO_CHANGE,
  NgModuleFactory as ɵNgModuleFactory,
  NoopNgZone as ɵNoopNgZone,
  PERFORMANCE_MARK_PREFIX as ɵPERFORMANCE_MARK_PREFIX,
  PROVIDED_NG_ZONE as ɵPROVIDED_NG_ZONE,
  PendingTasksInternal as ɵPendingTasksInternal,
  R3Injector as ɵR3Injector,
  ReflectionCapabilities as ɵReflectionCapabilities,
  ComponentFactory as ɵRender3ComponentFactory,
  ComponentRef as ɵRender3ComponentRef,
  NgModuleRef as ɵRender3NgModuleRef,
  ResourceImpl as ɵResourceImpl,
  RuntimeError as ɵRuntimeError,
  SIGNAL as ɵSIGNAL,
  SSR_CONTENT_INTEGRITY_MARKER as ɵSSR_CONTENT_INTEGRITY_MARKER,
  TESTABILITY as ɵTESTABILITY,
  TESTABILITY_GETTER as ɵTESTABILITY_GETTER,
  TimerScheduler as ɵTimerScheduler,
  TracingAction as ɵTracingAction,
  TracingService as ɵTracingService,
  USE_RUNTIME_DEPS_TRACKER_FOR_JIT as ɵUSE_RUNTIME_DEPS_TRACKER_FOR_JIT,
  ViewRef$1 as ɵViewRef,
  XSS_SECURITY_URL as ɵXSS_SECURITY_URL,
  ZONELESS_ENABLED as ɵZONELESS_ENABLED,
  _sanitizeHtml as ɵ_sanitizeHtml,
  _sanitizeUrl as ɵ_sanitizeUrl,
  allowSanitizationBypassAndThrow as ɵallowSanitizationBypassAndThrow,
  annotateForHydration as ɵannotateForHydration,
  bypassSanitizationTrustHtml as ɵbypassSanitizationTrustHtml,
  bypassSanitizationTrustResourceUrl as ɵbypassSanitizationTrustResourceUrl,
  bypassSanitizationTrustScript as ɵbypassSanitizationTrustScript,
  bypassSanitizationTrustStyle as ɵbypassSanitizationTrustStyle,
  bypassSanitizationTrustUrl as ɵbypassSanitizationTrustUrl,
  clearResolutionOfComponentResourcesQueue as ɵclearResolutionOfComponentResourcesQueue,
  compileComponent as ɵcompileComponent,
  compileDirective as ɵcompileDirective,
  compileNgModule as ɵcompileNgModule,
  compileNgModuleDefs as ɵcompileNgModuleDefs,
  compileNgModuleFactory as ɵcompileNgModuleFactory,
  compilePipe as ɵcompilePipe,
  convertToBitFlags as ɵconvertToBitFlags,
  createInjector as ɵcreateInjector,
  createOrReusePlatformInjector as ɵcreateOrReusePlatformInjector,
  defaultIterableDiffers as ɵdefaultIterableDiffers,
  defaultKeyValueDiffers as ɵdefaultKeyValueDiffers,
  depsTracker as ɵdepsTracker,
  detectChangesInViewIfRequired as ɵdetectChangesInViewIfRequired,
  devModeEqual as ɵdevModeEqual,
  disableProfiling as ɵdisableProfiling,
  enableProfiling as ɵenableProfiling,
  findLocaleData as ɵfindLocaleData,
  flushModuleScopingQueueAsMuchAsPossible as ɵflushModuleScopingQueueAsMuchAsPossible,
  formatRuntimeError as ɵformatRuntimeError,
  generateStandaloneInDeclarationsError as ɵgenerateStandaloneInDeclarationsError,
  getAsyncClassMetadataFn as ɵgetAsyncClassMetadataFn,
  getClosestComponentName as ɵgetClosestComponentName,
  getComponentDef as ɵgetComponentDef,
  getDebugNode as ɵgetDebugNode,
  getDeferBlocks$1 as ɵgetDeferBlocks,
  getDirectives as ɵgetDirectives,
  getDocument as ɵgetDocument,
  getHostElement as ɵgetHostElement,
  getInjectableDef as ɵgetInjectableDef,
  getLContext as ɵgetLContext,
  getLocaleCurrencyCode as ɵgetLocaleCurrencyCode,
  getLocalePluralCase as ɵgetLocalePluralCase,
  getOutputDestroyRef as ɵgetOutputDestroyRef,
  getSanitizationBypassType as ɵgetSanitizationBypassType,
  ɵgetUnknownElementStrictMode,
  ɵgetUnknownPropertyStrictMode,
  _global as ɵglobal,
  injectChangeDetectorRef as ɵinjectChangeDetectorRef,
  internalCreateApplication as ɵinternalCreateApplication,
  internalProvideZoneChangeDetection as ɵinternalProvideZoneChangeDetection,
  isBoundToModule as ɵisBoundToModule,
  isComponentDefPendingResolution as ɵisComponentDefPendingResolution,
  isEnvironmentProviders as ɵisEnvironmentProviders,
  isInjectable as ɵisInjectable,
  isNgModule as ɵisNgModule,
  isPromise as ɵisPromise,
  isSubscribable as ɵisSubscribable,
  isViewDirty as ɵisViewDirty,
  markForRefresh as ɵmarkForRefresh,
  microtaskEffect as ɵmicrotaskEffect,
  noSideEffects as ɵnoSideEffects,
  patchComponentDefWithScope as ɵpatchComponentDefWithScope,
  performanceMarkFeature as ɵperformanceMarkFeature,
  publishExternalGlobalUtil as ɵpublishExternalGlobalUtil,
  readHydrationInfo as ɵreadHydrationInfo,
  registerLocaleData as ɵregisterLocaleData,
  renderDeferBlockState as ɵrenderDeferBlockState,
  resetCompiledComponents as ɵresetCompiledComponents,
  resetJitOptions as ɵresetJitOptions,
  resolveComponentResources as ɵresolveComponentResources,
  restoreComponentResolutionQueue as ɵrestoreComponentResolutionQueue,
  setAllowDuplicateNgModuleIdsForTest as ɵsetAllowDuplicateNgModuleIdsForTest,
  setAlternateWeakRefImpl as ɵsetAlternateWeakRefImpl,
  ɵsetClassDebugInfo,
  setClassMetadata as ɵsetClassMetadata,
  setClassMetadataAsync as ɵsetClassMetadataAsync,
  setCurrentInjector as ɵsetCurrentInjector,
  setDocument as ɵsetDocument,
  setInjectorProfilerContext as ɵsetInjectorProfilerContext,
  setLocaleId as ɵsetLocaleId,
  ɵsetUnknownElementStrictMode,
  ɵsetUnknownPropertyStrictMode,
  startMeasuring as ɵstartMeasuring,
  stopMeasuring as ɵstopMeasuring,
  store as ɵstore,
  stringify as ɵstringify,
  transitiveScopesFor as ɵtransitiveScopesFor,
  triggerResourceLoading as ɵtriggerResourceLoading,
  truncateMiddle as ɵtruncateMiddle,
  unregisterAllLocaleData as ɵunregisterLocaleData,
  unwrapSafeValue as ɵunwrapSafeValue,
  ɵunwrapWritableSignal,
  withDomHydration as ɵwithDomHydration,
  withEventReplay as ɵwithEventReplay,
  withI18nSupport as ɵwithI18nSupport,
  withIncrementalHydration as ɵwithIncrementalHydration,
  ɵɵCopyDefinitionFeature,
  ɵɵExternalStylesFeature,
  FactoryTarget as ɵɵFactoryTarget,
  ɵɵHostDirectivesFeature,
  ɵɵInheritDefinitionFeature,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattachSourceLocations,
  ɵɵattribute,
  ɵɵattributeInterpolate1,
  ɵɵattributeInterpolate2,
  ɵɵattributeInterpolate3,
  ɵɵattributeInterpolate4,
  ɵɵattributeInterpolate5,
  ɵɵattributeInterpolate6,
  ɵɵattributeInterpolate7,
  ɵɵattributeInterpolate8,
  ɵɵattributeInterpolateV,
  ɵɵclassMap,
  ɵɵclassMapInterpolate1,
  ɵɵclassMapInterpolate2,
  ɵɵclassMapInterpolate3,
  ɵɵclassMapInterpolate4,
  ɵɵclassMapInterpolate5,
  ɵɵclassMapInterpolate6,
  ɵɵclassMapInterpolate7,
  ɵɵclassMapInterpolate8,
  ɵɵclassMapInterpolateV,
  ɵɵclassProp,
  ɵɵcomponentInstance,
  ɵɵconditional,
  ɵɵcontentQuery,
  ɵɵcontentQuerySignal,
  ɵɵdeclareLet,
  ɵɵdefer,
  ɵɵdeferEnableTimerScheduling,
  ɵɵdeferHydrateNever,
  ɵɵdeferHydrateOnHover,
  ɵɵdeferHydrateOnIdle,
  ɵɵdeferHydrateOnImmediate,
  ɵɵdeferHydrateOnInteraction,
  ɵɵdeferHydrateOnTimer,
  ɵɵdeferHydrateOnViewport,
  ɵɵdeferHydrateWhen,
  ɵɵdeferOnHover,
  ɵɵdeferOnIdle,
  ɵɵdeferOnImmediate,
  ɵɵdeferOnInteraction,
  ɵɵdeferOnTimer,
  ɵɵdeferOnViewport,
  ɵɵdeferPrefetchOnHover,
  ɵɵdeferPrefetchOnIdle,
  ɵɵdeferPrefetchOnImmediate,
  ɵɵdeferPrefetchOnInteraction,
  ɵɵdeferPrefetchOnTimer,
  ɵɵdeferPrefetchOnViewport,
  ɵɵdeferPrefetchWhen,
  ɵɵdeferWhen,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdefinePipe,
  ɵɵdirectiveInject,
  ɵɵdisableBindings,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵenableBindings,
  ɵɵgetComponentDepsFactory,
  ɵɵgetCurrentView,
  ɵɵgetInheritedFactory,
  ɵɵgetReplaceMetadataURL,
  ɵɵhostProperty,
  ɵɵi18n,
  ɵɵi18nApply,
  ɵɵi18nAttributes,
  ɵɵi18nEnd,
  ɵɵi18nExp,
  ɵɵi18nPostprocess,
  ɵɵi18nStart,
  ɵɵinject,
  ɵɵinjectAttribute,
  ɵɵinvalidFactory,
  ɵɵinvalidFactoryDep,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceMathML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵngDeclareClassMetadata,
  ɵɵngDeclareClassMetadataAsync,
  ɵɵngDeclareComponent,
  ɵɵngDeclareDirective,
  ɵɵngDeclareFactory,
  ɵɵngDeclareInjectable,
  ɵɵngDeclareInjector,
  ɵɵngDeclareNgModule,
  ɵɵngDeclarePipe,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵpipeBind3,
  ɵɵpipeBind4,
  ɵɵpipeBindV,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpropertyInterpolate,
  ɵɵpropertyInterpolate1,
  ɵɵpropertyInterpolate2,
  ɵɵpropertyInterpolate3,
  ɵɵpropertyInterpolate4,
  ɵɵpropertyInterpolate5,
  ɵɵpropertyInterpolate6,
  ɵɵpropertyInterpolate7,
  ɵɵpropertyInterpolate8,
  ɵɵpropertyInterpolateV,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction3,
  ɵɵpureFunction4,
  ɵɵpureFunction5,
  ɵɵpureFunction6,
  ɵɵpureFunction7,
  ɵɵpureFunction8,
  ɵɵpureFunctionV,
  ɵɵqueryAdvance,
  ɵɵqueryRefresh,
  ɵɵreadContextLet,
  ɵɵreference,
  registerNgModuleType as ɵɵregisterNgModuleType,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵreplaceMetadata,
  ɵɵresetView,
  ɵɵresolveBody,
  ɵɵresolveDocument,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeResourceUrl,
  ɵɵsanitizeScript,
  ɵɵsanitizeStyle,
  ɵɵsanitizeUrl,
  ɵɵsanitizeUrlOrResourceUrl,
  ɵɵsetComponentScope,
  ɵɵsetNgModuleScope,
  ɵɵstoreLet,
  ɵɵstyleMap,
  ɵɵstyleMapInterpolate1,
  ɵɵstyleMapInterpolate2,
  ɵɵstyleMapInterpolate3,
  ɵɵstyleMapInterpolate4,
  ɵɵstyleMapInterpolate5,
  ɵɵstyleMapInterpolate6,
  ɵɵstyleMapInterpolate7,
  ɵɵstyleMapInterpolate8,
  ɵɵstyleMapInterpolateV,
  ɵɵstyleProp,
  ɵɵstylePropInterpolate1,
  ɵɵstylePropInterpolate2,
  ɵɵstylePropInterpolate3,
  ɵɵstylePropInterpolate4,
  ɵɵstylePropInterpolate5,
  ɵɵstylePropInterpolate6,
  ɵɵstylePropInterpolate7,
  ɵɵstylePropInterpolate8,
  ɵɵstylePropInterpolateV,
  ɵɵsyntheticHostListener,
  ɵɵsyntheticHostProperty,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtextInterpolate3,
  ɵɵtextInterpolate4,
  ɵɵtextInterpolate5,
  ɵɵtextInterpolate6,
  ɵɵtextInterpolate7,
  ɵɵtextInterpolate8,
  ɵɵtextInterpolateV,
  ɵɵtrustConstantHtml,
  ɵɵtrustConstantResourceUrl,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵvalidateAttribute,
  ɵɵviewQuery,
  ɵɵviewQuerySignal
};

```

## File: frontend/src/index.html
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Frontend</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>

```

## File: frontend/src/main.ts
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

```

## File: frontend/src/styles.css
```css
/* You can add global styles to this file, and also import other style files */
@tailwind base;
@tailwind components;
@tailwind utilities;

.animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
```

## File: frontend/src/app/app.component.html
```html
<!-- LAYOUT PUBLIC (Header + Footer) -->
<div *ngIf="isPublicLayout" class="flex flex-col min-h-screen">
  <app-header></app-header>

  <main class="flex-grow">
    <router-outlet></router-outlet>
  </main>

  <app-footer></app-footer>
</div>

<!-- LAYOUT ADMIN (Juste le router-outlet, car AdminComponent gère sa propre sidebar/structure) -->
<ng-container *ngIf="!isPublicLayout">
  <router-outlet></router-outlet>
</ng-container>

```

## File: frontend/src/app/app.routes.ts
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard'; // ✅ On utilise uniquement authGuard
import { notFoundGuard } from './core/guards/not-found.guard';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  // --- ROUTES PUBLIQUES ---
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Accueil - E-commerce'
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent),
    title: 'Nos Produits'
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
    title: 'Détail du Produit'
  },

  // --- AUTHENTIFICATION (Redirection si déjà connecté possible via un guestGuard, mais optionnel) ---
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Connexion'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Inscription'
  },

  // --- ROUTES CLIENT (Protégées) ---
  // Pas besoin de rôle spécifique, juste être connecté
  {
    path: '',
    canActivate: [authGuard], 
    children: [
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/order-list/order-list.component').then(m => m.OrderListComponent),
        title: 'Mes Commandes'
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        title: 'Détail de la Commande'
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/orders/checkout/checkout.component').then(m => m.CheckoutComponent),
        title: 'Panier & Paiement'
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Mon Profil'
      }
    ]
  },

  // --- ROUTES ADMIN (Protégées + Rôle ADMIN) ---
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] }, // ✅ Sécurité par Rôle ici
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Admin - Dashboard'
      },
      { 
        path: 'products', 
        loadComponent: () => import('./features/admin/products/products-admin.component').then(m => m.ProductsAdminComponent),
        title: 'Admin - Produits'
      },
      { 
        path: 'orders', 
        loadComponent: () => import('./features/admin/orders/orders-admin.component').then(m => m.OrdersAdminComponent),
        title: 'Admin - Commandes'
      },
      { 
        path: 'promo', 
        loadComponent: () => import('./features/admin/promo/promo-admin.component').then(m => m.PromoAdminComponent),
        title: 'Admin - Promos'
      },

      // ✅ AJOUTEZ CECI À LA FIN DES ENFANTS ADMIN
      // Si l'URL est /admin/nimp, on redirige vers le dashboard admin
      {
        path: '**',
        redirectTo: 'dashboard' 
      }
    ]
  },
  

  // --- WILDCARD (404) ---
  {
    path: '**',
     // Ce composant ne s'affichera jamais car le Guard redirige avant
    canActivate: [notFoundGuard],
    component: HomeComponent, // ✅ Le Guard décide de la redirection (Admin -> Dashboard, User -> Home)
  } 
];

```

## File: frontend/src/app/app.component.spec.ts
```typescript
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'frontend' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('frontend');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, frontend');
  });
});

```

## File: frontend/src/app/app.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Nécessaire pour *ngIf
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'E-commerce Platform';
  isPublicLayout = true; // Par défaut, on affiche le layout public

  constructor(private router: Router) {}

  ngOnInit() {
    // Écouter chaque changement de navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Si l'URL commence par '/admin', on désactive le layout public (header/footer)
      this.isPublicLayout = !event.urlAfterRedirects.startsWith('/admin');
    });
  }
}

```

## File: frontend/src/app/app.config.ts
```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};

```

## File: frontend/src/app/app.component.css
```css

```

## File: frontend/src/app/core/interceptors/auth.interceptor.spec.ts
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn } from '@angular/common/http';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) => 
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});

```

## File: frontend/src/app/core/interceptors/auth.interceptor.ts
```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, BehaviorSubject, filter, take, switchMap } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Exclure les requêtes d'auth (login/register) pour éviter les boucles
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        // 401 Unauthorized : Token expiré ou invalide
        if (error.status === 401) {
          // Logique optionnelle de refresh token ici
          authService.logout();
          router.navigate(['/login']);
        }
        
        // 403 Forbidden : Accès interdit (Rôle insuffisant)
        if (error.status === 403) {
          router.navigate(['/']); // Redirection accueil au lieu de déconnexion brutale
        }
      }
      return throwError(() => error);
    })
  );
};

```

## File: frontend/src/app/core/services/auth.service.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_API = environment.authServiceUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  // BehaviorSubject pour gérer l'état de l'utilisateur connecté
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialiser avec les données du localStorage si disponibles
    const storedUser = this.getUserFromStorage();
    this.currentUserSubject.next(storedUser);
    this.isAuthenticatedSubject.next(!!storedUser && !!this.getToken());
  }

  /**
   * Connexion de l'utilisateur
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_API}/login`, credentials).pipe(
      tap(response => {
        this.saveAuthData(response);
        console.log('✅ Login réussi:', response.user);
      })
    );
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_API}/register`, userData).pipe(
      tap(response => {
        this.saveAuthData(response);
        console.log('✅ Inscription réussie:', response.user);
      })
    );
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    console.log('✅ Logout réussi');
  }

  /**
   * Récupérer le token JWT stocké
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Récupérer le refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Récupérer l'utilisateur actuellement connecté
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Sauvegarder les données d'authentification
   */
  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Récupérer l'utilisateur depuis le localStorage
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error('Erreur parsing user data:', e);
        return null;
      }
    }
    return null;
  }


  /**
   * Rafraîchir le profil utilisateur depuis le backend
   */
  refreshProfile(): Observable<User> {
    return this.http.get<User>(`${this.AUTH_API}/profile`).pipe(
      tap(user => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
        console.log('✅ Profil rafraîchi:', user);
      })
    );
  }

  getUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable(); 
  }
    
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;  // ✅ currentUserSubject
    return user?.role === role;
  }
  
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'ADMIN';
  }

}

```

## File: frontend/src/app/core/services/cart.service.spec.ts
```typescript
import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

```

## File: frontend/src/app/core/services/order.service.spec.ts
```typescript
import { TestBed } from '@angular/core/testing';

import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

```

## File: frontend/src/app/core/services/order.service.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, OrderStatus, OrderStatusLabels, OrderStatusBadgeClasses } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly ORDER_API = `${environment.orderServiceUrl}/orders`; 


  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les commandes de l'utilisateur
   */
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.ORDER_API);
  }

  /**
   * Récupérer une commande par son ID
   */
  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.ORDER_API}/${id}`);
  }

  /**
   * Annuler une commande
   */
  cancelOrder(id: number): Observable<Order> {
    return this.http.put<Order>(`${this.ORDER_API}/${id}/cancel`, {});
  }

  /**
   * Formater le prix
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  /**
   * Obtenir le label du statut en français
   */
  getStatusLabel(status: OrderStatus): string {
    return OrderStatusLabels[status] || status;
  }

  /**
   * Obtenir la classe CSS du badge de statut
   */
  getStatusBadgeClass(status: OrderStatus): string {
    return OrderStatusBadgeClasses[status] || '';
  }
}

```

## File: frontend/src/app/core/services/auth.service.spec.ts
```typescript
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

```

## File: frontend/src/app/core/services/product.service.spec.ts
```typescript
import { TestBed } from '@angular/core/testing';

import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

```

## File: frontend/src/app/core/services/cart.service.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Cart,
  CartItem,
  AddToCartRequest,
  UpdateCartItemRequest,
  ApplyPromoCodeRequest,
  CheckoutRequest,
  CheckoutResponse,
  PaymentMethod
} from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_API = environment.cartServiceUrl;

  // BehaviorSubject pour le panier
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  // BehaviorSubject pour le nombre d'items
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Charger le panier au démarrage
    this.loadCart();
  }

  /**
   * Charger le panier depuis le backend
   */
  loadCart(): void {
    this.http.get<Cart>(`${this.CART_API}`).pipe(
      catchError(error => {
        console.error('Erreur chargement panier:', error);
        return of(null);
      })
    ).subscribe(cart => {
      this.updateCartState(cart);
    });
  }

  /**
   * Obtenir le panier actuel
   */
  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.CART_API}`).pipe(
      tap(cart => this.updateCartState(cart))
    );
  }

  /**
   * Ajouter un produit au panier
   */
  addToCart(productId: number, productName: string, price: number, quantity: number = 1, images: string[] = [],
    ): Observable<Cart> {
    const request: AddToCartRequest = { 
      productId, 
      productName,    // ✅
      price,          // ✅
      quantity ,
      images
    };
    
    return this.http.post<Cart>(`${this.CART_API}/items`, request).pipe(
      tap(cart => {
        this.updateCartState(cart);
        console.log('✅ Produit ajouté au panier:', cart);
      }),
      catchError(error => {
        console.error('❌ Erreur ajout au panier:', error);
        throw error;
      })
    );
  }
  

  /**
   * Mettre à jour la quantité d'un produit
   */
  updateQuantity(productId: number, quantity: number): Observable<Cart> {
    const request: UpdateCartItemRequest = { productId, quantity };
    
    return this.http.put<Cart>(`${this.CART_API}/items/${productId}`, request).pipe(
      tap(cart => {
        this.updateCartState(cart);
        console.log('✅ Quantité mise à jour:', cart);
      }),
      catchError(error => {
        console.error('❌ Erreur mise à jour quantité:', error);
        throw error;
      })
    );
  }

  /**
   * Retirer un produit du panier
   */
  removeFromCart(productId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.CART_API}/items/${productId}`).pipe(
      tap(cart => {
        this.updateCartState(cart);
        console.log('✅ Produit retiré du panier:', cart);
      }),
      catchError(error => {
        console.error('❌ Erreur suppression produit:', error);
        throw error;
      })
    );
  }

  /**
   * Vider le panier
   */
  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.CART_API}/clear`).pipe(
      tap(() => {
        this.updateCartState(null);
        console.log('✅ Panier vidé');
      }),
      catchError(error => {
        console.error('❌ Erreur vidage panier:', error);
        throw error;
      })
    );
  }

  /**
   * Appliquer un code promo
   */
  applyPromoCode(promoCode: string): Observable<Cart> {
    const request: ApplyPromoCodeRequest = { promoCode };
    
    return this.http.post<Cart>(`${this.CART_API}/promo`, request).pipe(
      tap(cart => {
        this.updateCartState(cart);
        console.log('✅ Code promo appliqué:', cart);
      }),
      catchError(error => {
        console.error('❌ Erreur code promo:', error);
        throw error;
      })
    );
  }

  /**
   * Retirer le code promo
   */
  removePromoCode(): Observable<Cart> {
    return this.http.delete<Cart>(`${this.CART_API}/promo`).pipe(
      tap(cart => {
        this.updateCartState(cart);
        console.log('✅ Code promo retiré:', cart);
      }),
      catchError(error => {
        console.error('❌ Erreur suppression promo:', error);
        throw error;
      })
    );
  }

  /**
   * Effectuer le checkout
   */
  checkout(shippingAddress: string, paymentMethod: PaymentMethod = PaymentMethod.CREDIT_CARD): Observable<CheckoutResponse> {
    const request: CheckoutRequest = { shippingAddress, paymentMethod };
    
    return this.http.post<CheckoutResponse>(`${this.CART_API}/checkout`, request).pipe(
      tap(response => {
        if (response.success) {
          this.updateCartState(null); // Vider le panier local
          console.log('✅ Checkout réussi:', response);
        }
      }),
      catchError(error => {
        console.error('❌ Erreur checkout:', error);
        throw error;
      })
    );
  }

  /**
   * Obtenir le panier actuel (valeur synchrone)
   */
  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  /**
   * Obtenir le nombre d'items dans le panier
   */
  getCartCount(): number {
    return this.cartCountSubject.value;
  }

  /**
   * Calculer le sous-total
   */
  getSubtotal(): number {
    const cart = this.cartSubject.value;
    return cart?.subtotal || 0;
  }

  /**
   * Obtenir le total avec réduction
   */
  getTotalAmount(): number {
    const cart = this.cartSubject.value;
    return cart?.totalAmount || 0;
  }

  /**
   * Obtenir la réduction appliquée
   */
  getDiscount(): number {
    const cart = this.cartSubject.value;
    return cart?.discount || 0;
  }

  /**
   * Obtenir le code promo appliqué
   */
  getPromoCode(): string | null {
    const cart = this.cartSubject.value;
    return cart?.promoCode || null;
  }

  /**
   * Mettre à jour l'état du panier
   */
  private updateCartState(cart: Cart | null): void {
    this.cartSubject.next(cart);
    
    const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
    this.cartCountSubject.next(itemCount);
  }

  /**
   * Formater le prix
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }
}

```

## File: frontend/src/app/core/services/product.service.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductPage, ProductFilters, Category } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly PRODUCT_API = environment.productServiceUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer tous les produits avec pagination et filtres
   */
  getProducts(filters?: ProductFilters): Observable<ProductPage> {
    let params = new HttpParams();

    if (filters) {
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
      if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.page !== undefined) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sort) params = params.set('sort', filters.sort);
    }

    return this.http.get<ProductPage>(this.PRODUCT_API, { params });
  }

  /**
   * Récupérer un produit par son ID
   */
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.PRODUCT_API}/${id}`);
  }

  /**
   * Rechercher des produits par nom
   */
  searchProducts(query: string, page: number = 0, size: number = 10): Observable<ProductPage> {
    const params = new HttpParams()
      .set('search', query)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ProductPage>(this.PRODUCT_API, { params });
  }

  /**
   * Récupérer les produits par catégorie
   */
  getProductsByCategory(categoryId: number, page: number = 0, size: number = 10): Observable<ProductPage> {
    const params = new HttpParams()
      .set('categoryId', categoryId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ProductPage>(this.PRODUCT_API, { params });
  }

  /**
   * Récupérer les catégories disponibles
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.PRODUCT_API}/categories`);
  }

  /**
   * Formater le prix
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }
}

```

## File: frontend/src/app/core/guards/auth.guard.spec.ts
```typescript
import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

```

## File: frontend/src/app/core/guards/not-found.guard.ts
```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { take, map } from 'rxjs/operators';

export const notFoundGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.getUser().pipe(
    take(1),
    map(user => {
      if (user?.role === 'ADMIN') {
        return router.createUrlTree(['/admin/dashboard']);
      }
      // Client ou inconnu
      return router.createUrlTree(['/']);
    })
  );
};

```

## File: frontend/src/app/core/guards/auth.guard.ts
```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Récupérer les rôles requis depuis la config de la route
  const requiredRoles = route.data['roles'] as Array<string>;

  return authService.currentUser$.pipe(
    // Optionnel: filtrer si vous avez un état "loading" pour l'auth
    // filter(user => user !== undefined), 
    take(1),
    map(user => {
      // 1. Si pas connecté -> Redirection Login
      if (!user) {
        // createUrlTree est mieux que navigate car il permet au routeur de gérer la redirection proprement
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }

      // 2. Si rôle spécifique requis (ex: ADMIN)
      if (requiredRoles && requiredRoles.length > 0) {
        // Vérifie si l'utilisateur a l'un des rôles requis
        // Note: user.role est une string (ex: 'CUSTOMER'), requiredRoles est ['ADMIN']
        if (!requiredRoles.includes(user.role)) {
          console.warn(`⛔ Accès refusé : Rôle '${user.role}' insuffisant. Requis : ${requiredRoles}`);
          return router.createUrlTree(['/']); // Redirection vers Accueil
        }
      }

      // 3. Tout est OK
      return true;
    })
  );
};

```

## File: frontend/src/app/core/guards/admin.guard.ts
```typescript
import { inject } from '@angular/core';
import { Router, CanActivateChildFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard: CanActivateChildFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getUser().pipe(
    take(1),
    map(user => {
      if (!user || user.role !== 'ADMIN') {
        router.navigate(['/']);
        return false;
      }
      return true;
    })
  );
};

```

## File: frontend/src/app/features/home/home.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  isAuthenticated$!: Observable<boolean>;

  // Catégories de produits
  categories = [
    {
      name: 'Électronique',
      icon: '💻',
      description: 'Derniers gadgets et technologies',
      link: '/products?category=electronics'
    },
    {
      name: 'Mode',
      icon: '👔',
      description: 'Vêtements et accessoires tendance',
      link: '/products?category=fashion'
    },
    {
      name: 'Maison',
      icon: '🏠',
      description: 'Décoration et mobilier',
      link: '/products?category=home'
    },
    {
      name: 'Sport',
      icon: '⚽',
      description: 'Équipements sportifs',
      link: '/products?category=sports'
    }
  ];

  // Caractéristiques principales
  features = [
    {
      icon: '🚚',
      title: 'Livraison rapide',
      description: 'Livraison gratuite dès 50€'
    },
    {
      icon: '🔒',
      title: 'Paiement sécurisé',
      description: 'Transactions 100% sécurisées'
    },
    {
      icon: '↩️',
      title: 'Retours gratuits',
      description: '30 jours pour changer d\'avis'
    },
    {
      icon: '💬',
      title: 'Support 24/7',
      description: 'Service client disponible'
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }
}

```

## File: frontend/src/app/features/home/home.component.css
```css
/* Animation fade-in pour le hero */
@keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.8s ease-out;
  }
  
  /* Effet hover sur les cartes catégories */
  .group:hover {
    cursor: pointer;
  }
  
  /* Transitions douces */
  * {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  
```

## File: frontend/src/app/features/home/home.component.html
```html
<!-- Hero Section -->
<section class="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
    <div class="absolute inset-0 bg-black opacity-10"></div>
    
    <div class="relative container mx-auto px-4 py-20 md:py-32">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-4xl md:text-6xl font-extrabold mb-6 animate-fade-in">
          Bienvenue sur E-Commerce
        </h1>
        <p class="text-xl md:text-2xl mb-8 text-blue-100">
          Découvrez des milliers de produits de qualité à prix imbattables
        </p>
        
        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/products" 
             class="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
            🛍️ Voir les produits
          </a>
          <a *ngIf="!(isAuthenticated$ | async)" 
             routerLink="/register" 
             class="bg-yellow-400 text-blue-900 hover:bg-yellow-300 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
            ✨ Créer un compte
          </a>
        </div>
      </div>
    </div>
    
    <!-- Decorative waves -->
    <div class="absolute bottom-0 left-0 right-0">
      <svg viewBox="0 0 1440 120" class="w-full h-auto">
        <path fill="#ffffff" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
      </svg>
    </div>
  </section>
  
  <!-- Categories Section -->
  <section class="py-16 bg-gray-50">
    <div class="container mx-auto px-4">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Explorez nos catégories
        </h2>
        <p class="text-gray-600 text-lg">
          Trouvez ce que vous cherchez parmi nos collections
        </p>
      </div>
  
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <a *ngFor="let category of categories" 
           [routerLink]="['/products']"
           class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-2 p-6 text-center group">
          <div class="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
            {{ category.icon }}
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            {{ category.name }}
          </h3>
          <p class="text-gray-600 text-sm">
            {{ category.description }}
          </p>
        </a>
      </div>
    </div>
  </section>
  
  <!-- Features Section -->
  <section class="py-16 bg-white">
    <div class="container mx-auto px-4">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Pourquoi nous choisir ?
        </h2>
      </div>
  
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div *ngFor="let feature of features" 
             class="text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="text-5xl mb-4">
            {{ feature.icon }}
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            {{ feature.title }}
          </h3>
          <p class="text-gray-600">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
  
  <!-- CTA Section -->
  <section class="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
    <div class="container mx-auto px-4 text-center">
      <h2 class="text-3xl md:text-4xl font-bold mb-6">
        Prêt à commencer vos achats ?
      </h2>
      <p class="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto">
        Inscrivez-vous maintenant et profitez de nos offres exclusives
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a routerLink="/products" 
           class="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg inline-block">
          Découvrir les produits
        </a>
        <a *ngIf="!(isAuthenticated$ | async)" 
           routerLink="/register" 
           class="bg-yellow-400 text-indigo-900 hover:bg-yellow-300 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg inline-block">
          Créer mon compte gratuitement
        </a>
      </div>
    </div>
  </section>
  
  <!-- Newsletter Section -->
  <section class="py-16 bg-gray-50">
    <div class="container mx-auto px-4">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          📧 Restez informé
        </h2>
        <p class="text-gray-600 mb-8">
          Inscrivez-vous à notre newsletter pour recevoir nos meilleures offres
        </p>
        
        <form class="flex flex-col sm:flex-row gap-4 justify-center">
          <input 
            type="email" 
            placeholder="Votre adresse email"
            class="flex-1 px-6 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button 
            type="submit"
            class="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            S'inscrire
          </button>
        </form>
      </div>
    </div>
  </section>
  
```

## File: frontend/src/app/features/products/product-detail/product-detail.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product!: Product;
  quantity: number = 1;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(Number(id));
    }
  }

  loadProduct(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Produit introuvable';
        this.isLoading = false;
      }
    });
  }

  addToCart(): void {
    this.cartService.addToCart(
      this.product.id, 
      this.product.name,  // ✅
      this.product.price, // ✅
      this.quantity
    ).subscribe({
      next: () => {
        alert(`✅ ${this.product.name} ajouté au panier !`);
      },
      error: (error) => {
        console.error('Erreur ajout panier:', error);
        alert('❌ Erreur lors de l\'ajout au panier');
      }
    });
  }
  

  increaseQuantity(): void {
    if (this.quantity < this.product.stockQuantity) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }
}

```

## File: frontend/src/app/features/products/product-detail/product-detail.component.html
```html
<div class="min-h-screen bg-gray-50 py-8">
  <!-- Loader -->
  <div *ngIf="isLoading" class="flex justify-center items-center py-20">
    <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
  </div>

  <!-- Message d'erreur -->
  <div *ngIf="errorMessage && !product" class="container mx-auto px-4">
    <div class="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg text-center">
      <p class="font-semibold">{{ errorMessage }}</p>
      <a routerLink="/products" class="text-blue-600 hover:underline mt-2 inline-block">
        ← Retour aux produits
      </a>
    </div>
  </div>

  <!-- Détails du produit -->
  <div *ngIf="!isLoading && product" class="container mx-auto px-4">
    <!-- Breadcrumb -->
    <nav class="flex mb-6 text-sm">
      <a routerLink="/" class="text-blue-600 hover:underline">Accueil</a>
      <span class="mx-2 text-gray-400">/</span>
      <a routerLink="/products" class="text-blue-600 hover:underline">Produits</a>
      <span class="mx-2 text-gray-400">/</span>
      <span class="text-gray-600">{{ product.name }}</span>
    </nav>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-xl shadow-lg p-6 lg:p-8">
      <!-- Image principale -->
      <div>
        <div class="mb-4 rounded-lg overflow-hidden bg-gray-100 aspect-square">
          <img
          [src]="'https://via.placeholder.com/600x600?text=Produit'"
            [alt]="product.name"
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      <!-- Informations du produit -->
      <div class="flex flex-col">
        <!-- Catégorie -->
        <div class="mb-3">
          <span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
            {{ product.categoryName || 'Non classé' }}
          </span>
        </div>

        <!-- Nom du produit -->
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          {{ product.name }}
        </h1>

        <!-- Prix -->
        <div class="mb-6">
          <span class="text-4xl font-bold text-blue-600">
            {{ formatPrice(product.price) }}
          </span>
        </div>

        <!-- Stock -->
        <div class="mb-4">
          <span
            class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border"
            [ngClass]="product.stockQuantity === 0
              ? 'bg-red-100 text-red-800 border-red-200'
              : product.stockQuantity < 5
                ? 'bg-orange-100 text-orange-800 border-orange-200'
                : 'bg-green-100 text-green-800 border-green-200'"
          >
            <svg *ngIf="product.stockQuantity > 0" class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <ng-container [ngSwitch]="product.stockQuantity">
              <span *ngSwitchCase="0">Rupture de stock</span>
              <span *ngSwitchCase="1">1 article en stock</span>
              <span *ngSwitchDefault>{{ product.stockQuantity }} en stock</span>
            </ng-container>
          </span>
        </div>

        <!-- Description -->
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Description</h2>
          <p class="text-gray-700 leading-relaxed">
            {{ product.description }}
          </p>
        </div>

        <!-- Sélecteur de quantité -->
        <div class="mb-6" *ngIf="product.stockQuantity > 0">
          <label class="block text-sm font-semibold text-gray-900 mb-2">
            Quantité
          </label>
          <div class="flex items-center space-x-3">
            <button
              (click)="decreaseQuantity()"
              [disabled]="quantity <= 1"
              class="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              −
            </button>
            <span class="text-xl font-semibold text-gray-900 w-12 text-center">
              {{ quantity }}
            </span>
            <button
              (click)="increaseQuantity()"
              [disabled]="quantity >= product.stockQuantity"
              class="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3 mt-auto">
          <button
            *ngIf="product.stockQuantity > 0"
            (click)="addToCart()"
            class="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2 shadow-lg"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Ajouter au panier
          </button>

          <button
            *ngIf="product.stockQuantity === 0"
            disabled
            class="w-full bg-gray-300 text-gray-600 py-4 rounded-lg font-semibold text-lg cursor-not-allowed"
          >
            Produit indisponible
          </button>

          <a
            routerLink="/products"
            class="block text-center text-blue-600 hover:underline text-sm mt-2"
          >
            ← Retour aux produits
          </a>
        </div>

        <!-- Infos supplémentaires -->
        <div class="mt-8 border-t pt-6 space-y-3 text-sm text-gray-600">
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            Livraison gratuite dès 50 €
          </div>
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            Retours gratuits sous 30 jours
          </div>
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            Paiement sécurisé garanti
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

```

## File: frontend/src/app/features/products/product-detail/product-detail.component.css
```css
/* Animation pour les images */
img {
    transition: transform 0.3s ease;
  }
  
  button:hover img {
    transform: scale(1.05);
  }
  
  /* Aspect ratio pour les images */
  .aspect-square {
    aspect-ratio: 1 / 1;
  }
  
  /* Animation pour les boutons */
  button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  button:active {
    transform: scale(0.98);
  }
  
```

## File: frontend/src/app/features/products/product-card/product-card.component.html
```html
<div class="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group h-full flex flex-col">
  <!-- Image du produit -->
  <div class="relative overflow-hidden bg-gray-100 h-64">
    <img 
      [src]="product.images?.[0] || 'https://via.placeholder.com/400x300?text=Produit'" 
      [alt]="product.name"
      class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
    />
    
    <!-- Badge stock -->
    <div class="absolute top-3 right-3">
      <span 
        [class]="getStockBadgeClass()"
        class="px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
        {{ getStockBadge() }}
      </span>
    </div>

    <!-- Badge catégorie -->
    <div class="absolute top-3 left-3">
      <span class="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
        {{ product.categoryName || 'Non classé' }}
      </span>
    </div>
  </div>

  <!-- Contenu de la carte -->
  <div class="p-5 flex-grow flex flex-col">
    <!-- Nom du produit -->
    <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
      {{ product.name }}
    </h3>

    <!-- Description courte -->
    <p class="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
      {{ product.description }}
    </p>

    <!-- Prix -->
    <div class="mb-4">
      <span class="text-2xl font-bold text-blue-600">
        {{ formatPrice(product.price) }}
      </span>
    </div>

    <!-- Boutons d'action -->
    <div class="flex gap-2 mt-auto">
      <!-- Bouton Détails -->
      <a 
        [routerLink]="['/products', product.id]"
        class="flex-1 bg-gray-100 text-gray-900 px-4 py-3 rounded-lg hover:bg-gray-200 hover:shadow-md transition-all duration-200 text-center font-medium text-sm flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        Détails
      </a>

      <!-- Bouton Ajouter au panier -->
      <button 
        (click)="addToCart()"
        [disabled]="product.stockQuantity === 0"
        class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 font-semibold text-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5A2 2 0 007.4 21h9.2a2 2 0 001.9-1.5L21 13M4.6 13H7M16 13h2.4M7 13h8"/>
        </svg>
        {{ product.stockQuantity > 0 ? 'Ajouter' : 'Indisponible' }}
      </button>
    </div>
  </div>
</div>

```

## File: frontend/src/app/features/products/product-card/product-card.component.ts
```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink],
  standalone: true,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() productAdded = new EventEmitter<Product>();

  isAddingToCart = false;

  constructor(private cartService: CartService) {}

  /**
   * Ajouter au panier
   */
  addToCart(): void {
    if (this.product.stockQuantity === 0) return;
  
    this.isAddingToCart = true;
    
    // ✅ CORRECTION : passe name + price
    this.cartService.addToCart(
      this.product.id, 
      this.product.name, 
      this.product.price, 
      1
    ).subscribe({
      next: () => {
        this.isAddingToCart = false;
        this.productAdded.emit(this.product);
        console.log('✅', this.product.name, 'ajouté au panier !');
      },
      error: (error) => {
        this.isAddingToCart = false;
        console.error('❌ Erreur ajout panier:', error);
      }
    });
  }
  

  /**
   * Formater le prix
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  /**
   * Vérifier si le produit est en stock
   */
  isInStock(): boolean {
    return this.product.stockQuantity > 0;
  }

  /**
   * Obtenir le badge de stock
   */
  getStockBadge(): string {
    if (this.product.stockQuantity === 0) return 'Rupture de stock';
    if (this.product.stockQuantity < 5) return 'Stock limité';
    return `${this.product.stockQuantity} en stock`;
  }

  /**
   * Obtenir la classe CSS pour le badge de stock
   */
  getStockBadgeClass(): string {
    if (this.product.stockQuantity === 0) return 'bg-red-100 text-red-800 border border-red-200';
    if (this.product.stockQuantity < 5) return 'bg-orange-100 text-orange-800 border border-orange-200';
    return 'bg-green-100 text-green-800 border border-green-200';
  }
}

```

## File: frontend/src/app/features/products/product-card/product-card.component.css
```css
/* Limiter le nombre de lignes affichées */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Transition pour l'image au survol */
  .group:hover img {
    transform: scale(1.1);
  }
  
```

## File: frontend/src/app/features/products/product-list/product-list.component.css
```css

```

## File: frontend/src/app/features/products/product-list/product-list.component.html
```html
<div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          Nos Produits
        </h1>
        <p class="text-gray-600">
          Découvrez notre sélection de {{ totalElements }} produits
        </p>
      </div>
  
      <!-- Filtres et recherche -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Barre de recherche -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un produit
            </label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                placeholder="Nom du produit..."
                class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>
  
          <!-- Filtre catégorie -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              [(ngModel)]="selectedCategory"
              (change)="onCategoryChange()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Toutes les catégories</option>
              <option *ngFor="let category of categories" [value]="category">
                {{ category }}
              </option>
            </select>
          </div>
  
          <!-- Tri -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Trier par
            </label>
            <select
              [(ngModel)]="sortBy"
              (change)="onSortChange()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="name">Nom A-Z</option>
              <option value="price">Prix croissant</option>
              <option value="price,desc">Prix décroissant</option>
              <option value="createdAt,desc">Nouveautés</option>
            </select>
          </div>
        </div>
  
        <!-- Boutons d'action -->
        <div class="flex gap-4 mt-4">
          <button
            (click)="onSearch()"
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            🔍 Rechercher
          </button>
          <button
            (click)="resetFilters()"
            class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium">
            ↻ Réinitialiser
          </button>
        </div>
      </div>
  
      <!-- Message d'erreur -->
      <div *ngIf="errorMessage" class="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg mb-8">
        {{ errorMessage }}
        <p class="text-sm mt-2">Affichage des produits de démonstration.</p>
      </div>
  
      <!-- Loader -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
  
      <!-- Liste des produits -->
      <div *ngIf="!isLoading && products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <app-product-card *ngFor="let product of products" [product]="product"></app-product-card>
      </div>
  
      <!-- Aucun produit trouvé -->
      <div *ngIf="!isLoading && products.length === 0" class="text-center py-20">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">
          Aucun produit trouvé
        </h3>
        <p class="text-gray-600 mb-6">
          Essayez de modifier vos filtres de recherche
        </p>
        <button
          (click)="resetFilters()"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Réinitialiser les filtres
        </button>
      </div>
  
      <!-- Pagination -->
      <div *ngIf="!isLoading && products.length > 0 && totalPages > 1" class="flex justify-center items-center gap-2 mt-8">
        <!-- Bouton précédent -->
        <button
          (click)="previousPage()"
          [disabled]="currentPage === 0"
          class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          ← Précédent
        </button>
  
        <!-- Numéros de page -->
        <button
          *ngFor="let page of getPageNumbers()"
          (click)="goToPage(page)"
          [class.bg-blue-600]="page === currentPage"
          [class.text-white]="page === currentPage"
          [class.bg-white]="page !== currentPage"
          [class.text-gray-700]="page !== currentPage"
          class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
          {{ page + 1 }}
        </button>
  
        <!-- Bouton suivant -->
        <button
          (click)="nextPage()"
          [disabled]="currentPage === totalPages - 1"
          class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Suivant →
        </button>
      </div>
    </div>
  </div>
  
```

## File: frontend/src/app/features/products/product-list/product-list.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductFilters } from '../../../shared/models';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Pagination
  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  pageSize: number = 12;

  // Filtres
  searchQuery: string = '';
  selectedCategory: string = '';
  sortBy: string = 'name';
  categories: string[] = ['Électronique', 'Mode', 'Maison', 'Sport', 'Livres', 'Beauté'];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  /**
   * Charger les produits avec filtres
   */
  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filters: ProductFilters = {
      page: this.currentPage,
      size: this.pageSize,
      sort: this.sortBy
    };

    if (this.searchQuery) {
      filters.search = this.searchQuery;
    }

    this.productService.getProducts(filters).subscribe({
      next: (response) => {
        this.products = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement produits:', error);
        this.errorMessage = 'Impossible de charger les produits.';
        this.isLoading = false;
        this.products = [];
      }
    });
  }

  /**
   * Rechercher des produits
   */
  onSearch(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  /**
   * Filtrer par catégorie
   */
  onCategoryChange(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  /**
   * Changer le tri
   */
  onSortChange(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.sortBy = 'name';
    this.currentPage = 0;
    this.loadProducts();
  }

  /**
   * Pagination - page suivante
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Pagination - page précédente
   */
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Aller à une page spécifique
   */
  goToPage(page: number): void {
    this.currentPage = page;
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Générer le tableau de numéros de pages
   */
  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}

```

## File: frontend/src/app/features/auth/register/register.component.html
```html
<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
      <!-- En-tête -->
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900">
          Inscription
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Créez votre compte gratuitement
        </p>
      </div>
  
      <!-- Message d'erreur -->
      <div *ngIf="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span class="block sm:inline">{{ errorMessage }}</span>
      </div>
  
      <!-- Formulaire -->
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
        <!-- Champ Nom d'utilisateur -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
            Nom d'utilisateur
          </label>
          <input
            id="username"
            type="text"
            formControlName="username"
            class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Votre nom d'utilisateur"
            [class.border-red-500]="username?.invalid && username?.touched"
          />
          
          <div *ngIf="username?.invalid && username?.touched" class="mt-1 text-sm text-red-600">
            <p *ngIf="username?.errors?.['required']">Le nom d'utilisateur est requis</p>
            <p *ngIf="username?.errors?.['minlength']">Le nom doit contenir au moins 3 caractères</p>
          </div>
        </div>
  
        <!-- Champ Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="exemple@email.com"
            [class.border-red-500]="email?.invalid && email?.touched"
          />
          
          <div *ngIf="email?.invalid && email?.touched" class="mt-1 text-sm text-red-600">
            <p *ngIf="email?.errors?.['required']">L'email est requis</p>
            <p *ngIf="email?.errors?.['email']">Format d'email invalide</p>
          </div>
        </div>
  
        <!-- Champ Mot de passe -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Minimum 6 caractères"
            [class.border-red-500]="password?.invalid && password?.touched"
          />
          
          <div *ngIf="password?.invalid && password?.touched" class="mt-1 text-sm text-red-600">
            <p *ngIf="password?.errors?.['required']">Le mot de passe est requis</p>
            <p *ngIf="password?.errors?.['minlength']">Le mot de passe doit contenir au moins 6 caractères</p>
          </div>
        </div>
  
        <!-- Champ Confirmation mot de passe -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            formControlName="confirmPassword"
            class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Confirmez votre mot de passe"
            [class.border-red-500]="(confirmPassword?.invalid && confirmPassword?.touched) || (registerForm.errors?.['passwordMismatch'] && confirmPassword?.touched)"
          />
          
          <div *ngIf="confirmPassword?.invalid && confirmPassword?.touched" class="mt-1 text-sm text-red-600">
            <p *ngIf="confirmPassword?.errors?.['required']">La confirmation est requise</p>
          </div>
          <div *ngIf="registerForm.errors?.['passwordMismatch'] && confirmPassword?.touched" class="mt-1 text-sm text-red-600">
            <p>Les mots de passe ne correspondent pas</p>
          </div>
        </div>
  
        <!-- Bouton d'inscription -->
        <div>
          <button
            type="submit"
            [disabled]="isLoading"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span *ngIf="!isLoading">S'inscrire</span>
            <span *ngIf="isLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  ircle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Inscription en cours...
              </span>
    
          </button>
        </div>
  
        <!-- Lien vers connexion -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            Vous avez déjà un compte ?
            <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
              Se connecter
            </a>
          </p>
        </div>
      </form>
    </div>
  </div>
  
```

## File: frontend/src/app/features/auth/register/register.component.ts
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialiser le formulaire avec validation
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  // Getters pour accéder facilement aux champs du formulaire
  get username() {
    return this.registerForm.get('username');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // ✅ CORRECTION ICI : Mappage de 'username' vers 'name' pour le Backend
    const formValue = this.registerForm.value;
    const registerData = {
      name: formValue.username, // Le backend attend 'name', pas 'username'
      email: formValue.email,
      password: formValue.password
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Inscription réussie', response);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Erreur d\'inscription', error);
        this.isLoading = false;
        
        if (error.status === 409) {
          this.errorMessage = 'Cet email est déjà utilisé';
        } else if (error.status === 400) {
           // Affiche l'erreur technique si besoin pour le debug
           this.errorMessage = error.error?.error || 'Données invalides';
        } else if (error.status === 0) {
          this.errorMessage = 'Impossible de contacter le serveur.';
        } else {
          this.errorMessage = 'Une erreur est survenue.';
        }
      }
    });
  }
}

```

## File: frontend/src/app/features/auth/register/register.component.css
```css

```

## File: frontend/src/app/features/auth/login/login.component.ts
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Initialiser le formulaire avec validation
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Récupérer l'URL de retour depuis les query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // Getters pour accéder facilement aux champs du formulaire
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    this.errorMessage = '';
  
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
  
    this.isLoading = true;
  
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Vérification immédiate du rôle dans la réponse ou le service
        const user = response.user; // ou this.authService.getCurrentUser()
        
        if (user?.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          // Si une returnUrl existe (tentative d'accès page protégée), on l'utilise, sinon Accueil
          const redirect = this.returnUrl && this.returnUrl !== '/' ? this.returnUrl : '/';
          this.router.navigateByUrl(redirect);
        }
      },
          error: (error) => {
        console.error('❌ Erreur de connexion', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Email ou mot de passe incorrect';
        } else if (error.status === 0) {
          this.errorMessage = 'Impossible de contacter le serveur';
        } else {
          this.errorMessage = 'Une erreur est survenue';
        }
      }
    });
  }
  
}

```

## File: frontend/src/app/features/auth/login/login.component.css
```css
/* Animation pour le spinner */
@keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
```

## File: frontend/src/app/features/auth/login/login.component.html
```html
<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
      <!-- En-tête -->
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900">
          Connexion
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Accédez à votre compte
        </p>
      </div>
  
      <!-- Message d'erreur -->
      <div *ngIf="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span class="block sm:inline">{{ errorMessage }}</span>
      </div>
  
      <!-- Formulaire -->
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
        <!-- Champ Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="exemple@email.com"
            [class.border-red-500]="email?.invalid && email?.touched"
          />
          
          <!-- Messages d'erreur pour email -->
          <div *ngIf="email?.invalid && email?.touched" class="mt-1 text-sm text-red-600">
            <p *ngIf="email?.errors?.['required']">L'email est requis</p>
            <p *ngIf="email?.errors?.['email']">Format d'email invalide</p>
          </div>
        </div>
  
        <!-- Champ Mot de passe -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Votre mot de passe"
            [class.border-red-500]="password?.invalid && password?.touched"
          />
          
          <!-- Messages d'erreur pour mot de passe -->
          <div *ngIf="password?.invalid && password?.touched" class="mt-1 text-sm text-red-600">
            <p *ngIf="password?.errors?.['required']">Le mot de passe est requis</p>
            <p *ngIf="password?.errors?.['minlength']">Le mot de passe doit contenir au moins 6 caractères</p>
          </div>
        </div>
  
        <!-- Lien mot de passe oublié -->
        <div class="flex items-center justify-between">
          <div class="text-sm">
            <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
              Mot de passe oublié ?
            </a>
          </div>
        </div>
  
        <!-- Bouton de connexion -->
        <div>
          <button
            type="submit"
            [disabled]="isLoading"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span *ngIf="!isLoading">Se connecter</span>
            <span *ngIf="isLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  ircle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Connexion en cours...
              </span>
    
          </button>
        </div>
  
        <!-- Lien vers inscription -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            Pas encore de compte ?
            <a routerLink="/register" class="font-medium text-blue-600 hover:text-blue-500">
              S'inscrire
            </a>
          </p>
        </div>
      </form>
    </div>
  </div>
  
```

## File: frontend/src/app/features/admin/admin.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  user$!: Observable<User | null>;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user$ = this.authService.getUser();
  }

  logout() {
    this.authService.logout();
  }
}

```

## File: frontend/src/app/features/admin/admin.component.css
```css
/* Layout General */
.admin-container {
    display: flex;
    min-height: 100vh;
    background-color: #f3f4f6; /* bg-gray-100 */
  }
  
  /* Sidebar Styles */
  .admin-sidebar {
    display: none;
    width: 16rem; /* w-64 */
    background-color: #1e293b; /* bg-slate-800 */
    color: white;
    flex-direction: column;
    position: fixed;
    height: 100%;
    transition: all 0.3s;
    z-index: 20;
  }
  
  @media (min-width: 768px) {
    .admin-sidebar {
      display: flex;
    }
  }
  
  .sidebar-header {
    height: 4rem;
    display: flex;
    align-items: center;
    padding-left: 1.5rem;
    border-bottom: 1px solid #334155; /* border-slate-700 */
    background-color: #0f172a; /* bg-slate-900 */
  }
  
  .logo-icon {
    color: #60a5fa; /* text-blue-400 */
    margin-right: 0.75rem;
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(to right, #60a5fa, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0.5rem;
  }
  
  .nav-link {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    color: #cbd5e1; /* text-slate-300 */
    transition: all 0.2s;
    margin-bottom: 0.25rem;
  }
  
  .nav-link:hover {
    background-color: #334155; /* bg-slate-700 */
    color: white;
  }
  
  .nav-link.active {
    background-color: #334155; /* bg-slate-700 */
    color: #60a5fa; /* text-blue-400 */
    font-weight: 500;
  }
  
  .nav-link .icon {
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }
  
  /* Footer Sidebar */
  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid #334155;
    background-color: #0f172a;
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    background-color: #3b82f6; /* bg-blue-500 */
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
  }
  
  .user-info {
    margin-left: 0.75rem;
  }
  
  .user-info .name {
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
  }
  
  .user-info .email {
    font-size: 0.75rem;
    color: #94a3b8; /* text-slate-400 */
  }
  
  .logout-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    background-color: #dc2626; /* bg-red-600 */
    color: white;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .logout-btn:hover {
    background-color: #b91c1c; /* bg-red-700 */
  }
  
  .logout-btn svg {
    margin-right: 0.5rem;
  }
  
  /* Main Content */
  .admin-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  @media (min-width: 768px) {
    .admin-content {
      margin-left: 16rem;
    }
  }
  
  .mobile-header {
    background-color: white;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .content-wrapper {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }
  
```

## File: frontend/src/app/features/admin/admin.component.html
```html
<div class="admin-container">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
          </svg>
        </div>
        <span class="logo-text">Admin Panel</span>
      </div>
  
      <!-- Navigation -->
      <nav class="sidebar-nav">
        <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">
          <span class="icon">📊</span>
          <span>Tableau de bord</span>
        </a>
        <a routerLink="/admin/orders" routerLinkActive="active" class="nav-link">
          <span class="icon">📦</span>
          <span>Commandes</span>
        </a>
        <a routerLink="/admin/products" routerLinkActive="active" class="nav-link">
          <span class="icon">🛍️</span>
          <span>Produits</span>
        </a>
        <a routerLink="/admin/promo" routerLinkActive="active" class="nav-link">
          <span class="icon">🎟️</span>
          <span>Promotions</span>
        </a>
      </nav>
  
      <!-- User Profile & Logout -->
      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="avatar">
            <span>A</span>
          </div>
          <div class="user-info">
            <p class="name">Administrateur</p>
            <!-- ✅ CORRECTION ICI : Utilisation du code HTML &#64; au lieu du symbole @ -->
            <p class="email">{{ (user$ | async)?.email }}</p>
          </div>
        </div>
        <button (click)="logout()" class="logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  
    <!-- Main Content -->
    <main class="admin-content">
      <!-- Header Mobile (visible uniquement sur mobile) -->
      <header class="mobile-header md:hidden">
        <span class="mobile-title">Admin Panel</span>
        <button class="mobile-menu-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </header>
  
      <div class="content-wrapper">
        <router-outlet></router-outlet>
      </div>
    </main>
  </div>
  
```

## File: frontend/src/app/features/admin/products/products-admin.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-products-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Produits</h1>
        <button (click)="openCreateModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          ➕ Nouveau Produit
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let product of products">
              <td class="px-6 py-4">
                <img 
                  [src]="product.images?.[0] || 'https://via.placeholder.com/50'" 
                  class="h-10 w-10 rounded object-cover"
                >
              </td>
              <td class="px-6 py-4 font-medium text-gray-900">{{ product.name }}</td>
              <td class="px-6 py-4 text-gray-600">{{ product.price | currency:'EUR' }}</td>
              <td class="px-6 py-4">
                <span 
                  [class]="product.stockQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ product.stockQuantity }} en stock
                </span>
              </td>
              <td class="px-6 py-4 space-x-2">
                <button (click)="editProduct(product)" class="text-indigo-600 hover:text-indigo-900">✏️</button>
                <button (click)="deleteProduct(product.id)" class="text-red-600 hover:text-red-900">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-xl w-full max-w-lg">
          <h2 class="text-xl font-bold mb-4">{{ isEditing ? 'Modifier' : 'Créer' }} un Produit</h2>
          <form [formGroup]="productForm" (ngSubmit)="submitForm()" class="space-y-4">
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Nom</label>
              <input formControlName="name" type="text" class="w-full border rounded p-2">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Prix</label>
                <input formControlName="price" type="number" class="w-full border rounded p-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Stock</label>
                <input formControlName="stockQuantity" type="number" class="w-full border rounded p-2">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <textarea formControlName="description" class="w-full border rounded p-2"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Image URL</label>
              <input formControlName="imageUrl" type="text" class="w-full border rounded p-2">
            </div>

            <div class="flex justify-end space-x-2 mt-4">
              <button type="button" (click)="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
              <button type="submit" [disabled]="productForm.invalid" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ProductsAdminComponent implements OnInit {
  products: Product[] = [];
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  productForm: FormGroup;

  private readonly API_URL = `${environment.productServiceUrl}`;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      imageUrl: [''],           // UI-only field
      categoryId: [1]
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.http.get<{ content: Product[] }>(this.API_URL).subscribe({
      next: (response) => this.products = response.content || [],
      error: (err) => console.error('Erreur loading products', err)
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.productForm.reset({ price: 0, stockQuantity: 0, categoryId: 1, imageUrl: '' });
    this.showModal = true;
  }

  editProduct(product: Product) {
    this.isEditing = true;
    this.editingId = product.id;

    // Fill first image
    this.productForm.patchValue({
      ...product,
      imageUrl: product.images?.[0] || ''
    });

    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  submitForm() {
    if (this.productForm.invalid) return;

    const form = this.productForm.value;

    const data: any = {
      ...form,
      images: form.imageUrl ? [form.imageUrl] : []
    };

    delete data.imageUrl; // Not part of backend model

    if (this.isEditing && this.editingId) {
      this.http.put(`${this.API_URL}/${this.editingId}`, data).subscribe(() => {
        this.loadProducts();
        this.closeModal();
      });
    } else {
      this.http.post(this.API_URL, data).subscribe(() => {
        this.loadProducts();
        this.closeModal();
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('Supprimer ce produit ?')) {
      this.http.delete(`${this.API_URL}/${id}`).subscribe(() => this.loadProducts());
    }
  }
}

```

## File: frontend/src/app/features/admin/dashboard/dashboard.component.css
```css
.dashboard-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  /* Header */
  .dashboard-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background-color: white;
    padding: 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid #f3f4f6;
  }
  
  @media (min-width: 768px) {
    .dashboard-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }
  
  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .page-subtitle {
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .date-badge {
    background-color: #eff6ff;
    color: #1d4ed8;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  /* Stats Cards */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  .stat-card {
    background-color: white;
    padding: 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s;
    border-left-width: 4px;
  }
  
  .stat-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .stat-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .stat-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
  }
  
  .stat-value {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1f2937;
    margin-top: 0.5rem;
  }
  
  .stat-icon {
    padding: 0.5rem;
    border-radius: 0.5rem;
    font-size: 1.5rem;
  }
  
  /* Colors */
  .border-green { border-left-color: #22c55e; }
  .bg-green { background-color: #dcfce7; color: #16a34a; }
  .text-green { color: #16a34a; }
  
  .border-blue { border-left-color: #3b82f6; }
  .bg-blue { background-color: #dbeafe; color: #2563eb; }
  .text-blue { color: #2563eb; }
  
  .border-orange { border-left-color: #f97316; }
  .bg-orange { background-color: #ffedd5; color: #ea580c; }
  
  .border-purple { border-left-color: #a855f7; }
  .bg-purple { background-color: #f3e8ff; color: #9333ea; }
  
  /* Content Grid */
  .content-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  @media (min-width: 1024px) {
    .content-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .card {
    background-color: white;
    padding: 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid #f3f4f6;
  }
  
  .card-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1rem;
  }
  
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    transition: all 0.2s;
    text-align: center;
    cursor: pointer;
  }
  
  .action-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    transition: transform 0.2s;
  }
  
  .action-btn:hover .action-icon {
    transform: scale(1.1);
  }
  
  .action-text {
    font-weight: 500;
    color: #374151;
  }
  
  .hover-blue:hover { background-color: #eff6ff; border-color: #bfdbfe; }
  .hover-blue:hover .action-text { color: #2563eb; }
  
  .hover-purple:hover { background-color: #faf5ff; border-color: #e9d5ff; }
  .hover-purple:hover .action-text { color: #9333ea; }
  
  .hover-green:hover { background-color: #f0fdf4; border-color: #bbf7d0; }
  .hover-green:hover .action-text { color: #16a34a; }
  
  /* Performance List */
  .performance-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .performance-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background-color: #f9fafb;
    border-radius: 0.5rem;
  }
  
  .perf-label {
    color: #4b5563;
  }
  
  .perf-value {
    font-weight: 700;
    color: #111827;
  }
  
  /* Skeleton */
  .loading-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }
  
  .skeleton-card {
    height: 8rem;
    background-color: #e5e7eb;
    border-radius: 0.75rem;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }
  
```

## File: frontend/src/app/features/admin/dashboard/dashboard.component.html
```html
<div class="dashboard-container">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div>
        <h1 class="page-title">Tableau de Bord</h1>
        <p class="page-subtitle">Aperçu de votre activité e-commerce en temps réel.</p>
      </div>
      <div class="date-badge">
        {{ today | date:'fullDate' }}
      </div>
    </div>
  
    <!-- Loading Skeleton -->
    <div *ngIf="loading" class="loading-grid">
      <div *ngFor="let i of [1,2,3,4]" class="skeleton-card"></div>
    </div>
  
    <!-- Stats Grid -->
    <div *ngIf="!loading" class="stats-grid">
      <!-- CA -->
      <div class="stat-card border-green">
        <div class="stat-content">
          <div>
            <p class="stat-label">Chiffre d'affaires</p>
            <h3 class="stat-value">{{ stats.totalRevenue | currency:'EUR':'symbol':'1.0-0' }}</h3>
          </div>
          <div class="stat-icon bg-green">💰</div>
        </div>
      </div>
  
      <!-- Commandes -->
      <div class="stat-card border-blue">
        <div class="stat-content">
          <div>
            <p class="stat-label">Commandes Totales</p>
            <h3 class="stat-value">{{ stats.totalOrders }}</h3>
          </div>
          <div class="stat-icon bg-blue">📦</div>
        </div>
      </div>
  
      <!-- En Attente -->
      <div class="stat-card border-orange">
        <div class="stat-content">
          <div>
            <p class="stat-label">En Attente</p>
            <h3 class="stat-value">{{ stats.pendingOrders }}</h3>
          </div>
          <div class="stat-icon bg-orange">⏳</div>
        </div>
      </div>
  
      <!-- Produits -->
      <div class="stat-card border-purple">
        <div class="stat-content">
          <div>
            <p class="stat-label">Produits</p>
            <h3 class="stat-value">{{ stats.totalProducts }}</h3>
          </div>
          <div class="stat-icon bg-purple">🛍️</div>
        </div>
      </div>
    </div>
  
    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Quick Actions -->
      <div class="card">
        <h3 class="card-title">Actions Rapides</h3>
        <div class="actions-grid">
          <a routerLink="/admin/orders" class="action-btn hover-blue">
            <div class="action-icon">📦</div>
            <span class="action-text">Gérer les commandes</span>
          </a>
          <a routerLink="/admin/products" class="action-btn hover-purple">
            <div class="action-icon">➕</div>
            <span class="action-text">Ajouter un produit</span>
          </a>
          <a routerLink="/admin/promo" class="action-btn hover-green">
            <div class="action-icon">🏷️</div>
            <span class="action-text">Créer une promo</span>
          </a>
        </div>
      </div>
  
      <!-- Monthly Performance -->
      <div class="card">
        <h3 class="card-title">Performance du Mois</h3>
        <ul class="performance-list">
          <li class="performance-item">
            <span class="perf-label">Nouvelles Commandes</span>
            <span class="perf-value">{{ stats.ordersThisMonth }}</span>
          </li>
          <li class="performance-item">
            <span class="perf-label">Revenus Générés</span>
            <span class="perf-value text-green">+{{ stats.revenueThisMonth | currency:'EUR':'symbol':'1.0-0' }}</span>
          </li>
          <li class="performance-item">
            <span class="perf-label">Nouveaux Clients</span>
            <span class="perf-value text-blue">+{{ stats.newUsersThisMonth }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  
```

## File: frontend/src/app/features/admin/dashboard/dashboard.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RouterLink } from '@angular/router';

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  newUsersThisMonth: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: AdminStats = {
    totalOrders: 0, totalRevenue: 0, totalProducts: 0, totalUsers: 0,
    pendingOrders: 0, confirmedOrders: 0, processingOrders: 0,
    shippedOrders: 0, deliveredOrders: 0, ordersThisMonth: 0,
    revenueThisMonth: 0, newUsersThisMonth: 0
  };
  
  loading = true;
  today = new Date();
  private readonly STATS_API = `${environment.orderServiceUrl}/admin/stats`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get<AdminStats>(this.STATS_API).subscribe({
      next: (data) => {
        this.stats = { ...this.stats, ...data };
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement stats:', error);
        this.loading = false;
      }
    });
  }
}

```

## File: frontend/src/app/features/admin/orders/orders-admin.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Order, OrderStatus, OrderStatusLabels, OrderStatusBadgeClasses } from '../../../shared/models';

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p class="text-sm text-gray-600 mt-1">{{ orders.length }} commande(s) au total</p>
        </div>
        <div class="flex items-center space-x-3">
          <select [(ngModel)]="statusFilter" (change)="filterOrders()" 
                  class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmée</option>
            <option value="PROCESSING">En préparation</option>
            <option value="SHIPPED">Expédiée</option>
            <option value="DELIVERED">Livrée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
          <button (click)="loadOrders()" 
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            🔄 Actualiser
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Chargement...</p>
      </div>

      <!-- Orders Table -->
      <div *ngIf="!isLoading" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Commande</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let order of filteredOrders" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{{ order.id }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                {{ order.orderNumber }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {{ order.userId }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {{ formatPrice(order.totalAmount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getStatusBadgeClass(order.status)">
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ formatDate(order.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <button *ngIf="order.status === 'PENDING'" 
                        (click)="updateStatus(order.id, 'CONFIRMED')"
                        class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                  ✅ Confirmer
                </button>
                <button *ngIf="order.status === 'CONFIRMED'" 
                        (click)="updateStatus(order.id, 'PROCESSING')"
                        class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  🛠️ Préparer
                </button>
                <button *ngIf="order.status === 'PROCESSING'" 
                        (click)="updateStatus(order.id, 'SHIPPED')"
                        class="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">
                  📦 Expédier
                </button>
                <button *ngIf="order.status === 'SHIPPED'" 
                        (click)="updateStatus(order.id, 'DELIVERED')"
                        class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                  🎁 Livré
                </button>
                <button (click)="viewDetails(order.id)" 
                        class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">
                  👁️ Voir
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div *ngIf="filteredOrders.length === 0" class="text-center py-12">
          <p class="text-gray-500">Aucune commande trouvée</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-xl text-white">
          <p class="text-sm opacity-90">En attente</p>
          <p class="text-3xl font-bold">{{ getCountByStatus('PENDING') }}</p>
        </div>
        <div class="bg-gradient-to-r from-blue-400 to-blue-600 p-6 rounded-xl text-white">
          <p class="text-sm opacity-90">Confirmées</p>
          <p class="text-3xl font-bold">{{ getCountByStatus('CONFIRMED') }}</p>
        </div>
        <div class="bg-gradient-to-r from-purple-400 to-purple-600 p-6 rounded-xl text-white">
          <p class="text-sm opacity-90">Expédiées</p>
          <p class="text-3xl font-bold">{{ getCountByStatus('SHIPPED') }}</p>
        </div>
        <div class="bg-gradient-to-r from-green-400 to-green-600 p-6 rounded-xl text-white">
          <p class="text-sm opacity-90">Livrées</p>
          <p class="text-3xl font-bold">{{ getCountByStatus('DELIVERED') }}</p>
        </div>
      </div>
    </div>
  `
})
export class OrdersAdminComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = false;
  statusFilter = '';

  // CORRECTION : Utilisation de l'URL admin/orders et non orders/admin/orders
  // Assurez-vous que environment.orderServiceUrl pointe vers http://localhost:8083/api
  private readonly ADMIN_ORDER_API = `${environment.orderServiceUrl}/admin/orders`;
  private readonly ORDER_API_BASE = `${environment.orderServiceUrl}/admin`; // Pour les updates

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    // Appel vers /api/admin/orders
    this.http.get<Order[]>(this.ADMIN_ORDER_API).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filteredOrders = orders;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement commandes:', error);
        this.isLoading = false;
      }
    });
  }

  // filterOrders() {
  //   if (this.statusFilter) {
  //     this.filteredOrders = this.orders.filter(o => o.status === this.statusFilter);
  //   } else {
  //     this.filteredOrders = this.orders;
  //   }
  // }
  filterOrders() {
    // Si pas de filtre, on remet tout
    if (!this.statusFilter || this.statusFilter === '') {
      this.filteredOrders = this.orders;
    } else {
      // Filtrage exact
      this.filteredOrders = this.orders.filter(o => o.status === this.statusFilter);
    }
  }


  updateStatus(orderId: number, newStatus: string) {
    if (!confirm(`Confirmer le changement de statut vers "${newStatus}" ?`)) return;

    // CORRECTION : Appel vers /api/admin/orders/{id}/status
    this.http.put(`${this.ADMIN_ORDER_API}/${orderId}/status`, { status: newStatus }).subscribe({
      next: () => {
        alert('✅ Statut mis à jour !');
        this.loadOrders();
      },
      error: (error) => {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la mise à jour');
      }
    });
  }

  viewDetails(orderId: number) {
    window.open(`/orders/${orderId}`, '_blank');
  }

  getStatusLabel(status: string): string {
    return OrderStatusLabels[status as OrderStatus] || status;
  }

  getStatusBadgeClass(status: string): string {
    return OrderStatusBadgeClasses[status as OrderStatus] || '';
  }

  getCountByStatus(status: string): number {
    return this.orders.filter(o => o.status === status).length;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}

```

## File: frontend/src/app/features/admin/promo/promo-admin.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

// Interface alignée avec votre Backend (PromoCode.java)
interface PromoCode {
  code: string;
  description: string;
  discountPercent: number;
  minAmount?: number;
  maxDiscount?: number;
  expiresAt: string; // LocalDateTime string from backend
  active: boolean;
  createdAt?: string;
}

@Component({
  selector: 'app-promo-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header avec Stats -->
      <div class="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
            🎟️ Codes Promo
            <span class="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
              {{ promoCodes.length }}
            </span>
          </h1>
          <p class="text-gray-500 mt-2">Gérez vos campagnes de réduction</p>
        </div>
        <button (click)="openCreateForm()" 
                class="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
          <span>➕</span> Nouveau Code
        </button>
      </div>

      <!-- Formulaire de Création / Édition (Modale simplifiée inline) -->
      <div *ngIf="showForm" class="bg-white p-8 rounded-xl shadow-lg border-2 border-indigo-50 transform transition-all">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {{ editingCode ? '✏️ Modifier' : '✨ Créer' }} un Code Promo
          </h2>
          <button (click)="resetForm()" class="text-gray-400 hover:text-gray-600">❌</button>
        </div>

        <form [formGroup]="promoForm" (ngSubmit)="submitForm()" class="space-y-6">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Code -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Code Promo *</label>
              <div class="relative">
                <input type="text" formControlName="code" 
                       [readonly]="!!editingCode"
                       class="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase tracking-wider font-bold"
                       placeholder="SUMMER2025"
                       [class.bg-gray-100]="!!editingCode">
              </div>
              <p *ngIf="f['code'].invalid && f['code'].touched" class="text-red-500 text-xs mt-1">
                Requis (3-20 caractères alphanumériques)
              </p>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <input type="text" formControlName="description" 
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="Réduction spéciale été">
            </div>

            <!-- Réduction % -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Réduction (%) *</label>
              <div class="relative">
                <input type="number" formControlName="discountPercent" 
                       class="w-full pl-4 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       placeholder="20">
                <span class="absolute right-4 top-3 text-gray-400">%</span>
              </div>
            </div>

            <!-- Expiration -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Expire le *</label>
              <input type="datetime-local" formControlName="expiresAt" 
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>

            <!-- Min Amount -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Montant Min. (€)</label>
              <input type="number" formControlName="minAmount" 
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="0">
            </div>

            <!-- Max Discount -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Réduction Max. (€)</label>
              <input type="number" formControlName="maxDiscount" 
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="Illimité">
            </div>
          </div>

          <!-- Actif Toggle -->
          <div class="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input type="checkbox" formControlName="active" id="active" 
                   class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer">
            <label for="active" class="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none">
              Activer ce code promo immédiatement
            </label>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-4 pt-4 border-t border-gray-100">
            <button type="button" (click)="resetForm()" 
                    class="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
              Annuler
            </button>
            <button type="submit" [disabled]="promoForm.invalid || isSubmitting"
                    class="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2">
              <span *ngIf="isSubmitting" class="animate-spin">⌛</span>
              {{ editingCode ? 'Mettre à jour' : 'Sauvegarder' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Code / Desc</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Réduction</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Conditions</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Validité</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let promo of promoCodes" class="hover:bg-gray-50 transition-colors">
                
                <!-- Code & Desc -->
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="text-sm font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit">
                      {{ promo.code }}
                    </span>
                    <span class="text-xs text-gray-500 mt-1">{{ promo.description || 'Pas de description' }}</span>
                  </div>
                </td>

                <!-- Réduction -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-green-600">
                    -{{ promo.discountPercent }}%
                  </div>
                  <div *ngIf="promo.maxDiscount" class="text-xs text-gray-400">
                    Max: {{ promo.maxDiscount }}€
                  </div>
                </td>

                <!-- Conditions -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div *ngIf="promo.minAmount && promo.minAmount > 0; else noCond">
                    Min: <span class="font-semibold">{{ promo.minAmount }}€</span>
                  </div>
                  <ng-template #noCond>
                    <span class="text-gray-400 italic">Aucune</span>
                  </ng-template>
                </td>

                <!-- Validité -->
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div [class.text-red-500]="isExpired(promo.expiresAt)" class="text-gray-700">
                    {{ formatDate(promo.expiresAt) }}
                  </div>
                  <div *ngIf="isExpired(promo.expiresAt)" class="text-xs text-red-500 font-bold">Expiré</div>
                </td>

                <!-- Statut -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="promo.active && !isExpired(promo.expiresAt) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                        class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ promo.active && !isExpired(promo.expiresAt) ? 'Actif' : 'Inactif' }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button (click)="editPromo(promo)" class="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors">
                    ✏️ Modifier
                  </button>
                  <button (click)="deletePromo(promo.code)" class="text-red-600 hover:text-red-900 transition-colors">
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div *ngIf="promoCodes.length === 0" class="text-center py-12 bg-gray-50">
            <div class="text-6xl mb-4">🎫</div>
            <h3 class="text-lg font-medium text-gray-900">Aucun code promo</h3>
            <p class="text-gray-500 mt-2">Créez votre première campagne marketing !</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class PromoAdminComponent implements OnInit {
  promoCodes: PromoCode[] = [];
  promoForm: FormGroup;
  showForm = false;
  editingCode: string | null = null;
  isSubmitting = false;

  // L'URL correcte vers CartService
  private readonly PROMO_API = `${environment.cartServiceUrl}/promo-codes`; 

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.promoForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern('^[A-Z0-9]+$')]],
      description: [''],
      discountPercent: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      expiresAt: ['', Validators.required],
      minAmount: [0, Validators.min(0)],
      maxDiscount: [null, Validators.min(0)], // Optionnel
      active: [true]
    });
  }

  ngOnInit() {
    this.loadPromoCodes();
  }

  get f() { return this.promoForm.controls; }

  loadPromoCodes() {
    this.http.get<PromoCode[]>(this.PROMO_API).subscribe({
      next: (codes) => {
        // Trier par date de création (les plus récents en premier)
        // Note: Assurez-vous que le backend renvoie createdAt, sinon triez par expiresAt ou autre
        this.promoCodes = codes.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      },
      error: (error) => console.error('Erreur chargement codes:', error)
    });
  }

  openCreateForm() {
    this.resetForm();
    this.showForm = true;
    
    // Valeur par défaut : expire dans 1 mois
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    this.promoForm.patchValue({ expiresAt: this.toDatetimeLocal(nextMonth.toISOString()) });
  }

  submitForm() {
    if (this.promoForm.invalid) {
      this.promoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.promoForm.getRawValue();

    // S'assurer que le code est en majuscule
    formValue.code = formValue.code.toUpperCase();

    if (this.editingCode) {
      // Update
      this.http.put(`${this.PROMO_API}/${this.editingCode}`, formValue).subscribe({
        next: () => {
          this.loadPromoCodes();
          this.resetForm();
        },
        error: (err) => {
          alert('Erreur modification: ' + (err.error?.message || 'Erreur inconnue'));
          this.isSubmitting = false;
        }
      });
    } else {
      // Create
      this.http.post(this.PROMO_API, formValue).subscribe({
        next: () => {
          this.loadPromoCodes();
          this.resetForm();
        },
        error: (err) => {
          alert('Erreur création: ' + (err.error?.message || 'Code existant ?'));
          this.isSubmitting = false;
        }
      });
    }
  }

  editPromo(promo: PromoCode) {
    this.editingCode = promo.code;
    this.showForm = true;
    
    this.promoForm.patchValue({
      code: promo.code,
      description: promo.description,
      discountPercent: promo.discountPercent,
      minAmount: promo.minAmount,
      maxDiscount: promo.maxDiscount,
      active: promo.active,
      expiresAt: this.toDatetimeLocal(promo.expiresAt)
    });
    
    // Le code ne peut pas être modifié une fois créé (clé primaire)
    this.promoForm.get('code')?.disable();
  }

  deletePromo(code: string) {
    if (!confirm(`Voulez-vous vraiment supprimer le code PROMO "${code}" ?\nCette action est irréversible.`)) return;

    this.http.delete(`${this.PROMO_API}/${code}`).subscribe({
      next: () => {
        this.loadPromoCodes();
      },
      error: () => alert('Impossible de supprimer ce code.')
    });
  }

  resetForm() {
    this.promoForm.reset({ 
      discountPercent: 10, 
      active: true,
      minAmount: 0 
    });
    this.promoForm.get('code')?.enable();
    this.editingCode = null;
    this.showForm = false;
    this.isSubmitting = false;
  }

  // --- Helpers ---

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  }

  toDatetimeLocal(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:mm
  }

  isExpired(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }
}

```

## File: frontend/src/app/features/profile/profile/profile.component.css
```css

```

## File: frontend/src/app/features/profile/profile/profile.component.html
```html
<div class="min-h-screen bg-gray-50 py-8">
  <div class="container mx-auto px-4 max-w-3xl">
    <!-- Si pas connecté -->
    <div *ngIf="!user" class="bg-white rounded-xl shadow-md p-8 text-center">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Profil</h1>
      <p class="text-gray-600 mb-4">
        Vous devez être connecté pour voir votre profil.
      </p>
      <a
        routerLink="/login"
        class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Se connecter
      </a>
    </div>

    <!-- Profil utilisateur -->
    <div *ngIf="user" class="bg-white rounded-xl shadow-md p-8">
      <!-- En-tête -->
      <div class="flex items-center gap-4 mb-6">
        <!-- Avatar simple -->
        <div
          class="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold"
        >
          {{ (user.name || user.email).charAt(0) | uppercase }}
        </div>

        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ user.name || (user.email.split('@')[0]) }}
          </h1>
          <p class="text-gray-600">
            {{ user.email }}
          </p>
          <p class="mt-1">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              [ngClass]="user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'"
            >
              {{ user.role === 'ADMIN' ? 'Administrateur' : 'Client' }}
            </span>
          </p>
        </div>
      </div>

      <hr class="my-6" />

      <!-- Informations compte -->
      <div class="space-y-4">
        <div>
          <h2 class="text-sm font-semibold text-gray-500 uppercase mb-1">
            Email
          </h2>
          <p class="text-gray-900">
            {{ user.email }}
          </p>
        </div>

        <div>
          <h2 class="text-sm font-semibold text-gray-500 uppercase mb-1">
            Nom complet
          </h2>
          <p class="text-gray-900">
            {{ user.name || 'Non renseigné' }}
          </p>
        </div>

        <div>
          <h2 class="text-sm font-semibold text-gray-500 uppercase mb-1">
            Rôle
          </h2>
          <p class="text-gray-900">
            {{ user.role === 'ADMIN' ? 'Administrateur' : 'Client' }}
          </p>
        </div>

        <div *ngIf="user.createdAt">
          <h2 class="text-sm font-semibold text-gray-500 uppercase mb-1">
            Membre depuis
          </h2>
          <p class="text-gray-900">
            {{ user.createdAt | date: 'longDate' }}
          </p>
        </div>
      </div>

      <hr class="my-6" />

      <div class="text-sm text-gray-500">
        Ces informations proviennent de votre compte backend.  
        Pour les modifier, utilisez l’interface d’administration ou contactez le support.
      </div>
    </div>
  </div>
</div>

```

## File: frontend/src/app/features/profile/profile/profile.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
  }

  refreshProfile(): void {
    this.authService.refreshProfile().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Erreur refresh profil:', error);
      }
    });
  }
}

```

## File: frontend/src/app/features/orders/checkout/checkout.component.css
```css

```

## File: frontend/src/app/features/orders/checkout/checkout.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CartItem, PaymentMethod } from '../../../shared/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule,FormsModule,  ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  shippingForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  // Promo
  promoCode = '';
  promoCodeApplied: string | null = null;
  discount = 0;

  // Étapes
  currentStep: 'cart' | 'shipping' | 'confirmation' = 'cart';

  constructor(
    private cartService: CartService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.shippingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      street: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      country: ['France', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[\d\s\+\-\(\)]+$/)]]
    });
  }

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cartItems = cart.items;
        this.promoCodeApplied = cart.promoCode;
        this.discount = cart.discount || 0;
      },
      error: (error) => {
        console.error('Erreur chargement panier:', error);
        this.cartItems = [];
      }
    });
  }

  getSubtotal(): number {
    return this.cartService.getSubtotal();
  }

  getShippingCost(): number {
    const subtotal = this.getSubtotal();
    return subtotal >= 50 ? 0 : 5.99;
  }

  getTotal(): number {
    // Total backend (déjà avec réduction) + livraison
    return this.cartService.getTotalAmount() + this.getShippingCost();
  }

  formatPrice(price: number): string {
    return this.cartService.formatPrice(price);
  }

  increaseQuantity(productId: number): void {
    const item = this.cartItems.find(i => i.productId === productId);
    if (!item) return;

    this.cartService.updateQuantity(productId, item.quantity + 1).subscribe({
      next: () => this.loadCart(),
      error: (error) => console.error('Erreur:', error)
    });
  }

  decreaseQuantity(productId: number): void {
    const item = this.cartItems.find(i => i.productId === productId);
    if (!item || item.quantity <= 1) return;

    this.cartService.updateQuantity(productId, item.quantity - 1).subscribe({
      next: () => this.loadCart(),
      error: (error) => console.error('Erreur:', error)
    });
  }

  removeItem(productId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce produit ?')) return;

    this.cartService.removeFromCart(productId).subscribe({
      next: () => this.loadCart(),
      error: (error) => console.error('Erreur:', error)
    });
  }

  // applyPromoCode(): void {
  //   if (!this.promoCode.trim()) {
  //     alert('Veuillez entrer un code promo');
  //     return;
  //   }

  //   this.cartService.applyPromoCode(this.promoCode).subscribe({
  //     next: (cart) => {
  //       this.promoCodeApplied = cart.promoCode;
  //       this.discount = cart.discount || 0;
  //       alert(`Code promo "${this.promoCode}" appliqué. Réduction: ${this.formatPrice(this.discount)}`);
  //       this.loadCart();
  //     },
  //     error: (error) => {
  //       console.error('Erreur code promo:', error);
  //       alert('Code promo invalide ou expiré');
  //     }
  //   });
  // }

  applyPromoCode(): void {
    if (!this.promoCode.trim()) {
      alert('Veuillez entrer un code promo');
      return;
    }

    this.cartService.applyPromoCode(this.promoCode).subscribe({
      next: (cart) => {
        this.promoCodeApplied = cart.promoCode;
        this.discount = cart.discount || 0;
        alert(`Code promo "${this.promoCode}" appliqué !`);
        this.loadCart();
      },
      error: (error) => {
        console.error('Erreur promo:', error);
        // ✅ AFFICHER LE MESSAGE PRÉCIS DU BACKEND
        const msg = error.error?.error || 'Code promo invalide ou expiré';
        alert('Erreur: ' + msg);
      }
    });
  }

  removePromoCodeApplied(): void {
    this.cartService.removePromoCode().subscribe({
      next: () => {
        this.promoCodeApplied = null;
        this.discount = 0;
        this.promoCode = '';
        this.loadCart();
      },
      error: (error) => console.error('Erreur:', error)
    });
  }

  proceedToShipping(): void {
    if (this.cartItems.length === 0) {
      alert('Votre panier est vide');
      return;
    }
    this.currentStep = 'shipping';
  }

  backToCart(): void {
    this.currentStep = 'cart';
  }

  submitOrder(): void {
    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const v = this.shippingForm.value;
    const shippingAddress = `${v.street}, ${v.postalCode} ${v.city}, ${v.country}`;

    this.cartService.checkout(shippingAddress, PaymentMethod.CREDIT_CARD).subscribe({
      next: (response) => {
        console.log('Commande créée:', response);
        this.currentStep = 'confirmation';
        this.isSubmitting = false;

        setTimeout(() => {
          this.router.navigate(['/orders', response.order.id]);
        }, 3000);
      },
      error: (error) => {
        console.error('Erreur checkout:', error);
        this.isSubmitting = false;
        this.errorMessage = 'Impossible de créer la commande. Veuillez réessayer.';
      }
    });
  }

  get fullName() { return this.shippingForm.get('fullName'); }
  get street() { return this.shippingForm.get('street'); }
  get city() { return this.shippingForm.get('city'); }
  get postalCode() { return this.shippingForm.get('postalCode'); }
  get country() { return this.shippingForm.get('country'); }
  get phone() { return this.shippingForm.get('phone'); }
}

```

## File: frontend/src/app/features/orders/checkout/checkout.component.html
```html
<div class="min-h-screen bg-gray-50 py-8">
  <div class="container mx-auto px-4 max-w-6xl">
    <!-- En-tête -->
    <h1 class="text-4xl font-bold text-gray-900 mb-8 text-center">
      {{ currentStep === 'cart' ? 'Mon Panier' : currentStep === 'shipping' ? 'Livraison' : 'Confirmation' }}
    </h1>

    <!-- Indicateur d'étapes -->
    <div class="flex items-center justify-center mb-8">
      <div class="flex items-center space-x-4">
        <!-- Étape 1 -->
        <div class="flex items-center">
          <div [class.bg-blue-600]="currentStep === 'cart'"
               [class.bg-green-600]="currentStep !== 'cart'"
               class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
            {{ currentStep === 'cart' ? '1' : '✓' }}
          </div>
          <span class="ml-2 font-medium text-gray-700">Panier</span>
        </div>

        <div class="w-16 h-1 bg-gray-300"></div>

        <!-- Étape 2 -->
        <div class="flex items-center">
          <div [class.bg-blue-600]="currentStep === 'shipping'"
               [class.bg-green-600]="currentStep === 'confirmation'"
               [class.bg-gray-300]="currentStep === 'cart'"
               class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
            {{ currentStep === 'confirmation' ? '✓' : '2' }}
          </div>
          <span class="ml-2 font-medium text-gray-700">Livraison</span>
        </div>

        <div class="w-16 h-1 bg-gray-300"></div>

        <!-- Étape 3 -->
        <div class="flex items-center">
          <div [class.bg-green-600]="currentStep === 'confirmation'"
               [class.bg-gray-300]="currentStep !== 'confirmation'"
               class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
            3
          </div>
          <span class="ml-2 font-medium text-gray-700">Confirmation</span>
        </div>
      </div>
    </div>

    <!-- ÉTAPE 1 : Panier -->
    <div *ngIf="currentStep === 'cart'">
      <!-- Panier vide -->
      <div *ngIf="cartItems.length === 0" class="text-center py-20">
        <div class="text-6xl mb-4">🛒</div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">
          Votre panier est vide
        </h3>
        <p class="text-gray-600 mb-6">
          Découvrez nos produits et ajoutez-les à votre panier
        </p>
        <a routerLink="/products" 
           class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block">
          Voir les produits
        </a>
      </div>

      <!-- Liste des produits -->
      <div *ngIf="cartItems.length > 0" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Colonne principale - Liste des produits -->
        <div class="lg:col-span-2 space-y-4">
          <div *ngFor="let item of cartItems" 
               class="bg-white rounded-lg shadow-md p-6 flex gap-6">
            <!-- Image du produit -->
            <img [src]="item.images?.[0] || item.imageUrl || 'https://via.placeholder.com/128x128?text=Produit'"
            [alt]="item.productName"
            class="w-32 h-32 object-cover rounded-lg">
              
            <!-- Informations du produit -->
            <div class="flex-grow">
              <h3 class="text-lg font-bold text-gray-900 mb-2">
                {{ item.productName }}
              </h3>
              
              <div class="flex items-center justify-between mb-2">
                <!-- Quantité -->
                <div class="flex items-center space-x-3">
                  <button (click)="decreaseQuantity(item.productId)"
                          class="w-8 h-8 rounded border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 font-bold transition-colors"
                          [disabled]="item.quantity <= 1">
                    −
                  </button>
                  <span class="font-semibold text-gray-900 w-8 text-center">
                    {{ item.quantity }}
                  </span>
                  <button (click)="increaseQuantity(item.productId)"
                          class="w-8 h-8 rounded border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 font-bold transition-colors">
                    +
                  </button>
                </div>

                <!-- Prix -->
                <div class="text-right">
                  <p class="text-sm text-gray-500">
                    {{ formatPrice(item.price) }} × {{ item.quantity }}
                  </p>
                  <p class="text-xl font-bold text-blue-600">
                    {{ formatPrice(item.price * item.quantity) }}
                  </p>
                </div>
              </div>

              <!-- Bouton supprimer -->
              <button (click)="removeItem(item.productId)"
                      class="mt-4 text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                Retirer
              </button>
            </div>
          </div>
        </div>

        <!-- Colonne latérale - Résumé + Code promo -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h3 class="text-xl font-bold text-gray-900 mb-6">
              Résumé de la commande
            </h3>

            <!-- Formulaire code promo -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Code promo
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="promoCode"
                  [ngModelOptions]="{ standalone: true }"
                  placeholder="SAVE20, VIP50, WELCOME10..."
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  [readonly]="!!promoCodeApplied"
                />
                <button
                  *ngIf="!promoCodeApplied"
                  (click)="applyPromoCode()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Appliquer
                </button>
                <button
                  *ngIf="promoCodeApplied"
                  (click)="removePromoCodeApplied()"
                  class="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Retirer
                </button>
              </div>
              <p *ngIf="promoCodeApplied" class="text-xs text-green-700 mt-1">
                Code <span class="font-semibold">{{ promoCodeApplied }}</span> appliqué. Réduction : {{ formatPrice(discount) }}.
              </p>
            </div>

            <div class="space-y-3 mb-6">
              <div class="flex justify-between text-gray-700">
                <span>Sous-total</span>
                <span class="font-semibold">{{ formatPrice(getSubtotal()) }}</span>
              </div>

              <div *ngIf="discount > 0" class="flex justify-between text-green-700 text-sm">
                <span>Réduction ({{ promoCodeApplied }})</span>
                <span>-{{ formatPrice(discount) }}</span>
              </div>

              <div class="flex justify-between text-gray-700">
                <span>Livraison</span>
                <span class="font-semibold">
                  {{ getShippingCost() === 0 ? 'Gratuite' : formatPrice(getShippingCost()) }}
                </span>
              </div>

              <div *ngIf="getSubtotal() >= 50" class="text-xs text-green-600 flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Livraison gratuite appliquée (≥ 50 €)
              </div>

              <div class="border-t pt-4">
                <div class="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span class="text-blue-600">{{ formatPrice(getTotal()) }}</span>
                </div>
              </div>
            </div>

            <button (click)="proceedToShipping()"
                    class="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg">
              Commander
            </button>

            <a routerLink="/products" 
               class="block text-center text-blue-600 hover:underline mt-4 text-sm">
              ← Continuer mes achats
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ÉTAPE 2 : Livraison -->
    <div *ngIf="currentStep === 'shipping'" class="max-w-2xl mx-auto">
      <div class="bg-white rounded-lg shadow-md p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          Informations de livraison
        </h2>

        <form [formGroup]="shippingForm" (ngSubmit)="submitOrder()" class="space-y-6">
          <!-- Nom complet -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input type="text" formControlName="fullName"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="Jean Dupont"
                   [class.border-red-500]="fullName?.invalid && fullName?.touched">
            <p *ngIf="fullName?.invalid && fullName?.touched" class="mt-1 text-sm text-red-600">
              Le nom complet est requis (minimum 3 caractères)
            </p>
          </div>

          <!-- Adresse -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input type="text" formControlName="street"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="123 Rue de la Paix"
                   [class.border-red-500]="street?.invalid && street?.touched">
            <p *ngIf="street?.invalid && street?.touched" class="mt-1 text-sm text-red-600">
              L'adresse est requise
            </p>
          </div>

          <!-- Ville et Code postal -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <input type="text" formControlName="city"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Paris"
                     [class.border-red-500]="city?.invalid && city?.touched">
              <p *ngIf="city?.invalid && city?.touched" class="mt-1 text-sm text-red-600">
                Ville requise
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Code postal
              </label>
              <input type="text" formControlName="postalCode"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="75001"
                     [class.border-red-500]="postalCode?.invalid && postalCode?.touched">
              <p *ngIf="postalCode?.invalid && postalCode?.touched" class="mt-1 text-sm text-red-600">
                Code postal invalide (5 chiffres)
              </p>
            </div>
          </div>

          <!-- Pays -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pays
            </label>
            <input type="text" formControlName="country"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   readonly>
          </div>

          <!-- Téléphone -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input type="tel" formControlName="phone"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="+33 6 12 34 56 78"
                   [class.border-red-500]="phone?.invalid && phone?.touched">
            <p *ngIf="phone?.invalid && phone?.touched" class="mt-1 text-sm text-red-600">
              Numéro de téléphone invalide
            </p>
          </div>

          <!-- Message d'erreur -->
          <div *ngIf="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {{ errorMessage }}
          </div>

          <!-- Boutons -->
          <div class="flex gap-4">
            <button type="button" (click)="backToCart()"
                    class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              ← Retour au panier
            </button>
            <button type="submit" [disabled]="isSubmitting"
                    class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isSubmitting ? 'Traitement...' : 'Confirmer la commande' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ÉTAPE 3 : Confirmation -->
    <div *ngIf="currentStep === 'confirmation'" class="max-w-2xl mx-auto text-center py-12">
      <div class="bg-white rounded-lg shadow-md p-12">
        <div class="text-6xl mb-6">✅</div>
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          Commande confirmée !
        </h2>
        <p class="text-gray-600 text-lg mb-8">
          Merci pour votre commande. Vous allez recevoir un email de confirmation.
        </p>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <p class="text-blue-800 font-medium">
            Redirection vers vos commandes dans quelques secondes...
          </p>
        </div>
        <a routerLink="/orders" 
           class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block">
          Voir mes commandes
        </a>
      </div>
    </div>
  </div>
</div>

```

## File: frontend/src/app/features/orders/order-list/order-list.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../shared/models';

@Component({
  selector: 'app-order-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement commandes:', error);
        this.errorMessage = 'Impossible de charger vos commandes';
        this.isLoading = false;
      }
    });
  }

  formatPrice(price: number): string {
    return this.orderService.formatPrice(price);
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status as any);
  }

  getStatusBadgeClass(status: string): string {
    return this.orderService.getStatusBadgeClass(status as any);
  }

  getTotalItems(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }
}

```

## File: frontend/src/app/features/orders/order-list/order-list.component.html
```html
<div class="min-h-screen bg-gray-50 py-10 font-sans">
  <div class="container mx-auto px-4 max-w-5xl">
    
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Mes commandes</h1>
        <p class="text-gray-500 mt-1">Retrouvez l'historique et le statut de vos achats.</p>
      </div>
      <a routerLink="/products" 
         class="hidden md:inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
        🛍️ Continuer mes achats
      </a>
    </div>

    <!-- Loader -->
    <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-20 animate-pulse">
      <div class="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
        <div class="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p class="text-gray-400 font-medium">Chargement de vos commandes...</p>
    </div>

    <!-- Error -->
    <div *ngIf="!isLoading && errorMessage" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-8">
      <p class="text-red-600 font-medium">{{ errorMessage }}</p>
      <button (click)="loadOrders()" class="mt-3 text-red-700 underline text-sm hover:text-red-800">Réessayer</button>
    </div>

    <!-- Empty State -->
    <div *ngIf="!isLoading && !errorMessage && orders.length === 0" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
      <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <span class="text-4xl">📦</span>
      </div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Aucune commande pour le moment</h2>
      <p class="text-gray-500 mb-6 max-w-md mx-auto">Vous n'avez pas encore effectué d'achat. Découvrez notre sélection et faites-vous plaisir !</p>
      <a routerLink="/products" class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
        Découvrir les produits
      </a>
    </div>

    <!-- Orders Grid -->
    <div *ngIf="!isLoading && orders.length > 0" class="grid gap-6">
      <div *ngFor="let order of orders" 
           class="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300">
        
        <!-- Order Header -->
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
            <div>
              <p class="text-xs text-gray-500 uppercase font-semibold tracking-wider">Date</p>
              <p class="text-sm font-medium text-gray-900">{{ order.createdAt | date:'d MMM yyyy' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total</p>
              <p class="text-sm font-bold text-gray-900">{{ formatPrice(order.totalAmount) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase font-semibold tracking-wider">N° Commande</p>
              <p class="text-sm font-mono text-gray-600">#{{ order.orderNumber || order.id }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
             <a [routerLink]="['/orders', order.id]" 
               class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm">
              Voir le détail
            </a>
          </div>
        </div>

        <!-- Order Body -->
        <div class="px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-gray-50 rounded-lg">
              <span class="text-2xl">🛍️</span>
            </div>
            <div>
              <span [class]="'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ' + getStatusBadgeClass(order.status)">
                {{ getStatusLabel(order.status) }}
              </span>
              <p class="text-sm text-gray-600">
                <span class="font-medium text-gray-900">{{ getTotalItems(order) }} article(s)</span> expédié(s) à {{ order.shippingAddress }}
              </p>
            </div>
          </div>
          
          <!-- Mini Preview Images (Optional: if you have images in order items) -->
          <div class="flex -space-x-2 overflow-hidden">
             <!-- Placeholder for product thumbnails -->
             <!-- <img class="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover" src="..." /> -->
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

```

## File: frontend/src/app/features/orders/order-list/order-list.component.css
```css

```

## File: frontend/src/app/features/orders/order-detail/order-detail.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../shared/models';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {
  order!: Order;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(Number(id));
    }
  }

  loadOrder(id: number): void {
    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Commande introuvable';
        this.isLoading = false;
      }
    });
  }

  formatPrice(price: number): string {
    return this.orderService.formatPrice(price);
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status as any);
  }

  getStatusBadgeClass(status: string): string {
    return this.orderService.getStatusBadgeClass(status as any);
  }

  getItemsTotal(): number {
    return this.order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  getSubtotal(order: Order): number {
    // Si discount existe, le sous-total est Total + Discount
    // Sinon c'est juste la somme des items
    if (order.discount) {
      return order.totalAmount + order.discount;
    }
    return order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

}

```

## File: frontend/src/app/features/orders/order-detail/order-detail.component.css
```css

```

## File: frontend/src/app/features/orders/order-detail/order-detail.component.html
```html
<div class="min-h-screen bg-gray-50 py-10 font-sans">
  <div class="container mx-auto px-4 max-w-4xl">
    
    <!-- Breadcrumb -->
    <nav class="flex mb-6 text-sm text-gray-500">
      <a routerLink="/orders" class="hover:text-indigo-600 transition-colors">Mes commandes</a>
      <span class="mx-2">/</span>
      <span class="text-gray-900 font-medium" *ngIf="order">Commande #{{ order.orderNumber || order.id }}</span>
    </nav>

    <!-- Loading -->
    <div *ngIf="isLoading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
    </div>

    <!-- Content -->
    <div *ngIf="!isLoading && order" class="animate-fade-in-up">
      
      <!-- Header Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Commande #{{ order.orderNumber || order.id }}
            <span [class]="'px-3 py-1 rounded-full text-xs font-semibold tracking-wide ' + getStatusBadgeClass(order.status)">
              {{ getStatusLabel(order.status) | uppercase }}
            </span>
          </h1>
          <p class="text-gray-500 mt-2 text-sm flex items-center gap-2">
            📅 Passée le <span class="font-medium text-gray-900">{{ order.createdAt | date:'d MMMM yyyy à HH:mm' }}</span>
          </p>
        </div>
        <div class="text-right">
           <!-- Actions buttons (Invoice, Reorder...) -->
           <button class="text-indigo-600 text-sm font-medium hover:underline">Télécharger la facture</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Items -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 class="font-bold text-gray-900">Articles ({{ order.items.length }})</h2>
            </div>
            <ul class="divide-y divide-gray-100">
              <li *ngFor="let item of order.items" class="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <!-- Product Image Placeholder -->
                <div class="h-20 w-20 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-2xl border border-gray-200">
                  📦
                </div>
                
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-semibold text-gray-900 truncate">{{ item.productName }}</h3>
                  <p class="text-sm text-gray-500 mt-1">Ref: {{ item.productId }}</p>
                  <p class="text-sm text-gray-500 mt-1">Qté: <span class="font-medium text-gray-900">{{ item.quantity }}</span></p>
                </div>

                <div class="text-right">
                  <p class="text-base font-bold text-gray-900">{{ formatPrice(item.price * item.quantity) }}</p>
                  <p class="text-xs text-gray-500">{{ formatPrice(item.price) }} / unité</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Shipping Info -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
              📍 Livraison
            </h2>
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p class="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-line">
                {{ order.shippingAddress }}
              </p>
              <p class="text-xs text-gray-500 mt-2">Mode de paiement: <span class="font-medium text-gray-900">{{ order.paymentMethod }}</span></p>
            </div>
          </div>
        </div>

        <!-- Right Column: Summary -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h2 class="font-bold text-gray-900 mb-6">Récapitulatif</h2>

            <div class="space-y-3 pb-6 border-b border-gray-100">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Sous-total</span>
                <span class="font-medium text-gray-900">{{ formatPrice(getSubtotal(order)) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Livraison</span>
                <span class="font-medium text-green-600">Gratuite</span>
              </div>
              
              <!-- ✅ Affichage de la réduction -->
              <div *ngIf="order.discount && order.discount > 0" class="flex justify-between text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md">
                <span class="flex items-center gap-1">
                   🏷️ Code Promo <span class="font-bold text-xs bg-white px-1 rounded border border-green-200">{{ order.promoCode }}</span>
                </span>
                <span class="font-bold">-{{ formatPrice(order.discount) }}</span>
              </div>
            </div>

            <div class="pt-4 pb-6">
              <div class="flex justify-between items-end">
                <span class="text-base font-bold text-gray-900">Total payé</span>
                <span class="text-2xl font-extrabold text-indigo-600">{{ formatPrice(order.totalAmount) }}</span>
              </div>
              <p class="text-xs text-gray-400 mt-1 text-right">TVA incluse</p>
            </div>

            <div class="space-y-3">
              <button class="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                Besoin d'aide ?
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>

```

## File: frontend/src/app/shared/models/user.model.ts
```typescript
/**src/app/shared/models/user.model.ts
 * Modèle utilisateur
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  oauthProvider?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Rôles utilisateur
 */
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

/**
 * Profil utilisateur complet
 */
export interface UserProfile extends User {
  phone?: string;
  address?: Address;
}

/**
 * Adresse de livraison/facturation
 */
export interface Address {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

```

## File: frontend/src/app/shared/models/order.model.ts
```typescript
/**src/app/shared/models/order.model.ts
 * Commande complète
 */
export interface Order {
  id: number;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  promoCode: string | null;
  discount: number | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Item de commande
 */
export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

/**
 * Statut de commande
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

/**
 * Labels des statuts en français
 */
export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'En attente',
  [OrderStatus.CONFIRMED]: 'Confirmée',
  [OrderStatus.PROCESSING]: 'En préparation',
  [OrderStatus.SHIPPED]: 'Expédiée',
  [OrderStatus.DELIVERED]: 'Livrée',
  [OrderStatus.CANCELLED]: 'Annulée'
};

/**
 * Classes CSS pour les badges de statut
 */
export const OrderStatusBadgeClasses: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [OrderStatus.PROCESSING]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-800 border-purple-200',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800 border-green-200',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200'
};

```

## File: frontend/src/app/shared/models/cart.model.ts
```typescript
/**src/app/shared/models/cart.model.ts
 * Panier complet (backend response)
 */
export interface Cart {
  userId: string;
  items: CartItem[];
  subtotal: number;
  totalAmount: number;
  promoCode: string | null;
  discount: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Item dans le panier
 */
export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  images?: string[];

}

/**
 * Requête pour ajouter au panier
 */
export interface AddToCartRequest {
  productId: number;
  quantity: number;
  productName?: string;  // ✅ AJOUTER
  price?: number;        // ✅ AJOUTER
  imageUrl?: string;     // ✅ OPTIONNEL
  images?: string[];      // ✅ OPTIONNEL

}

/**
 * Requête pour mettre à jour la quantité
 */
export interface UpdateCartItemRequest {
  productId: number;
  quantity: number;
}

/**
 * Requête pour appliquer un code promo
 */
export interface ApplyPromoCodeRequest {
  promoCode: string;
}

/**
 * Requête pour le checkout
 */
export interface CheckoutRequest {
  shippingAddress: string;
  paymentMethod: PaymentMethod;
}

/**
 * Réponse du checkout
 */
export interface CheckoutResponse {
  success: boolean;
  message: string;
  order: OrderSummary;
}

/**
 * Résumé de commande après checkout
 */
export interface OrderSummary {
  id: number;
  userId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: OrderItemSummary[];
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
}

/**
 * Item de commande (résumé)
 */
export interface OrderItemSummary {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

/**
 * Méthodes de paiement
 */
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

```

## File: frontend/src/app/shared/models/auth.model.ts
```typescript
import { User } from './user.model';

/**
 * Requête de connexion
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Requête d'inscription
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Réponse d'authentification
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

/**
 * Tokens JWT
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

```

## File: frontend/src/app/shared/models/product.model.ts
```typescript
/**src/app/shared/models/product.model.ts
 * Modèle produit
 */
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number | null;
  categoryName: string | null;
  images?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string; 

}

/**
 * Catégorie de produit
 */
export interface Category {
  id: number;
  name: string;
  description?: string;
}

/**
 * Page de produits (pagination)
 */
export interface ProductPage {
  content: Product[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

/**
 * Information de pagination
 */
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

/**
 * Information de tri
 */
export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

/**
 * Filtres de recherche produits
 */
export interface ProductFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

```

## File: frontend/src/app/shared/models/index.ts
```typescript
/**src/app/shared/models/index.ts
 * Barrel export pour tous les models
 * Usage: import { User, Product, Cart } from '@shared/models';
 */

// User models
export * from './user.model';

// Auth models
export * from './auth.model';

// Product models
export * from './product.model';

// Cart models
export * from './cart.model';

// Order models
export * from './order.model';

```

## File: frontend/src/app/shared/components/navbar/navbar.component.css
```css

```

## File: frontend/src/app/shared/components/navbar/navbar.component.ts
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartBadgeComponent } from '../cart-badge/cart-badge.component';
import { Observable } from 'rxjs';
import { User } from '../../../shared/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, CartBadgeComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  currentUser$: Observable<User | null>;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  logout(): void {
    this.authService.logout();
  }
}

```

## File: frontend/src/app/shared/components/navbar/navbar.component.html
```html
<nav class="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16 items-center">
      
      <!-- Logo -->
      <div class="flex-shrink-0 flex items-center">
        <a routerLink="/" class="flex items-center gap-2 group">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <span class="text-lg font-bold text-gray-900">E-Shop</span>
        </a>
      </div>

      <!-- Menu Desktop -->
      <div class="hidden md:flex items-center space-x-1">
        
        <a routerLink="/" 
           routerLinkActive="text-indigo-600 bg-indigo-50"
           [routerLinkActiveOptions]="{exact: true}"
           class="px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors">
          Accueil
        </a>
        
        <a routerLink="/products" 
           routerLinkActive="text-indigo-600 bg-indigo-50"
           class="px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors">
          Produits
        </a>

        <!-- Logique Utilisateur Connecté / Invité -->
        <ng-container *ngIf="currentUser$ | async as user; else guestLinks">
          
          <!-- Lien CLIENT -->
          <a *ngIf="user.role !== 'ADMIN'" 
             routerLink="/orders" 
             routerLinkActive="text-indigo-600 bg-indigo-50"
             class="px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors">
            Mes Commandes
          </a>

          <!-- Lien ADMIN (Bouton spécial) -->
          <a *ngIf="user.role === 'ADMIN'" 
             routerLink="/admin/dashboard" 
             class="ml-2 px-3 py-2 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors flex items-center gap-2">
             <span class="text-lg">👑</span>
            Admin Panel
          </a>

          <div class="h-6 w-px bg-gray-200 mx-3"></div>

          <!-- Cart Badge -->
          <app-cart-badge></app-cart-badge>

          <!-- Profil -->
          <div class="ml-3 relative group flex items-center gap-3 cursor-pointer">
             <div class="text-right hidden lg:block">
              <p class="text-sm font-medium text-gray-900 leading-none">{{ user.name }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ user.role === 'ADMIN' ? 'Administrateur' : 'Client' }}</p>
            </div>
            
            <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
              {{ user.name ? user.name.charAt(0) : 'U' }}
            </div>

            <!-- Bouton Déconnexion -->
            <button (click)="logout()" 
                    class="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                    title="Se déconnecter">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

        </ng-container>
      </div>

      <!-- Menu Mobile (Simplifié) -->
      <div class="md:hidden flex items-center gap-4">
        <app-cart-badge></app-cart-badge>
        <button class="text-gray-500 hover:text-gray-900">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

    </div>
  </div>

  <!-- Template Invité -->
  <ng-template #guestLinks>
    <div class="flex items-center space-x-4 ml-4">
      <app-cart-badge></app-cart-badge>
      <div class="h-6 w-px bg-gray-200"></div>
      <a routerLink="/login" 
         class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
        Connexion
      </a>
      <a routerLink="/register" 
         class="bg-gray-900 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm">
        S'inscrire
      </a>
    </div>
  </ng-template>
</nav>

```

## File: frontend/src/app/shared/components/footer/footer.component.css
```css

```

## File: frontend/src/app/shared/components/footer/footer.component.ts
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}

```

## File: frontend/src/app/shared/components/footer/footer.component.html
```html
<footer class="bg-gray-800 text-white py-8 mt-12">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- À propos -->
        <div>
          <h3 class="text-lg font-semibold mb-4">À propos</h3>
          <p class="text-gray-400 text-sm">
            Plateforme e-commerce moderne construite avec Angular et Spring Boot.
          </p>
        </div>
  
        <!-- Liens rapides -->
        <div>
          <h3 class="text-lg font-semibold mb-4">Liens rapides</h3>
          <ul class="space-y-2 text-sm">
            <li><a href="#" class="text-gray-400 hover:text-white transition">Conditions générales</a></li>
            <li><a href="#" class="text-gray-400 hover:text-white transition">Politique de confidentialité</a></li>
            <li><a href="#" class="text-gray-400 hover:text-white transition">Contact</a></li>
          </ul>
        </div>
  
        <!-- Contact -->
        <div>
          <h3 class="text-lg font-semibold mb-4">Contact</h3>
          <p class="text-gray-400 text-sm">
            Email: contact&#64;ecommerce.com<br>
            Téléphone: +33 1 23 45 67 89
          </p>
        </div>
      </div>
  
      <!-- Copyright -->
      <div class="border-t border-gray-700 mt-8 pt-6 text-center">
        <p class="text-gray-400 text-sm">
          © {{ currentYear }} E-Commerce Platform. Tous droits réservés.
        </p>
      </div>
    </div>
  </footer>
  
```

## File: frontend/src/app/shared/components/cart-badge/cart-badge.component.ts
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-badge',
  imports: [CommonModule],
  standalone: true,
  template: `
    <div class="relative">
      <button 
        routerLink="/checkout"
        class="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        [class]="cartCount > 0 ? 'text-blue-600' : 'text-gray-500'">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5A2 2 0 007.4 21h9.2a2 2 0 001.9-1.5L21 13M4.6 13H7M16 13h2.4M7 13h8"/>
        </svg>
        
        <span *ngIf="cartCount > 0" 
              class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
          {{ cartCount }}
        </span>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class CartBadgeComponent {
  cartCount = 0;

  constructor(private cartService: CartService) {
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
  }
}

```

## File: frontend/src/app/shared/components/header/header.component.html
```html
<header class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
  <nav class="container mx-auto px-4 py-4">
    <div class="flex items-center justify-between">
      <!-- Logo -->
      <a routerLink="/" class="text-2xl font-bold hover:text-blue-200 transition">
        🛒 E-Commerce
      </a>

      <!-- Navigation principale -->
      <div class="hidden md:flex space-x-6">
        <a routerLink="/" 
           routerLinkActive="text-yellow-300"
           [routerLinkActiveOptions]="{exact: true}"
           class="hover:text-blue-200 transition font-medium">
          Accueil
        </a>
        <a routerLink="/products" 
           routerLinkActive="text-yellow-300"
           class="hover:text-blue-200 transition font-medium">
          Produits
        </a>
        
        <!-- Liens pour utilisateurs connectés -->
        <ng-container *ngIf="isAuthenticated$ | async">
          <a routerLink="/orders" 
             routerLinkActive="text-yellow-300"
             class="hover:text-blue-200 transition font-medium">
            Mes Commandes
          </a>
          <a routerLink="/profile" 
             routerLinkActive="text-yellow-300"
             class="hover:text-blue-200 transition font-medium">
            Mon Profil
          </a>
        </ng-container>
      </div>

      <!-- Boutons d'authentification et panier -->
      <div class="flex items-center space-x-4">
        <!-- Icône Panier -->
        <a routerLink="/checkout" 
           class="relative hover:text-blue-200 transition">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <!-- Badge compteur -->
          <span *ngIf="(cartCount$ | async) as count"
                class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {{ count > 9 ? '9+' : count }}
          </span>
        </a>

        <ng-container *ngIf="isAuthenticated$ | async; else notAuthenticated">
          <!-- Utilisateur connecté -->
          <span class="hidden md:inline-block text-sm">
            Bonjour, <span class="font-semibold">
              {{ (currentUser$ | async)?.name || ((currentUser$ | async)?.email || '').split('@')[0] }}
            </span>
            
          </span>
          <button (click)="logout()" 
                  class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition font-medium">
            Déconnexion
          </button>
        </ng-container>

        <!-- Utilisateur non connecté -->
        <ng-template #notAuthenticated>
          <a routerLink="/login" 
             class="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition font-medium">
            Connexion
          </a>
          <a routerLink="/register" 
             class="bg-yellow-400 text-blue-900 hover:bg-yellow-300 px-4 py-2 rounded-lg transition font-medium">
            Inscription
          </a>
        </ng-template>
      </div>
    </div>
  </nav>
</header>

```

## File: frontend/src/app/shared/components/header/header.component.css
```css

```

## File: frontend/src/app/shared/components/header/header.component.ts
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { User } from '../../../shared/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  currentUser$: Observable<User | null>;
  cartCount$: Observable<number>;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.cartCount$ = this.cartService.cartCount$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  logout(): void {
    this.authService.logout();
  }
}

```

## File: frontend/src/environments/environment.prod.ts
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.votre-domaine.com',
  authServiceUrl: 'https://api.votre-domaine.com/api/auth',
  productServiceUrl: 'https://api.votre-domaine.com/api/products',
  cartServiceUrl: 'https://api.votre-domaine.com/api/cart',
  orderServiceUrl: 'https://api.votre-domaine.com/api/orders'
};

```

## File: frontend/src/environments/environment.ts
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost',
  authServiceUrl: 'http://localhost:8081/api/auth',
  productServiceUrl: 'http://localhost:8082/api/products',
  cartServiceUrl: 'http://localhost:8085/api/cart',
  
  // ❌ AVANT (Probable cause) : 'http://localhost:8083/api/orders'
  // ✅ APRÈS (Correction) : L'URL de base du service, sans le préfixe du contrôleur
  orderServiceUrl: 'http://localhost:8083/api' 
};

```

