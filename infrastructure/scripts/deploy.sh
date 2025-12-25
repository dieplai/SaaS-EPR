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
echo -e "${YELLOW}[1/11] Running pre-flight checks${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/checks/preflight.sh" "$ENV"; then
  echo -e "${GREEN}OK: Pre-flight checks passed${NC}"
else
  echo -e "${RED}ERROR: Pre-flight checks failed${NC}"
  exit 1
fi

echo -e "${YELLOW}[2/11] Validating environment secrets${NC}"
for secret in "${REQUIRED_SECRETS[@]}"; do
  if [ -z "${!secret}" ]; then
    echo -e "${RED}ERROR: Required secret $secret is not set${NC}"
    exit 1
  fi
done
echo -e "${GREEN}OK: All required secrets validated${NC}"

# Generate .env from template
echo -e "${YELLOW}[3/11] Generating environment configuration${NC}"
envsubst < "$TEMPLATE_FILE" > "$ENV_FILE"
echo -e "${GREEN}OK: Environment file generated at $ENV_FILE${NC}"

# Set DEPLOY_ENV for docker-compose
export DEPLOY_ENV="$ENV"

# Pull latest images
echo -e "${YELLOW}[4/11] Pulling Docker images from registry${NC}"
cd "$PROJECT_ROOT"

# If GIT_SHA is provided (from CI/CD), pull specific SHA-tagged images
# This ensures we get the EXACT image built in CI, not cached version
if [ -n "$GIT_SHA" ]; then
  SHORT_SHA="${GIT_SHA:0:7}"
  echo -e "${YELLOW}Pulling images with SHA tag: $SHORT_SHA${NC}"

  # Try to pull SHA-tagged images with fallback
  PULL_FAILED=0

  if ! docker pull "ghcr.io/dieplai/saas-epr-backend:${ENV}-${GIT_SHA}"; then
    echo -e "${YELLOW}WARNING: Failed to pull SHA-tagged backend image${NC}"
    PULL_FAILED=1
  else
    docker tag "ghcr.io/dieplai/saas-epr-backend:${ENV}-${GIT_SHA}" "ghcr.io/dieplai/saas-epr-backend:${ENV}"
  fi

  if ! docker pull "ghcr.io/dieplai/saas-epr-chatbot:${ENV}-${GIT_SHA}"; then
    echo -e "${YELLOW}WARNING: Failed to pull SHA-tagged chatbot image${NC}"
    PULL_FAILED=1
  else
    docker tag "ghcr.io/dieplai/saas-epr-chatbot:${ENV}-${GIT_SHA}" "ghcr.io/dieplai/saas-epr-chatbot:${ENV}"
  fi

  if ! docker pull "ghcr.io/dieplai/saas-epr-web:${ENV}-${GIT_SHA}"; then
    echo -e "${YELLOW}WARNING: Failed to pull SHA-tagged web image${NC}"
    PULL_FAILED=1
  else
    docker tag "ghcr.io/dieplai/saas-epr-web:${ENV}-${GIT_SHA}" "ghcr.io/dieplai/saas-epr-web:${ENV}"
  fi

  # Fallback to mutable tags if SHA pull failed
  if [ "$PULL_FAILED" = "1" ]; then
    echo -e "${YELLOW}Falling back to mutable tags (docker-compose pull)${NC}"
    docker compose -f docker-compose.$ENV.yml --env-file ".env.$ENV" pull
  fi
else
  # Fallback: pull mutable tags (less reliable due to caching)
  echo -e "${YELLOW}No GIT_SHA provided, pulling mutable tags (may use cache)${NC}"
  docker compose -f docker-compose.$ENV.yml --env-file ".env.$ENV" pull
fi

echo -e "${GREEN}OK: Images pulled successfully${NC}"

# Ensure infrastructure (postgres/redis) exists
echo -e "${YELLOW}[5/11] Ensuring infrastructure services${NC}"
if ! docker ps --format '{{.Names}}' | grep -q "^epr-postgres$"; then
  echo -e "${YELLOW}Infrastructure not found, deploying postgres and redis...${NC}"
  docker compose -f docker-compose.infrastructure.yml up -d
  echo -e "${GREEN}OK: Infrastructure services deployed${NC}"
  sleep 5  # Wait for services to start
else
  echo -e "${GREEN}OK: Infrastructure services already running${NC}"
fi

# Database setup BEFORE deploying services (critical for password sync)
echo -e "${YELLOW}[6/11] Setting up databases${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/db/setup.sh"; then
  echo -e "${GREEN}OK: Database setup completed${NC}"
