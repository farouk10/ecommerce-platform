-- ==========================================
-- E-COMMERCE PLATFORM - SEED DATA
-- ==========================================
-- ==========================================
-- 1. AUTH DATABASE - USERS
-- ==========================================
\ c auth_db -- Create Admin User (password: Admin@123)
INSERT INTO users (
        id,
        email,
        name,
        password,
        role,
        email_verified,
        created_at,
        updated_at
    )
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'admin@ecommerce.com',
        'Platform Admin',
        '$2a$10$N9qo8uLOickgx2ZMRZoMye1J6HFa0.h3xKyJW5FvAYqIyHmq7.Vze',
        -- Bcrypt hash for "Admin@123"
        'ADMIN',
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO NOTHING;
-- ==========================================
-- 2. PRODUCT DATABASE - CATEGORIES
-- ==========================================
\ c product_db -- Electronics Categories
INSERT INTO categories (
        id,
        name,
        description,
        parent_id,
        created_at,
        updated_at
    )
VALUES (
        1,
        'Electronics',
        'Electronic devices and accessories',
        NULL,
        NOW(),
        NOW()
    ),
    (
        2,
        'Laptops',
        'Portable computers',
        1,
        NOW(),
        NOW()
    ),
    (
        3,
        'Smartphones',
        'Mobile phones and accessories',
        1,
        NOW(),
        NOW()
    ),
    (
        4,
        'Headphones',
        'Audio devices',
        1,
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING;
-- Fashion Categories  
INSERT INTO categories (
        id,
        name,
        description,
        parent_id,
        created_at,
        updated_at
    )
VALUES (
        5,
        'Fashion',
        'Clothing and accessories',
        NULL,
        NOW(),
        NOW()
    ),
    (6, 'Men', 'Men''s clothing', 5, NOW(), NOW()),
    (7, 'Women', 'Women''s clothing', 5, NOW(), NOW()) ON CONFLICT DO NOTHING;
-- Home Categories
INSERT INTO categories (
        id,
        name,
        description,
        parent_id,
        created_at,
        updated_at
    )
VALUES (
        8,
        'Home & Garden',
        'Home improvement and garden supplies',
        NULL,
        NOW(),
        NOW()
    ),
    (
        9,
        'Furniture',
        'Home and office furniture',
        8,
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING;
-- Reset sequence
SELECT setval(
        'categories_id_seq',
        (
            SELECT MAX(id)
            FROM categories
        )
    );
-- ==========================================
-- 3. PRODUCT DATABASE - PRODUCTS
-- ==========================================
-- Electronics Products
INSERT INTO products (
        id,
        name,
        description,
        price,
        stock_quantity,
        category_id,
        created_at,
        updated_at
    )
VALUES -- Laptops
    (
        1,
        'MacBook Pro 16"',
        'Apple MacBook Pro with M3 Max chip, 16" Retina display, 36GB RAM',
        2999.99,
        15,
        2,
        NOW(),
        NOW()
    ),
    (
        2,
        'Dell XPS 15',
        'Dell XPS 15 with Intel i9, 32GB RAM, 1TB SSD',
        1899.99,
        20,
        2,
        NOW(),
        NOW()
    ),
    (
        3,
        'ThinkPad X1 Carbon',
        'Lenovo ThinkPad X1 Carbon Gen 11, lightweight business laptop',
        1599.99,
        25,
        2,
        NOW(),
        NOW()
    ),
    -- Smartphones
    (
        4,
        'iPhone 15 Pro',
        'Apple iPhone 15 Pro with A17 Pro chip, 256GB',
        1199.99,
        50,
        3,
        NOW(),
        NOW()
    ),
    (
        5,
        'Samsung Galaxy S24',
        'Samsung Galaxy S24 Ultra with S Pen, 512GB',
        1299.99,
        45,
        3,
        NOW(),
        NOW()
    ),
    (
        6,
        'Google Pixel 8 Pro',
        'Google Pixel 8 Pro with advanced AI features',
        999.99,
        30,
        3,
        NOW(),
        NOW()
    ),
    -- Headphones
    (
        7,
        'Sony WH-1000XM5',
        'Premium noise-cancelling wireless headphones',
        399.99,
        40,
        4,
        NOW(),
        NOW()
    ),
    (
        8,
        'AirPods Pro',
        'Apple AirPods Pro with active noise cancellation',
        249.99,
        60,
        4,
        NOW(),
        NOW()
    ),
    (
        9,
        'Bose QuietComfort Ultra',
        'Bose flagship noise-cancelling headphones',
        429.99,
        35,
        4,
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING;
-- Fashion Products
INSERT INTO products (
        id,
        name,
        description,
        price,
        stock_quantity,
        category_id,
        created_at,
        updated_at
    )
VALUES (
        10,
        'Levi''s 501 Jeans',
        'Classic straight-fit jeans for men',
        69.99,
        100,
        6,
        NOW(),
        NOW()
    ),
    (
        11,
        'Nike Air Max',
        'Comfortable running shoes with air cushioning',
        149.99,
        75,
        6,
        NOW(),
        NOW()
    ),
    (
        12,
        'Summer Dress',
        'Floral print summer dress',
        79.99,
        50,
        7,
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING;
-- Home Products
INSERT INTO products (
        id,
        name,
        description,
        price,
        stock_quantity,
        category_id,
        created_at,
        updated_at
    )
VALUES (
        13,
        'Office Chair',
        'Ergonomic office chair with lumbar support',
        299.99,
        30,
        9,
        NOW(),
        NOW()
    ),
    (
        14,
        'Standing Desk',
        'Adjustable height standing desk',
        499.99,
        20,
        9,
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING;
-- Reset sequence
SELECT setval(
        'products_id_seq',
        (
            SELECT MAX(id)
            FROM products
        )
    );
COMMIT;