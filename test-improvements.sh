#!/bin/bash

# Test platform improvements

echo "🧪 Testing Platform Improvements..."
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Wait for services
echo "Waiting for services to start (15s)..."
sleep 15

echo "=== Testing Improvements ==="
echo ""

# Test 1: Categories endpoint
echo -n "1. Categories endpoint... "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/categories)
if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $response)"
fi

# Test 2: Gateway health
echo -n "2. Gateway health endpoint... "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health)
if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $response)"
fi

# Test 3: Cache headers on index.html
echo -n "3. Cache-Control headers... "
cache_header=$(curl -s -I http://localhost/ | grep -i "cache-control" | grep -i "no-cache")
if [ -n "$cache_header" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Headers present)"
else
    echo -e "${RED}✗ FAIL${NC} (Headers missing)"
fi

echo ""
echo "🎉 Improvement testing complete!"
