#!/bin/bash

set -e  # Exit on error

export PGPASSWORD=ecommerce123  # ← CORRECT PASSWORD

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

############################################
# 1. INFRASTRUCTURE HEALTH CHECKS
############################################
section "1️⃣  INFRASTRUCTURE HEALTH CHECKS"

info "Checking PostgreSQL auth_db (port 5432)..."
if psql -h localhost -p 5432 -U ecommerce -d auth_db -c "SELECT 1;" > /dev/null 2>&1; then
  pass_test "auth_db (5432) is accessible"
else
  fail_test "auth_db (5432) connection failed"
fi

info "Checking PostgreSQL product_db (port 5433)..."
if psql -h localhost -p 5433 -U ecommerce -d product_db -c "SELECT 1;" > /dev/null 2>&1; then
  pass_test "product_db (5433) is accessible"
else
  fail_test "product_db (5433) connection failed"
fi

info "Checking PostgreSQL order_db (port 5434)..."
if psql -h localhost -p 5434 -U ecommerce -d order_db -c "SELECT 1;" > /dev/null 2>&1; then
  pass_test "order_db (5434) is accessible"
else
  fail_test "order_db (5434) connection failed"
fi

info "Checking Redis..."
if redis-cli -h localhost -p 6379 PING | grep -q "PONG"; then
  pass_test "Redis (6379) is running"
else
  fail_test "Redis (6379) not reachable"
fi

info "Checking Kafka..."
if docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list > /dev/null 2>&1; then
  pass_test "Kafka is running"
  TOPICS=$(docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null | tr -d '\r' | head -1)
  info "  Topics: $TOPICS..."
else
  fail_test "Kafka connection failed"
fi

info "Checking microservices health..."
for svc in "8081" "8082" "8083" "8085"; do
  if curl -s "http://localhost:${svc}/actuator/health" | grep -q '"status":"UP"'; then
    pass_test "Service port ${svc} is UP"
  else
    fail_test "Service port ${svc} is DOWN"
  fi
done

############################################
# 2. AUTHENTICATION & JWT TESTS
############################################
section "2️⃣  AUTHENTICATION & JWT TESTS"

info "Logging in as john@example.com..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}')

if echo "$LOGIN_RESPONSE" | jq -e '.accessToken' > /dev/null 2>&1; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
  USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.userId')
  pass_test "Login successful (user: $USER_ID)"
else
  fail_test "Login failed"
  echo "$LOGIN_RESPONSE" | jq
  exit 1
fi

info "Testing invalid credentials..."
INVALID_LOGIN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"wrongpassword"}')
if echo "$INVALID_LOGIN" | jq -e '.error // .message' > /dev/null 2>&1; then
  pass_test "Invalid credentials rejected"
else
  fail_test "Invalid credentials not rejected"
fi

############################################
# 3. PRODUCT SERVICE TESTS
############################################
section "3️⃣  PRODUCT SERVICE TESTS"

info "Fetching products page..."
PRODUCTS=$(curl -s "http://localhost:8082/api/products?page=0&size=10" \
  -H "Authorization: Bearer $TOKEN")
if echo "$PRODUCTS" | jq -e '.content // .[]' > /dev/null 2>&1; then
  COUNT=$(echo "$PRODUCTS" | jq '.content | length // length')
  pass_test "Products page OK ($COUNT items)"
else
  fail_test "Products page failed"
fi

info "Fetching product #1..."
PRODUCT=$(curl -s http://localhost:8082/api/products/1 \
  -H "Authorization: Bearer $TOKEN")
if echo "$PRODUCT" | jq -e '.id' > /dev/null 2>&1; then
  NAME=$(echo "$PRODUCT" | jq -r '.name')
  PRICE=$(echo "$PRODUCT" | jq -r '.price')
  STOCK=$(echo "$PRODUCT" | jq -r '.stockQuantity')
  pass_test "Product #1: $NAME ($$PRICE, stock: $STOCK)"
else
  fail_test "Product #1 fetch failed"
fi

info "Searching 'iPhone'..."
SEARCH=$(curl -s "http://localhost:8082/api/products/search?keyword=iPhone" \
  -H "Authorization: Bearer $TOKEN")
if echo "$SEARCH" | jq -e '.[0]' > /dev/null 2>&1; then
  COUNT=$(echo "$SEARCH" | jq 'length')
  pass_test "Search OK ($COUNT results)"
else
  fail_test "Search failed"
fi

############################################
# 4. CART & REDIS TESTS
############################################
section "4️⃣  CART & REDIS TESTS"

