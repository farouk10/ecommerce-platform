-- ===================================
-- /Users/almostaphasmart/ecommerce-platform/backend/auth-service/src/main/resources/db/migration/V2__add_indexes.sql
-- AUTH SERVICE - PERFORMANCE INDEXES
-- ===================================

-- Index unique sur email (probablement déjà existant via @Column(unique=true))
-- Mais on le crée explicitement pour être sûr
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email 
ON users(email);

-- Index pour recherche case-insensitive sur email
CREATE INDEX IF NOT EXISTS idx_user_email_lower 
ON users(LOWER(email));

-- Index pour filtrer par rôle
CREATE INDEX IF NOT EXISTS idx_user_role 
ON users(role);

-- Index pour tri par date d'inscription
CREATE INDEX IF NOT EXISTS idx_user_created_at 
ON users(created_at DESC);

-- Index pour utilisateurs actifs (si tu ajoutes ce champ)
-- CREATE INDEX IF NOT EXISTS idx_user_active 
-- ON users(is_active) WHERE is_active = true;

-- Index composite role + date (pour admin queries)
CREATE INDEX IF NOT EXISTS idx_user_role_created 
ON users(role, created_at DESC);

-- ===================================
-- STATISTICS UPDATE
-- ===================================

ANALYZE users;

