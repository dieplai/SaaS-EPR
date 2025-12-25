#!/bin/bash
# ============================================
# Test Web Frontend Build Locally
# ============================================
# Usage: ./test-build-web.sh [staging|production]
# Tests Docker build with proper build args
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check argument
ENV=${1:-staging}

if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
  echo -e "${RED}Error: Invalid environment. Use 'staging' or 'production'${NC}"
  exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Web Frontend Build - $ENV${NC}"
echo -e "${BLUE}========================================${NC}"

# Set URLs based on environment
if [ "$ENV" == "production" ]; then
  API_URL="https://epr.dieplai.io.vn/api"
  CHATBOT_URL="https://epr.dieplai.io.vn"
  APP_URL="https://epr.dieplai.io.vn"
else
  API_URL="https://staging.epr.dieplai.io.vn/api"
  CHATBOT_URL="https://staging.epr.dieplai.io.vn"
  APP_URL="https://staging.epr.dieplai.io.vn"
fi

echo -e "${YELLOW}Build Configuration:${NC}"
echo -e "  Environment: ${ENV}"
echo -e "  API URL: ${API_URL}"
echo -e "  Chatbot URL: ${CHATBOT_URL}"
echo -e "  App URL: ${APP_URL}"
echo ""

# Navigate to web directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT/web"

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf .next node_modules/.cache 2>/dev/null || true

# Build with proper args
echo -e "${YELLOW}Building Docker image...${NC}"
docker build \
  --no-cache \
  --progress=plain \
  --build-arg NEXT_PUBLIC_BROWSER_API_URL="${API_URL}" \
  --build-arg NEXT_PUBLIC_BROWSER_CHATBOT_URL="${CHATBOT_URL}" \
  --build-arg NEXT_PUBLIC_APP_URL="${APP_URL}" \
  -t "epr-web-test:${ENV}" \
  -f Dockerfile \
  .

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}To run the built image locally:${NC}"
echo -e "  docker run -p 3000:3000 epr-web-test:${ENV}"
echo ""
echo -e "${YELLOW}To verify environment variables:${NC}"
echo -e "  docker run --rm epr-web-test:${ENV} env | grep NEXT_PUBLIC"
echo ""
echo -e "${YELLOW}To test in browser:${NC}"
echo -e "  1. docker run -p 3000:3000 epr-web-test:${ENV}"
echo -e "  2. Open http://localhost:3000"
echo -e "  3. Check browser console for API URLs"
echo ""
