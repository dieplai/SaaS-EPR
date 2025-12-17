#!/bin/bash
# ============================================
# EPR SaaS - Simple Deploy Script
# ============================================
# Usage: ./deploy.sh staging|production
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check argument
if [ -z "$1" ]; then
  echo -e "${RED}Error: Environment required${NC}"
  echo "Usage: $0 staging|production"
  exit 1
fi

ENV=$1
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMPLATE_FILE="$PROJECT_ROOT/infrastructure/.env.$ENV.template"
ENV_FILE="$PROJECT_ROOT/.env.$ENV"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}EPR SaaS - Deploy to $ENV${NC}"
echo -e "${GREEN}========================================${NC}"

# Validate environment
if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
  echo -e "${RED}Error: Invalid environment. Use 'staging' or 'production'${NC}"
  exit 1
fi

# Check template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo -e "${RED}Error: Template file not found: $TEMPLATE_FILE${NC}"
  exit 1
fi

# Validate required secrets are set
REQUIRED_SECRETS=(
  "POSTGRES_PASSWORD"
  "REDIS_PASSWORD"
  "JWT_SECRET"
  "OPENAI_API_KEY"
  "QDRANT_API_KEY"
  "QDRANT_CLOUD_URL"
)

echo -e "${YELLOW}Validating secrets...${NC}"
for secret in "${REQUIRED_SECRETS[@]}"; do
  if [ -z "${!secret}" ]; then
    echo -e "${RED}Error: Required secret $secret is not set${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✓ All required secrets are set${NC}"

# Generate .env from template
echo -e "${YELLOW}Generating .env.$ENV from template...${NC}"
envsubst < "$TEMPLATE_FILE" > "$ENV_FILE"
echo -e "${GREEN}✓ Generated: $ENV_FILE${NC}"

# Set DEPLOY_ENV for docker-compose
export DEPLOY_ENV="$ENV"

# Pull latest images
echo -e "${YELLOW}Pulling latest Docker images...${NC}"
cd "$PROJECT_ROOT"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file ".env.$ENV" pull

# Deploy
echo -e "${YELLOW}Deploying services...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file ".env.$ENV" up -d --remove-orphans

# Wait for services
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Health check
echo -e "${YELLOW}Checking service health...${NC}"
if curl -sf http://localhost:8001/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Backend is healthy${NC}"
else
  echo -e "${RED}✗ Backend health check failed${NC}"
fi

if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Chatbot API is healthy${NC}"
else
  echo -e "${RED}✗ Chatbot API health check failed${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment completed!${NC}"
echo -e "${GREEN}========================================${NC}"
