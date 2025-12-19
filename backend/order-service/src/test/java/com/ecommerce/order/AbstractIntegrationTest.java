package com.ecommerce.order;

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

        static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15"))
                        .withDatabaseName("order_db_test")
                        .withUsername("test")
                        .withPassword("test");

        static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.3.2"));

        static final GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7.0.12-alpine"))
                        .withExposedPorts(6379)
                        .waitingFor(Wait.forLogMessage(".*Ready to accept connections.*\\n", 1));

        static {
                postgres.start();
                kafka.start();
                redis.start();
        }

        @DynamicPropertySource
        static void configureProperties(DynamicPropertyRegistry registry) {
                registry.add("spring.datasource.url", postgres::getJdbcUrl);
                registry.add("spring.datasource.username", postgres::getUsername);
                registry.add("spring.datasource.password", postgres::getPassword);
                registry.add("spring.flyway.url", postgres::getJdbcUrl);
                registry.add("spring.flyway.user", postgres::getUsername);
                registry.add("spring.flyway.password", postgres::getPassword);

                // Kafka properties
                registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);

                // Redis properties
                registry.add("spring.data.redis.host", redis::getHost);
                registry.add("spring.data.redis.port", redis::getFirstMappedPort);

                // Env Vars / Properties replacement
                // Override strict properties directly to avoid placeholder resolution issues
                registry.add("jwt.secret",
                                () -> "test_secret_value_must_be_long_enough_for_hs512_signing_key_verification");
                registry.add("JWT_SECRET",
                                () -> "test_secret_value_must_be_long_enough_for_hs512_signing_key_verification");
                registry.add("DB_PASSWORD", () -> "test");
        }
}
