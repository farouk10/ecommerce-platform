#!/bin/bash

# Comprehensive CRUD Testing Suite
# Tests all Create, Read, Update, Delete operations

echo "🧪 E-Commerce Platform - CRUD Testing Suite"
echo "=========================================="
echo ""

BASE_URL="http://localhost:8080"
PASSED=0
FAILED=0

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test helper
test_crud() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local token=$5
    local expected=$6
    
    echo -n "  Testing $name... "
    
    if [ -z "$data" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$url")
        else
            response=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Authorization: Bearer $token" "$url")
        fi
    else
        if [ -z "$token" ]; then
            response=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$url")
        else
            response=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data" "$url")
        fi
    fi
    
    if [ "$response" -eq "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected, got $response)"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}=== ADMIN AUTHENTICATION ===${NC}"
echo "Logging in as admin..."

ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@ecommerce.com",
    "password": "Admin@123"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓ Admin login successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Admin login failed${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}=== CUSTOMER AUTHENTICATION ===${NC}"
echo "Creating test customer..."

CUSTOMER_EMAIL="testcrud_$(date +%s)@test.com"
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$CUSTOMER_EMAIL\",
    \"name\": \"CRUD Test User\",
    \"password\": \"Test@123\"
  }")

CUSTOMER_TOKEN=$(echo $CUSTOMER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$CUSTOMER_TOKEN" ]; then
    echo -e "${GREEN}✓ Customer registration successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Customer registration failed${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}=== PRODUCT CRUD (Admin) ===${NC}"

# CREATE Product
echo -n "  Creating product... "
CREATE_PRODUCT=$(curl -s -X POST "$BASE_URL/api/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Test Product CRUD",
    "description": "Testing CRUD operations",
    "price": 99.99,
    "stockQuantity": 50,
    "categoryId": 1
  }')

PRODUCT_ID=$(echo $CREATE_PRODUCT | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$PRODUCT_ID" ]; then
    echo -e "${GREEN}✓ PASS${NC} (ID: $PRODUCT_ID)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# READ Product
test_crud "Reading product" "GET" "$BASE_URL/api/products/$PRODUCT_ID" "" "" 200

# UPDATE Product  
test_crud "Updating product" "PUT" "$BASE_URL/api/products/$PRODUCT_ID" \
  '{"name":"Updated Test Product","description":"Updated","price":149.99,"stockQuantity":100,"categoryId":1}' \
  "$ADMIN_TOKEN" 200

# DELETE will be at the end

echo ""
echo -e "${BLUE}=== CATEGORY CRUD (Admin) ===${NC}"

# CREATE Category
echo -n "  Creating category... "
CREATE_CATEGORY=$(curl -s -X POST "$BASE_URL/api/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Test Category",
    "description": "Testing category CRUD"
  }')

CATEGORY_ID=$(echo $CREATE_CATEGORY | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$CATEGORY_ID" ]; then
    echo -e "${GREEN}✓ PASS${NC} (ID: $CATEGORY_ID)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# READ Categories
test_crud "Reading categories" "GET" "$BASE_URL/api/categories" "" "" 200

# UPDATE Category
test_crud "Updating category" "PUT" "$BASE_URL/api/categories/$CATEGORY_ID" \
  '{"name":"Updated Category","description":"Updated description"}' \
  "$ADMIN_TOKEN" 200

echo ""
echo -e "${BLUE}=== CART CRUD (Customer) ===${NC}"

# CREATE Cart Item
test_crud "Adding to cart" "POST" "$BASE_URL/api/cart/items" \
  "{\"productId\":$PRODUCT_ID,\"quantity\":2}" \
  "$CUSTOMER_TOKEN" 200

# READ Cart
test_crud "Reading cart" "GET" "$BASE_URL/api/cart" "" "$CUSTOMER_TOKEN" 200

# UPDATE Cart Item
test_crud "Updating cart item" "PUT" "$BASE_URL/api/cart/items/$PRODUCT_ID" \
  '{"quantity":5}' \
  "$CUSTOMER_TOKEN" 200

# DELETE Cart Item
test_crud "Removing from cart" "DELETE" "$BASE_URL/api/cart/items/$PRODUCT_ID" \
  "" "$CUSTOMER_TOKEN" 200

echo ""
echo -e "${BLUE}=== ORDER CRUD ===${NC}"

# Re-add to cart for checkout
curl -s -X POST "$BASE_URL/api/cart/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{\"productId\":$PRODUCT_ID,\"quantity\":1}" > /dev/null

# CREATE Order (Checkout)
echo -n "  Creating order (checkout)... "
CREATE_ORDER=$(curl -s -X POST "$BASE_URL/api/cart/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "shippingAddress": "123 Test St, City, 12345",
    "paymentMethod": "CREDIT_CARD"
  }')

ORDER_ID=$(echo $CREATE_ORDER | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$ORDER_ID" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Order ID: $ORDER_ID)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# READ Orders
test_crud "Reading orders" "GET" "$BASE_URL/api/orders" "" "$CUSTOMER_TOKEN" 200

# READ Single Order
if [ -n "$ORDER_ID" ]; then
    test_crud "Reading order details" "GET" "$BASE_URL/api/orders/$ORDER_ID" "" "$CUSTOMER_TOKEN" 200
fi

echo ""
echo -e "${BLUE}=== CLEANUP (DELETE Operations) ===${NC}"

# DELETE Product
if [ -n "$PRODUCT_ID" ]; then
    test_crud "Deleting product" "DELETE" "$BASE_URL/api/products/$PRODUCT_ID" "" "$ADMIN_TOKEN" 200
fi

# DELETE Category
if [ -n "$CATEGORY_ID" ]; then
    test_crud "Deleting category" "DELETE" "$BASE_URL/api/categories/$CATEGORY_ID" "" "$ADMIN_TOKEN" 200
fi

echo ""
echo "========================================"
echo -e "${BLUE}CRUD TEST SUMMARY${NC}"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CRUD TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME CRUD TESTS FAILED${NC}"
    exit 1
fi
