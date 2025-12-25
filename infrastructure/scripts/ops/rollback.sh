#!/bin/bash
# ============================================
# EPR SaaS - Rollback Script
# ============================================
# Rollback to previous Docker image version
# Usage: ./rollback.sh staging|production
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check argument
if [ -z "$1" ]; then
  echo -e "${RED}ERROR: Environment required${NC}"
  echo "Usage: $0 staging|production"
  exit 1
fi

ENV=$1
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Rollback - Environment: $ENV${NC}"
echo -e "${GREEN}========================================${NC}"

# Validate environment
if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
  echo -e "${RED}ERROR: Invalid environment${NC}"
  exit 1
fi

# Get previous image tags from docker-compose
echo -e "${YELLOW}[1/3] Finding previous image versions${NC}"

# Get current running images
CURRENT_BACKEND=$(docker inspect epr-backend --format='{{.Config.Image}}' 2>/dev/null || echo "none")
CURRENT_CHATBOT=$(docker inspect epr-ai-chatbot-api --format='{{.Config.Image}}' 2>/dev/null || echo "none")
CURRENT_WEB=$(docker inspect epr-web-frontend --format='{{.Config.Image}}' 2>/dev/null || echo "none")

echo "Current versions:"
echo "  Backend:  $CURRENT_BACKEND"
echo "  Chatbot:  $CURRENT_CHATBOT"
echo "  Web:      $CURRENT_WEB"

# Look for previous tags in GHCR
echo -e "${YELLOW}[2/3] Checking available rollback versions${NC}"

# For simplicity, we use 'previous' tag or fall back to latest commit tag
# In production, you'd store version history in a file
ROLLBACK_TAG="previous"

if ! docker manifest inspect ghcr.io/dieplai/saas-epr-backend:$ENV-$ROLLBACK_TAG > /dev/null 2>&1; then
  echo -e "${RED}ERROR: No rollback version found${NC}"
  echo "Tip: Ensure previous deployment tagged images with 'previous' tag"
  exit 1
fi

echo -e "${GREEN}OK: Rollback version found${NC}"

# Confirm rollback
echo -e "${YELLOW}[3/3] Rolling back to previous version${NC}"
read -p "Continue with rollback? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${YELLOW}Rollback cancelled${NC}"
  exit 0
fi

cd "$PROJECT_ROOT"

# Tag current as 'previous' for next rollback
export DEPLOY_ENV="$ENV-$ROLLBACK_TAG"

# Pull previous images
echo "Pulling previous images..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file ".env.$ENV" pull

# Deploy previous version
echo "Deploying previous version..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file ".env.$ENV" up -d --remove-orphans

# Wait and verify
sleep 10

echo -e "${YELLOW}Verifying rollback...${NC}"

if curl -sf http://localhost:8001/health > /dev/null 2>&1; then
  echo -e "${GREEN}OK: Backend service is healthy${NC}"
else
  echo -e "${RED}WARNING: Backend health check failed${NC}"
fi

if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
  echo -e "${GREEN}OK: Chatbot API service is healthy${NC}"
else
  echo -e "${RED}WARNING: Chatbot API health check failed${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Rollback completed${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Run 'docker ps' to verify containers"
echo "Check logs: docker logs epr-backend"
