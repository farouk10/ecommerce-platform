package com.ecommerce.auth;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class AbstractIntegrationTest {

    @org.springframework.boot.test.mock.mockito.MockBean
    protected org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate;

    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15"))
            .withDatabaseName("auth_db_test")
            .withUsername("test")
            .withPassword("test");

    static final GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7.0.12-alpine"))
            .withExposedPorts(6379)
            .waitingFor(Wait.forLogMessage(".*Ready to accept connections.*\\n", 1));

    static {
        postgres.start();
        redis.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);

        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));

        // Mock JWT Secret for tests
        registry.add("jwt.secret", () -> "mySuperSecretKeyForIntegrationTesting1234567890");
    }
}
