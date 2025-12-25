#!/bin/bash
# ============================================
# EPR SaaS - Smoke Test Script
# ============================================
# Test critical application paths after deployment
# Exit code 0 = pass, 1 = fail
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect environment
ENV=${1:-staging}
if [ -f ".env.$ENV" ]; then
  source ".env.$ENV" 2>/dev/null || true
fi

# Set ports based on environment
if [ "$ENV" = "production" ]; then
  BACKEND_PORT=8101
  CHATBOT_PORT=8100
else
  BACKEND_PORT=8001
  CHATBOT_PORT=8000
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Smoke Test - Starting ($ENV)${NC}"
echo -e "${GREEN}========================================${NC}"

ALL_PASSED=true
PASSED_COUNT=0
FAILED_COUNT=0

# Helper function to run test
run_test() {
  local test_name="$1"
  local test_command="$2"
  local expected_status="${3:-200}"

  echo -e "${YELLOW}Test: $test_name${NC}"

  HTTP_CODE=$(eval "$test_command")

  if [ "$HTTP_CODE" = "$expected_status" ]; then
    echo -e "${GREEN}  PASS: Got status $HTTP_CODE${NC}"
    PASSED_COUNT=$((PASSED_COUNT + 1))
  else
    echo -e "${RED}  FAIL: Expected $expected_status, got $HTTP_CODE${NC}"
    FAILED_COUNT=$((FAILED_COUNT + 1))
    ALL_PASSED=false
  fi
}

# Test 1: Backend health endpoint
run_test "Backend Health" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:$BACKEND_PORT/health" \
  "200"

# Test 2: Backend packages endpoint
run_test "Backend Packages List" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:$BACKEND_PORT/api/v1/packages" \
  "200"

# Test 3: Chatbot health endpoint
run_test "Chatbot Health" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:$CHATBOT_PORT/health" \
  "200"

# Test 4: Web frontend (if accessible from localhost)
# Commented out as web might not be directly accessible
# run_test "Web Frontend" \
#   "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001" \
#   "200"

# Test 5: Database connectivity (via backend)
# This tests that backend can connect to DB
run_test "Database Connectivity" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:$BACKEND_PORT/api/v1/packages" \
  "200"

echo -e "${GREEN}========================================${NC}"
echo "Test Results:"
echo "  Passed: $PASSED_COUNT"
echo "  Failed: $FAILED_COUNT"
echo -e "${GREEN}========================================${NC}"

if [ "$ALL_PASSED" = true ]; then
  echo -e "${GREEN}Smoke Test Passed${NC}"
  exit 0
else
  echo -e "${RED}Smoke Test Failed${NC}"
  exit 1
fi
