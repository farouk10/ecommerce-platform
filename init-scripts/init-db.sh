#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER ecommerce WITH PASSWORD 'ecommerce123';
    CREATE DATABASE auth_db;
    CREATE DATABASE product_db;
    CREATE DATABASE order_db;
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO ecommerce;
    GRANT ALL PRIVILEGES ON DATABASE product_db TO ecommerce;
    GRANT ALL PRIVILEGES ON DATABASE order_db TO ecommerce;
    -- Also grant schema privileges for public schema in each DB (Postgres 15+ change)
    \c auth_db
    GRANT ALL ON SCHEMA public TO ecommerce;
    \c product_db
    GRANT ALL ON SCHEMA public TO ecommerce;
    \c order_db
    GRANT ALL ON SCHEMA public TO ecommerce;
EOSQL
