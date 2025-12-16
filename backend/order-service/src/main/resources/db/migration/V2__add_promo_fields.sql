-- Add promo code fields to orders table
-- /Users/almostaphasmart/ecommerce-platform/backend/order-service/src/main/resources/db/migration/V2__add_promo_fields.sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2);

-- Add index for promo code analytics
CREATE INDEX IF NOT EXISTS idx_promo_code ON orders(promo_code);

