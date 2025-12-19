#!/bin/bash
# ============================================
# Force Pull Latest Images from GHCR
# ============================================
# This script forces a pull of the latest
# images and restarts containers
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV=${1:-staging}

if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
  echo -e "${RED}Error: Invalid environment. Use 'staging' or 'production'${NC}"
  exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Force Pulling Latest Images - $ENV${NC}"
echo -e "${BLUE}========================================${NC}"

# Get latest commit SHA from GitHub
echo -e "${YELLOW}Fetching latest commit SHA...${NC}"
git fetch origin main
LATEST_SHA=$(git rev-parse origin/main)
SHORT_SHA=${LATEST_SHA:0:7}

echo -e "${GREEN}Latest commit: $LATEST_SHA${NC}"
echo -e "${GREEN}Short SHA: $SHORT_SHA${NC}"

# Login to GHCR (if needed)
echo -e "${YELLOW}Logging into GitHub Container Registry...${NC}"
# Note: Assumes GH_TOKEN or docker login already done

# Pull SHA-tagged images
echo -e "${YELLOW}Pulling SHA-tagged images from GHCR...${NC}"

echo -e "${BLUE}1. Pulling backend image...${NC}"
docker pull "ghcr.io/dieplai/saas-epr-backend:${ENV}-${LATEST_SHA}" || {
  echo -e "${RED}Failed to pull backend image${NC}"
  exit 1
}
docker tag "ghcr.io/dieplai/saas-epr-backend:${ENV}-${LATEST_SHA}" \
           "ghcr.io/dieplai/saas-epr-backend:${ENV}"

echo -e "${BLUE}2. Pulling chatbot image...${NC}"
docker pull "ghcr.io/dieplai/saas-epr-chatbot:${ENV}-${LATEST_SHA}" || {
  echo -e "${RED}Failed to pull chatbot image${NC}"
  exit 1
}
docker tag "ghcr.io/dieplai/saas-epr-chatbot:${ENV}-${LATEST_SHA}" \
           "ghcr.io/dieplai/saas-epr-chatbot:${ENV}"

echo -e "${BLUE}3. Pulling web frontend image...${NC}"
docker pull "ghcr.io/dieplai/saas-epr-web:${ENV}-${LATEST_SHA}" || {
  echo -e "${RED}Failed to pull web frontend image${NC}"
  exit 1
}
docker tag "ghcr.io/dieplai/saas-epr-web:${ENV}-${LATEST_SHA}" \
           "ghcr.io/dieplai/saas-epr-web:${ENV}"

echo -e "${GREEN}✓ All images pulled successfully${NC}"

# Verify web image doesn't contain localhost
echo -e "${YELLOW}Verifying web image doesn't contain localhost URLs...${NC}"
LOCALHOST_COUNT=$(docker run --rm "ghcr.io/dieplai/saas-epr-web:${ENV}" \
  find /app/.next -name "*.js" -type f -exec grep -l "localhost:8001" {} \; 2>/dev/null | wc -l)

if [ "$LOCALHOST_COUNT" -gt 0 ]; then
  echo -e "${RED}❌ ERROR: Image still contains localhost URLs ($LOCALHOST_COUNT files)${NC}"
  echo -e "${RED}Build args may not have been applied correctly${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Image verified - no localhost URLs found${NC}"

# Restart containers
echo -e "${YELLOW}Restarting containers with new images...${NC}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

if [ "$ENV" = "production" ]; then
  docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.production.yml \
    --env-file ".env.$ENV" up -d --force-recreate --remove-orphans
else
  docker compose -f docker-compose.yml -f docker-compose.prod.yml \
    --env-file ".env.$ENV" up -d --force-recreate --remove-orphans
fi

echo -e "${GREEN}✓ Containers restarted${NC}"

# Wait for containers to be healthy
echo -e "${YELLOW}Waiting for containers to be healthy...${NC}"
sleep 10

# Show container status
echo -e "${YELLOW}Container status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep epr

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Force pull completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Hard refresh browser (Ctrl+Shift+R)"
echo -e "2. Check browser console for API URLs"
echo -e "3. Test login flow"
