#!/bin/bash

# E-Commerce Platform - Automated API Test Suite
# Tests all critical endpoints

echo "🧪 Starting E-Commerce Platform API Tests..."
echo ""

BASE_URL="http://localhost:8080"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0.32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    local auth_token=$4
    
    echo -n "Testing $name... "
    
    if [ -z "$auth_token" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $auth_token" "$url")
    fi
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $response)"
        ((FAILED++))
    fi
}

echo "=== PUBLIC ENDPOINTS ==="
test_endpoint "Auth Health" "$BASE_URL/api/auth/health" 200
test_endpoint "Products List" "$BASE_URL/api/products" 200
test_endpoint "Categories" "$BASE_URL/api/categories" 200
test_endpoint "Single Product" "$BASE_URL/api/products/1" 200

echo ""
echo "=== AUTHENTICATION ==="
# Register a test user
echo -n "Testing Registration... "
reg_response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser_'$(date +%s)'@test.com",
    "name": "Test User",
    "password": "Test@123"
  }')

if echo "$reg_response" | grep -q "accessToken"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
    TOKEN=$(echo "$reg_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
    TOKEN=""
fi

echo ""
echo "=== PROTECTED ENDPOINTS (with JWT) ==="
if [ -n "$TOKEN" ]; then
    test_endpoint "Get Cart" "$BASE_URL/api/cart" 200 "$TOKEN"
    test_endpoint "Get Orders" "$BASE_URL/api/orders" 200 "$TOKEN"
else
    echo "Skipping protected endpoint tests (no token)"
    ((FAILED+=2))
fi

echo ""
echo "=== SERVICE HEALTH CHECKS ==="
test_endpoint "Product Service" "http://localhost:8082/actuator/health" 200
test_endpoint "Auth Service" "http://localhost:8081/actuator/health" 200
test_endpoint "Order Service" "http://localhost:8083/actuator/health" 200
test_endpoint "Cart Service" "http://localhost:8085/actuator/health" 200

echo ""
echo "================================"
echo "TEST SUMMARY"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
