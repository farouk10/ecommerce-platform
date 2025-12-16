#!/bin/bash

# Comprehensive Port Configuration Audit
# Checks all service ports for consistency

echo "🔍 Port Configuration Audit"
echo "============================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== SERVICE PORTS (docker-compose.yml) ===${NC}"
echo "Auth Service:       8081"
echo "Product Service:    8082"
echo "Order Service:      8083"
echo "Cart Service:       8085"
echo "API Gateway:        8080"
echo "Notification:       8084"
echo ""

echo -e "${BLUE}=== CHECKING APPLICATION.YML CONFIGURATIONS ===${NC}"
echo ""

# Check Cart Service
echo -e "${YELLOW}Cart Service URLs:${NC}"
grep -A 1 "service:" backend/cart-service/src/main/resources/application.yml | grep "url:" || echo "Not found"
echo ""

# Check Order Service  
echo -e "${YELLOW}Order Service URLs:${NC}"
grep -A 1 "product-url\|auth-url" backend/order-service/src/main/resources/application.yml | grep ":" || echo "Not found"
echo ""

# Check Notification Service
echo -e "${YELLOW}Notification Service URLs:${NC}"
grep -A 2 "auth:" backend/notification-service/src/main/resources/application.yml | grep "url:" || echo "Not found"
echo ""

echo -e "${BLUE}=== CHECKING HARDCODED LOCALHOST URLS ===${NC}"
echo ""
echo "Searching for localhost:XXXX patterns in Java files..."
find backend -name "*.java" -type f -exec grep -l "localhost:[0-9]" {} \; | while read file; do
    echo -e "${RED}Found in: $file${NC}"
    grep -n "localhost:[0-9]" "$file"
done
echo ""

echo -e "${BLUE}=== TESTING ACTUAL SERVICE PORTS ===${NC}"
echo ""

# Test each service
echo -n "Auth Service (8081): "
curl -s http://localhost:8080/api/auth/health > /dev/null && echo -e "${GREEN}✓ Accessible${NC}" || echo -e "${RED}✗ Not accessible${NC}"

echo -n "Product Service (8082) via Gateway: "
curl -s http://localhost:8080/api/products > /dev/null && echo -e "${GREEN}✓ Accessible${NC}" || echo -e "${RED}✗ Not accessible${NC}"

echo -n "Order Service (8083) via Gateway: "
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin2@ecommerce.com","password":"Admin@123"}' | jq -r '.accessToken')
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/orders > /dev/null && echo -e "${GREEN}✓ Accessible${NC}" || echo -e "${RED}✗ Not accessible${NC}"

echo -n "Cart Service (8085) via Gateway: "
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/cart > /dev/null && echo -e "${GREEN}✓ Accessible${NC}" || echo -e "${RED}✗ Not accessible${NC}"

echo ""
echo -e "${BLUE}=== INTER-SERVICE COMMUNICATION CHECK ===${NC}"
echo ""

# Check if services can reach each other internally
echo "Checking cart-service → product-service..."
docker exec cart-service curl -s http://product-service:8082/actuator/health | jq -r '.status' 2>/dev/null && echo -e "${GREEN}✓ Can reach product-service:8082${NC}" || echo -e "${RED}✗ Cannot reach product-service:8082${NC}"

echo "Checking cart-service → order-service..."
docker exec cart-service curl -s http://order-service:8083/actuator/health | jq -r '.status' 2>/dev/null && echo -e "${GREEN}✓ Can reach order-service:8083${NC}" || echo -e "${RED}✗ Cannot reach order-service:8083${NC}"

echo "Checking notification-service → auth-service..."
docker exec notification-service curl -s http://auth-service:8081/actuator/health | jq -r '.status' 2>/dev/null && echo -e "${GREEN}✓ Can reach auth-service:8081${NC}" || echo -e "${RED}✗ Cannot reach auth-service:8081${NC}"

echo ""
echo "============================"
echo "Audit Complete!"