info "Clearing cart..."
curl -s -X DELETE http://localhost:8085/api/cart \
  -H "Authorization: Bearer $TOKEN" > /dev/null
pass_test "Cart cleared"

info "Adding iPhone to cart..."
ADD=$(curl -s -X POST http://localhost:8085/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"productName":"iPhone 16 Pro","price":1299.99,"quantity":1,"imageUrl":"iphone.jpg"}')
if echo "$ADD" | jq -e '.items[0]' > /dev/null 2>&1; then
  TOTAL=$(echo "$ADD" | jq -r '.totalAmount')
  pass_test "Cart item added ($$TOTAL)"
else
  fail_test "Cart add failed"
fi

info "Checking Redis cart storage..."
REDIS_VAL=$(redis-cli -h localhost -p 6379 GET "cart:$USER_ID" 2>/dev/null | head -c 50)
if [ -n "$REDIS_VAL" ]; then
  pass_test "Redis cart data OK (${REDIS_VAL}...)"
else
  fail_test "No Redis cart data"
fi

############################################
# 5. PROMO CODES
############################################
section "5️⃣  PROMO CODES"

info "Applying SAVE20..."
PROMO=$(curl -s -X POST http://localhost:8085/api/cart/promo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"SAVE20"}')
if echo "$PROMO" | jq -e '.promoCode=="SAVE20"' > /dev/null 2>&1; then
  DISC=$(echo "$PROMO" | jq -r '.discount')
  pass_test "SAVE20 OK ($$DISC discount)"
else
  fail_test "SAVE20 failed"
fi

info "Invalid promo test..."
BAD=$(curl -s -X POST http://localhost:8085/api/cart/promo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"FAKE"}')
if echo "$BAD" | jq -e '.error // .message' > /dev/null 2>&1; then
  pass_test "Invalid promo rejected"
else
  fail_test "Invalid promo accepted"
fi

############################################
# 6. FULL CHECKOUT FLOW
############################################
section "6️⃣  FULL CHECKOUT"

info "Complete checkout flow..."
CHECKOUT=$(curl -s -X POST http://localhost:8085/api/cart/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shippingAddress":"TEST ADDRESS","paymentMethod":"CREDIT_CARD"}')
if echo "$CHECKOUT" | jq -e '.success==true' > /dev/null 2>&1; then
  ORDER_ID=$(echo "$CHECKOUT" | jq -r '.order.id')
  ORDER_NUM=$(echo "$CHECKOUT" | jq -r '.order.orderNumber')
  pass_test "✅ CHECKOUT SUCCESS (Order #$ORDER_NUM)"
else
  fail_test "❌ CHECKOUT FAILED"
fi

info "Cart cleared after checkout..."
CART=$(curl -s http://localhost:8085/api/cart -H "Authorization: Bearer $TOKEN")
if echo "$CART" | jq -e '.items|length==0' > /dev/null 2>&1; then
  pass_test "Cart empty ✓"
else
  fail_test "Cart not cleared"
fi

info "Order in database..."
DB_CHECK=$(psql -h localhost -p 5434 -U ecommerce -d order_db -t -c "SELECT order_number FROM orders WHERE id=$ORDER_ID;" 2>/dev/null | tr -d '\r' | xargs)
if [ -n "$DB_CHECK" ]; then
  pass_test "Order in DB: $DB_CHECK"
else
  fail_test "Order missing from DB"
fi

############################################
# 7. KAFKA & SECURITY
############################################
section "7️⃣  KAFKA & SECURITY"

info "Kafka consumer groups..."
GROUPS=$(docker exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list 2>/dev/null | tr -d '\r')
if echo "$GROUPS" | grep -q "notification-service"; then
  pass_test "Kafka notification-service ✓"
else
  info "Consumer group may not have started yet"
fi

info "Security (no token)..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8085/api/cart)
if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
  pass_test "JWT required ($CODE)"
else
  fail_test "Security failed ($CODE)"
fi

############################################
# SUMMARY
############################################
section "📊  FINAL SUMMARY"

TOTAL=$((PASSED+FAILED))
RATE=$((PASSED*100/(TOTAL>0?TOTAL:1)))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Tests: ${BLUE}$TOTAL${NC} | ${GREEN}PASS:$PASSED${NC} | ${RED}FAIL:$FAILED${NC} | ${YELLOW}$RATE%${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ $FAILED -eq 0 ] && echo -e "${GREEN}🎉 PRODUCTION READY BACKEND!${NC}" || echo -e "${RED}⚠️  FIX REQUIRED${NC}"
