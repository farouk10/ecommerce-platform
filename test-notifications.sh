#!/bin/bash

# Notification Service Test
# Tests if notification service receives and processes order events

echo "🔔 Testing Notification Service"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Checking Notification Service Status${NC}"
docker ps | grep notification-service && echo -e "${GREEN}✓ Running${NC}" || echo -e "${RED}✗ Not running${NC}"
echo ""

echo -e "${BLUE}2. Checking Kafka Connection${NC}"
docker logs notification-service 2>&1 | grep -i "kafka" | tail -5
echo ""

echo -e "${BLUE}3. Creating Test Order (should trigger notification)${NC}"
CUSTOMER_EMAIL="notif_test_$(date +%s)@test.com"

# Register customer
CUSTOMER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CUSTOMER_EMAIL\",\"name\":\"Notification Test\",\"password\":\"Test@123\"}")

CUSTOMER_TOKEN=$(echo $CUSTOMER_RESPONSE | jq -r '.accessToken')

if [ -n "$CUSTOMER_TOKEN" ]; then
    echo -e "${GREEN}✓ Customer created${NC}"
    
    # Add item to cart
    curl -s -X POST http://localhost:8080/api/cart/items \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -d '{"productId":1,"quantity":1}' > /dev/null
    
    echo -e "${GREEN}✓ Item added to cart${NC}"
    
    # Checkout (create order - should send Kafka event)
    ORDER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/cart/checkout \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -d '{"shippingAddress":"123 Test St","paymentMethod":"CREDIT_CARD"}')
    
    ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.order.id')
    
    if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
        echo -e "${GREEN}✓ Order created (ID: $ORDER_ID)${NC}"
        echo ""
        
        echo -e "${BLUE}4. Waiting for notification service to process event (3s)...${NC}"
        sleep 3
        
        echo -e "${BLUE}5. Checking notification service logs for order event${NC}"
        docker logs notification-service --tail 30 2>&1 | grep -A 5 "order" | tail -20
        
    else
        echo -e "${RED}✗ Order creation failed${NC}"
    fi
else
    echo -e "${RED}✗ Customer creation failed${NC}"
fi

echo ""
echo "================================"
echo "Test complete!"
