-- ===================================
-- PRODUCT SERVICE - PERFORMANCE INDEXES
-- ===================================
-- /Users/almostaphasmart/ecommerce-platform/backend/product-service/src/main/resources/db/migration/V2__add_indexes.sql

-- Index pour recherche par nom (utilisé par findByNameContainingIgnoreCase)
CREATE INDEX IF NOT EXISTS idx_product_name_lower 
ON products(LOWER(name));

-- Index pour tri par prix
CREATE INDEX IF NOT EXISTS idx_product_price 
ON products(price);

-- Index pour filtrer par catégorie
CREATE INDEX IF NOT EXISTS idx_product_category_id 
ON products(category_id);

-- Index composite pour recherche + tri
CREATE INDEX IF NOT EXISTS idx_product_name_price 
ON products(LOWER(name), price);

-- Index pour tri par date (produits récents)
CREATE INDEX IF NOT EXISTS idx_product_created_at 
ON products(created_at DESC);

-- Index pour stock disponible
CREATE INDEX IF NOT EXISTS idx_product_stock 
ON products(stock_quantity) 
WHERE stock_quantity > 0;

-- ===================================
-- CATEGORY INDEXES
-- ===================================

-- Index sur nom de catégorie
CREATE INDEX IF NOT EXISTS idx_category_name 
ON categories(name);

-- Index pour catégories actives (si tu ajoutes ce champ plus tard)
-- CREATE INDEX IF NOT EXISTS idx_category_active 
-- ON categories(is_active) WHERE is_active = true;

-- ===================================
-- STATISTICS UPDATE
-- ===================================

-- Mettre à jour les statistiques PostgreSQL pour l'optimiseur
ANALYZE products;
ANALYZE categories;

