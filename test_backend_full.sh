#!/bin/bash

# NO set -e - show ALL errors

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

pass_test() { echo -e "${GREEN}✓ PASSED${NC}: $1"; ((PASSED++)); }
fail_test() { echo -e "${RED}✗ FAILED${NC}: $1"; ((FAILED++)); }
info()      { echo -e "${BLUE}ℹ${NC} $1"; }
section()   { echo ""; echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${YELLOW}$1${NC}"; echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

echo "=================================="
echo "🚀 FULL E-COMMERCE BACKEND TEST"
echo "=================================="

export PGPASSWORD=ecommerce123

section "🔍 DATABASE TESTS"
info "auth_db (5432)..."
psql -h localhost -p 5432 -U ecommerce -d auth_db -c "SELECT 1;" && pass_test "auth_db ✓" || fail_test "auth_db ✗"

info "product_db (5433)..."
psql -h localhost -p 5433 -U ecommerce -d product_db -c "SELECT 1;" && pass_test "product_db ✓" || fail_test "product_db ✗"

info "order_db (5434)..."
psql -h localhost -p 5434 -U ecommerce -d order_db -c "SELECT 1;" && pass_test "order_db ✓" || fail_test "order_db ✗"

section "🔍 REDIS & DOCKER"
redis-cli -h localhost -p 6379 ping && pass_test "Redis ✓" || fail_test "Redis ✗"

docker ps | grep -E "(auth-db|product-db|order-db|redis|kafka|zookeeper)" && pass_test "Docker containers ✓" || fail_test "Docker issue"

section "🔍 MICROSERVICES"
for port in 8081 8082 8083 8085; do
  if curl -s -f "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
    pass_test "Service $port ✓"
  else
    fail_test "Service $port DOWN"
  fi
done

section "🔍 JWT LOGIN"
LOGIN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}')
echo "$LOGIN" | jq -r '.accessToken // "NO TOKEN"' | head -c 50
if echo "$LOGIN" | jq -e '.accessToken' > /dev/null 2>&1; then
  TOKEN=$(echo "$LOGIN" | jq -r '.accessToken')
  pass_test "JWT ✓"
else
  fail_test "JWT login ✗"
fi

section "🔍 PRODUCT API"
PROD=$(curl -s http://localhost:8082/api/products/1 -H "Authorization: Bearer $TOKEN")
if echo "$PROD" | jq -e '.id' > /dev/null 2>&1; then
  pass_test "Product API ✓"
else
  fail_test "Product API ✗"
fi

section "🔍 CART + PROMO + CHECKOUT"
curl -s -X DELETE http://localhost:8085/api/cart -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s -X POST http://localhost:8085/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"productName":"Test","price":100,"quantity":1,"imageUrl":"test.jpg"}' > /dev/null
curl -s -X POST http://localhost:8085/api/cart/promo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"SAVE20"}' > /dev/null

CHECKOUT=$(curl -s -X POST http://localhost:8085/api/cart/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shippingAddress":"TEST","paymentMethod":"CARD"}')

if echo "$CHECKOUT" | jq -e '.success==true' > /dev/null 2>&1; then
  pass_test "✅ FULL E2E CHECKOUT ✓"
else
  fail_test "❌ CHECKOUT FAILED"
  echo "$CHECKOUT" | jq .
fi

section "📊 SUMMARY"
TOTAL=$((PASSED+FAILED))
RATE=$((PASSED*100/(TOTAL>0?TOTAL:1)))

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Tests: $TOTAL | PASS: $PASSED | FAIL: $FAILED | $RATE%"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
[ $FAILED -eq 0 ] && echo -e "${GREEN}🎉 BACKEND 100% FUNCTIONAL!${NC}" || echo -e "${RED}⚠️  $FAILED failures${NC}"
