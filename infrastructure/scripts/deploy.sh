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

# Pre-flight checks
echo -e "${YELLOW}[1/7] Running pre-flight checks${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/preflight-check.sh" "$ENV"; then
  echo -e "${GREEN}OK: Pre-flight checks passed${NC}"
else
  echo -e "${RED}ERROR: Pre-flight checks failed${NC}"
  exit 1
fi

echo -e "${YELLOW}[2/7] Validating environment secrets${NC}"
for secret in "${REQUIRED_SECRETS[@]}"; do
  if [ -z "${!secret}" ]; then
    echo -e "${RED}ERROR: Required secret $secret is not set${NC}"
    exit 1
  fi
done
echo -e "${GREEN}OK: All required secrets validated${NC}"

# Generate .env from template
echo -e "${YELLOW}[3/7] Generating environment configuration${NC}"
envsubst < "$TEMPLATE_FILE" > "$ENV_FILE"
echo -e "${GREEN}OK: Environment file generated at $ENV_FILE${NC}"

# Set DEPLOY_ENV for docker-compose
export DEPLOY_ENV="$ENV"

# Pull latest images
echo -e "${YELLOW}[4/7] Pulling Docker images from registry${NC}"
cd "$PROJECT_ROOT"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file ".env.$ENV" pull
echo -e "${GREEN}OK: Images pulled successfully${NC}"

# Deploy
echo -e "${YELLOW}[5/7] Deploying services${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file ".env.$ENV" up -d --remove-orphans
echo -e "${GREEN}OK: Services deployed${NC}"

# Health checks
echo -e "${YELLOW}[6/7] Running health checks${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/health-check.sh"; then
  echo -e "${GREEN}OK: Health checks passed${NC}"
else
  echo -e "${RED}ERROR: Health checks failed - rolling back${NC}"
  "$PROJECT_ROOT/infrastructure/scripts/rollback.sh" "$ENV"
  exit 1
fi

# Smoke tests
echo -e "${YELLOW}[7/7] Running smoke tests${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/smoke-test.sh"; then
  echo -e "${GREEN}OK: Smoke tests passed${NC}"
else
  echo -e "${RED}ERROR: Smoke tests failed - rolling back${NC}"
  "$PROJECT_ROOT/infrastructure/scripts/rollback.sh" "$ENV"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully${NC}"
echo -e "${GREEN}All checks passed${NC}"
echo -e "${GREEN}========================================${NC}"
