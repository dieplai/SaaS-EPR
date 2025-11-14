#!/bin/bash

# ============================================
# EPR SaaS - API Testing Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Config
API_URL="${API_URL:-http://localhost:8000}"
AI_URL="${AI_URL:-http://localhost:8004}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}EPR SaaS - API Testing${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ============================================
# Helper Functions
# ============================================

check_service() {
    local name=$1
    local url=$2

    echo -ne "Checking ${name}... "

    if curl -sf "${url}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ UP${NC}"
        return 0
    else
        echo -e "${RED}✗ DOWN${NC}"
        return 1
    fi
}

test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local headers=$5

    echo -ne "Testing ${name}... "

    if [ -z "$data" ]; then
        response=$(curl -sf -X "${method}" "${url}" ${headers} 2>&1)
    else
        response=$(curl -sf -X "${method}" "${url}" \
            -H "Content-Type: application/json" \
            ${headers} \
            -d "${data}" 2>&1)
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "Response: $response"
        return 1
    fi
}

# ============================================
# Service Health Checks
# ============================================

echo -e "${YELLOW}1. Service Health Checks${NC}"
echo "---"

# check_service "API Gateway" "${API_URL}"
check_service "AI Chatbot" "${AI_URL}"
# check_service "User Service" "http://localhost:8001"
# check_service "Package Service" "http://localhost:8002"

echo ""

# ============================================
# Database Checks
# ============================================

echo -e "${YELLOW}2. Database Checks${NC}"
echo "---"

echo -ne "PostgreSQL... "
if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓ UP${NC}"
else
    echo -e "${RED}✗ DOWN${NC}"
fi

echo -ne "Redis... "
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ UP${NC}"
else
    echo -e "${RED}✗ DOWN${NC}"
fi

echo -ne "Weaviate... "
if curl -sf http://localhost:8080/v1/.well-known/ready > /dev/null 2>&1; then
    echo -e "${GREEN}✓ UP${NC}"
else
    echo -e "${RED}✗ DOWN${NC}"
fi

echo ""

# ============================================
# AI Chatbot Tests
# ============================================

echo -e "${YELLOW}3. AI Chatbot Tests${NC}"
echo "---"

# Test 1: Health check
test_endpoint "Health endpoint" "GET" "${AI_URL}/health"

# Test 2: Simple query (without auth for now)
# query_data='{"query": "EPR là gì?"}'
# test_endpoint "Simple query" "POST" "${AI_URL}/query" "${query_data}"

# Test 3: FAQ query
# faq_data='{"query": "Các đối tượng nào phải thực hiện trách nhiệm tái chế?"}'
# test_endpoint "FAQ query" "POST" "${AI_URL}/query" "${faq_data}"

echo ""

# ============================================
# Database Data Checks
# ============================================

echo -e "${YELLOW}4. Database Data Checks${NC}"
echo "---"

echo -ne "Users table... "
user_count=$(docker compose exec -T postgres psql -U postgres -d epr_saas -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
if [ "$user_count" -gt 0 ]; then
    echo -e "${GREEN}✓ ${user_count} users${NC}"
else
    echo -e "${RED}✗ No users${NC}"
fi

echo -ne "Packages table... "
package_count=$(docker compose exec -T postgres psql -U postgres -d epr_saas -t -c "SELECT COUNT(*) FROM packages;" 2>/dev/null | tr -d ' ')
if [ "$package_count" -ge 4 ]; then
    echo -e "${GREEN}✓ ${package_count} packages${NC}"
else
    echo -e "${YELLOW}⚠ Only ${package_count} packages (expected 4)${NC}"
fi

echo -ne "Subscriptions table... "
sub_count=$(docker compose exec -T postgres psql -U postgres -d epr_saas -t -c "SELECT COUNT(*) FROM subscriptions;" 2>/dev/null | tr -d ' ')
if [ "$sub_count" -gt 0 ]; then
    echo -e "${GREEN}✓ ${sub_count} subscriptions${NC}"
else
    echo -e "${YELLOW}⚠ No subscriptions${NC}"
fi

echo ""

# ============================================
# Ollama Checks
# ============================================

echo -e "${YELLOW}5. Ollama (Local LLM) Checks${NC}"
echo "---"

echo -ne "Ollama service... "
if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ UP${NC}"

    # List models
    echo -ne "Installed models... "
    models=$(curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null)
    if [ -n "$models" ]; then
        echo -e "${GREEN}✓${NC}"
        echo "$models" | while read -r model; do
            echo "  - $model"
        done
    else
        echo -e "${YELLOW}⚠ No models installed${NC}"
        echo "  Run: make ollama-pull"
    fi
else
    echo -e "${RED}✗ DOWN${NC}"
fi

echo ""

# ============================================
# Summary
# ============================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Service URLs:"
echo "  - API Gateway:    ${API_URL}"
echo "  - AI Chatbot:     ${AI_URL}"
echo "  - Grafana:        http://localhost:3000"
echo "  - Prometheus:     http://localhost:9090"
echo "  - Jaeger:         http://localhost:16686"
echo ""
echo "To run full load test: make load-test"
echo "To view logs: make logs"
echo ""
