#!/bin/bash

echo "📊 STATISTIQUES GLOBALES"
echo "======================="

echo ""
echo "👥 USERS"
docker exec -it auth-db psql -U ecommerce -d auth_db -c "
SELECT role, COUNT(*) as total FROM users GROUP BY role;
"

echo ""
echo "📦 PRODUCTS"
docker exec -it product-db psql -U ecommerce -d product_db -c "
SELECT 
    COUNT(*) as total_products,
    SUM(stock_quantity) as total_stock,
    SUM(price * stock_quantity)::numeric(10,2) as inventory_value
FROM products;
"

echo ""
echo "🛒 ORDERS"
docker exec -it order-db psql -U ecommerce -d order_db -c "
SELECT 
    status,
    COUNT(*) as total,
    SUM(total_amount)::numeric(10,2) as revenue
FROM orders
GROUP BY status;
"

echo ""
echo "🎟️ PROMO CODES"
docker exec -it order-db psql -U ecommerce -d order_db -c "
SELECT 
    promo_code,
    COUNT(*) as usage,
    SUM(discount)::numeric(10,2) as total_discount
FROM orders
WHERE promo_code IS NOT NULL
GROUP BY promo_code;
"