else
  echo -e "${RED}ERROR: Database setup failed${NC}"
  exit 1
fi

# Deploy services (backend will connect with updated password)
echo -e "${YELLOW}[7/11] Deploying application services${NC}"

# Cleanup old containers to prevent name conflicts
echo -e "${YELLOW}Cleaning up old containers (if any)${NC}"
if [ "$ENV" = "production" ]; then
  # Stop and remove production containers
  docker stop epr-backend-prod epr-ai-chatbot-prod epr-web-frontend-prod 2>/dev/null || true
  docker rm epr-backend-prod epr-ai-chatbot-prod epr-web-frontend-prod 2>/dev/null || true
  echo -e "${GREEN}OK: Old production containers cleaned up${NC}"

  # Production: Use consolidated production compose file
  docker compose -p epr-saas-production -f docker-compose.production.yml --env-file ".env.$ENV" up -d --force-recreate --remove-orphans
  BACKEND_CONTAINER="epr-backend-prod"
else
  # Stop and remove staging containers
  docker stop epr-backend epr-ai-chatbot-api epr-web-frontend 2>/dev/null || true
  docker rm epr-backend epr-ai-chatbot-api epr-web-frontend 2>/dev/null || true
  echo -e "${GREEN}OK: Old staging containers cleaned up${NC}"

  # Staging: Use consolidated staging compose file
  docker compose -p epr-saas-staging -f docker-compose.staging.yml --env-file ".env.$ENV" up -d --force-recreate --remove-orphans
  BACKEND_CONTAINER="epr-backend"
fi
echo -e "${GREEN}OK: Services deployed${NC}"

# Restart backend to reconnect with updated password
echo -e "${YELLOW}Restarting backend to apply database changes${NC}"
docker restart $BACKEND_CONTAINER
sleep 3
echo -e "${GREEN}OK: Backend restarted${NC}"

# Run database migrations using golang-migrate
echo -e "${YELLOW}[8/11] Running database migrations (golang-migrate)${NC}"

# Determine database name
if [ "$ENV" = "production" ]; then
  DB_NAME="epr_saas_production"
  DB_USER="epr_production"
else
  DB_NAME="epr_saas_staging"
  DB_USER="epr_staging"
fi

# Check if schema_migrations table exists and has version >= 1
# This happens when database was synced from production (already has full schema)
MIGRATION_VERSION=$(docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
  "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;" 2>/dev/null | xargs || echo "0")

if [ "$MIGRATION_VERSION" -ge 1 ]; then
  echo -e "${GREEN}OK: Database already migrated (version: $MIGRATION_VERSION, synced from production)${NC}"
  echo -e "${YELLOW}INFO: Skipping migrations (schema already up-to-date)${NC}"
else
  # Run migrations if version is 0 or table doesn't exist
  echo -e "${YELLOW}Running migrations from version $MIGRATION_VERSION${NC}"
  if "$PROJECT_ROOT/infrastructure/scripts/db/migrate.sh" "$ENV" up; then
    echo -e "${GREEN}OK: Database migrations completed${NC}"
  else
    echo -e "${RED}ERROR: Database migrations failed - rolling back${NC}"
    "$PROJECT_ROOT/infrastructure/scripts/ops/rollback.sh" "$ENV"
    exit 1
  fi
fi

# Seed initial data (idempotent)
echo -e "${YELLOW}[9/11] Seeding initial data${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/db/seed.sh" "$ENV"; then
  echo -e "${GREEN}OK: Database seeding completed${NC}"
else
  echo -e "${YELLOW}WARNING: Seeding failed (non-critical, continuing...)${NC}"
fi

# Health checks
echo -e "${YELLOW}[10/11] Running health checks${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/checks/health.sh" "$ENV"; then
  echo -e "${GREEN}OK: Health checks passed${NC}"
else
  echo -e "${RED}ERROR: Health checks failed - rolling back${NC}"
  "$PROJECT_ROOT/infrastructure/scripts/ops/rollback.sh" "$ENV"
  exit 1
fi

# Smoke tests
echo -e "${YELLOW}[11/11] Running smoke tests${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/checks/smoke.sh" "$ENV"; then
  echo -e "${GREEN}OK: Smoke tests passed${NC}"
else
  echo -e "${RED}ERROR: Smoke tests failed - rolling back${NC}"
  "$PROJECT_ROOT/infrastructure/scripts/ops/rollback.sh" "$ENV"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully${NC}"
echo -e "${GREEN}All checks passed${NC}"
echo -e "${GREEN}========================================${NC}"
