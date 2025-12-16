#!/bin/bash

echo "🌱 Seeding E-Commerce Platform Database..."

# Admin User (password: Admin@123)
echo "Creating admin user..."
docker exec postgres psql -U postgres -d auth_db -c "INSERT INTO users (id, email, name, password, role) VALUES ('00000000-0000-0000-0000-000000000001', 'admin@ecommerce.com', 'Admin User', '\$2a\$10\$N9qo8uLOickgx2ZMRZoMye1J6HFa0.h3xKyJW5FvAYqIyHmq7.Vze', 'ADMIN') ON CONFLICT (email) DO NOTHING;"

# Categories
echo "Creating categories..."
docker exec postgres psql -U postgres -d product_db -c "INSERT INTO categories (id, name, description, parent_id) VALUES (1, 'Electronics', 'Electronic devices and accessories', NULL), (2, 'Laptops', 'Portable computers', 1), (3, 'Smartphones', 'Mobile phones', 1), (4, 'Headphones', 'Audio devices', 1), (5, 'Fashion', 'Clothing and accessories', NULL), (6, 'Men', 'Men clothing', 5), (7, 'Women', 'Women clothing', 5), (8, 'Home', 'Home and garden', NULL) ON CONFLICT DO NOTHING; SELECT setval('categories_id_seq', 8);"

# Products
echo "Creating products..."
docker exec postgres psql -U postgres -d product_db -c "INSERT INTO products (id, name, description, price, stock_quantity, category_id) VALUES (1, 'MacBook Pro 16', 'Apple MacBook Pro M3 Max', 2999.99, 15, 2), (2, 'Dell XPS 15', 'Dell XPS 15 i9 32GB RAM', 1899.99, 20, 2), (3, 'iPhone 15 Pro', 'Apple iPhone 15 Pro 256GB', 1199.99, 50, 3), (4, 'Samsung Galaxy S24', 'Samsung Galaxy S24 Ultra', 1299.99, 45, 3), (5, 'Sony WH-1000XM5', 'Premium noise-cancelling headphones', 399.99, 40, 4), (6, 'AirPods Pro', 'Apple AirPods Pro', 249.99, 60, 4), (7, 'Levis 501 Jeans', 'Classic straight-fit jeans', 69.99, 100, 6), (8, 'Nike Air Max', 'Running shoes', 149.99, 75, 6) ON CONFLICT DO NOTHING; SELECT setval('products_id_seq', 8);"

echo "✅ Database seeded successfully!"
echo ""
echo "📋 Admin credentials:"
echo "   Email: admin@ecommerce.com"
echo "   Password: Admin@123"
echo ""
echo "📊 Data created:"
docker exec postgres psql -U postgres -d auth_db -c "SELECT COUNT(*) as admin_users FROM users WHERE role='ADMIN';"
docker exec postgres psql -U postgres -d product_db -c "SELECT COUNT(*) as categories FROM categories;"
docker exec postgres psql -U postgres -d product_db -c "SELECT COUNT(*) as products FROM products;"
