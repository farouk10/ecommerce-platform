-- ===================================
-- /Users/almostaphasmart/ecommerce-platform/backend/auth-service/src/main/resources/db/migration/V1__create_tables.sql
-- AUTH SERVICE - CREATE TABLES
-- ===================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
    );

-- Initial data (optional)
-- INSERT INTO users (id, email, name, password, role, created_at)
-- VALUES (gen_random_uuid(), 'admin@example.com', 'Admin', '$2a$10$...', 'ADMIN', NOW());
