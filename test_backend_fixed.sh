#!/bin/bash
set -e

export PGPASSWORD=ecommerce123  # ← PASSWORD ADDED HERE

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
echo "🚀 E-COMMERCE BACKEND TEST SUITE"
echo "=================================="

section "1️⃣  DATABASE CONNECTIONS"

info "Testing auth_db (port 5432)..."
if psql -h localhost -p 5432 -U ecommerce -d auth_db -c "SELECT 1;" > /dev/null 2>&1; then
  pass_test "auth_db (5432) ✓"
else
  fail_test "auth_db (5432) ✗"
fi

info "Testing product_db (port 5433)..."
if psql -h localhost -p 5433 -U ecommerce -d product_db -c "SELECT 1;" > /dev/null 2>&1; then
  pass_test "product_db (5433) ✓"
else
  fail_test "product_db (5433) ✗"
fi

info "Testing order_db (port 5434)..."
if psql -h localhost -p 5434 -U ecommerce -d order_db -c "SELECT 1;" > /dev/null 2>&1; then
  pass_test "order_db (5434) ✓"
else
  fail_test "order_db (5434) ✗"
fi

section "2️⃣  REDIS & DOCKER INFRA"

info "Testing Redis..."
if redis-cli -h localhost -p 6379 ping | grep -q PONG; then
  pass_test "Redis ✓"
else
  fail_test "Redis ✗"
fi

info "Docker containers..."
docker ps --filter "name=order-db" --format "table {{.Names}}\t{{.Status}}" | tail -n +2
docker ps --filter "name=kafka" --format "table {{.Names}}\t{{.Status}}" | tail -n +2
docker ps --filter "name=zookeeper" --format "table {{.Names}}\t{{.Status}}" | tail -n +2

section "3️⃣  MICROSERVICES HEALTH"

for port in 8081 8082 8083 8085; do
  if curl -s "http://localhost:${port}/actuator/health" | grep -q '"status":"UP"'; then
    pass_test "Port $port ✓"
  else
    fail_test "Port $port ✗"
  fi
done

section "4️⃣  JWT & AUTH"

LOGIN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}')

if echo "$LOGIN" | jq -e '.accessToken' >/dev/null 2>&1; then
  TOKEN=$(echo "$LOGIN" | jq -r '.accessToken')
  pass_test "JWT login ✓"
else
  fail_test "JWT login ✗"
  exit 1
fi

section "5️⃣  FULL E2E FLOW"

# Clear cart + add item
curl -s -X DELETE http://localhost:8085/api/cart -H "Authorization: Bearer $TOKEN" >/dev/null
curl -s -X POST http://localhost:8085/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"productName":"iPhone","price":1299.99,"quantity":1,"imageUrl":"test.jpg"}' >/dev/null

# Apply promo
curl -s -X POST http://localhost:8085/api/cart/promo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"SAVE20"}' >/dev/null

# Checkout
CHECKOUT=$(curl -s -X POST http://localhost:8085/api/cart/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shippingAddress":"TEST","paymentMethod":"CREDIT_CARD"}')

if echo "$CHECKOUT" | jq -e '.success == true' >/dev/null 2>&1; then
  ORDER_ID=$(echo "$CHECKOUT" | jq -r '.order.id')
  pass_test "✅ FULL CHECKOUT SUCCESS (Order ID: $ORDER_ID)"
else
  fail_test "❌ CHECKOUT FAILED"
fi

section "📊 SUMMARY"
TOTAL=$((PASSED+FAILED))
RATE=$((PASSED*100/($TOTAL>0 ? TOTAL : 1)))

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total: $TOTAL | Passed: $PASSED | Failed: $FAILED | $RATE%"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ $FAILED -eq 0 ] && echo -e "${GREEN}🎉 PRODUCTION READY!${NC}" || echo -e "${RED}⚠️  FIX NEEDED${NC}"
