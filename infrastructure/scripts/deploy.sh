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
echo -e "${GREEN}EPR SaaS Deployment - Environment: $ENV${NC}"
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

echo -e "${YELLOW}[1/5] Validating environment secrets${NC}"
for secret in "${REQUIRED_SECRETS[@]}"; do
  if [ -z "${!secret}" ]; then
    echo -e "${RED}ERROR: Required secret $secret is not set${NC}"
    exit 1
  fi
done
echo -e "${GREEN}OK: All required secrets validated${NC}"

# Generate .env from template
echo -e "${YELLOW}[2/5] Generating environment configuration${NC}"
envsubst < "$TEMPLATE_FILE" > "$ENV_FILE"
echo -e "${GREEN}OK: Environment file generated at $ENV_FILE${NC}"

# Set DEPLOY_ENV for docker-compose
export DEPLOY_ENV="$ENV"

# Pull latest images
echo -e "${YELLOW}[3/5] Pulling Docker images from registry${NC}"
cd "$PROJECT_ROOT"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file ".env.$ENV" pull
echo -e "${GREEN}OK: Images pulled successfully${NC}"

# Deploy
echo -e "${YELLOW}[4/5] Deploying services${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file ".env.$ENV" up -d --remove-orphans
echo -e "${GREEN}OK: Services deployed${NC}"

# Wait for services
echo -e "${YELLOW}[5/5] Running health checks${NC}"
sleep 10

# Health check
BACKEND_HEALTHY=false
CHATBOT_HEALTHY=false

if curl -sf http://localhost:8001/health > /dev/null 2>&1; then
  echo -e "${GREEN}OK: Backend service is healthy${NC}"
  BACKEND_HEALTHY=true
else
  echo -e "${RED}WARNING: Backend health check failed${NC}"
fi

if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
  echo -e "${GREEN}OK: Chatbot API service is healthy${NC}"
  CHATBOT_HEALTHY=true
else
  echo -e "${RED}WARNING: Chatbot API health check failed${NC}"
fi

echo -e "${GREEN}========================================${NC}"
if [ "$BACKEND_HEALTHY" = true ] && [ "$CHATBOT_HEALTHY" = true ]; then
  echo -e "${GREEN}Deployment completed successfully${NC}"
else
  echo -e "${YELLOW}Deployment completed with warnings - check service logs${NC}"
fi
echo -e "${GREEN}========================================${NC}"
