#!/bin/bash
# ============================================
# golang-migrate wrapper with error handling
# ============================================
# Executes database migrations using golang-migrate
# Safe to run multiple times (idempotent)
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV=$1        # staging|production
ACTION=${2:-up}  # up|down|version|force

if [ -z "$ENV" ]; then
  echo -e "${RED}Error: Environment required${NC}"
  echo "Usage: $0 <staging|production> [up|down|version|force <N>]"
  echo ""
  echo "Examples:"
  echo "  $0 staging up         # Run all pending migrations"
  echo "  $0 production down 1  # Rollback last migration"
  echo "  $0 staging version    # Show current migration version"
  echo "  $0 staging force 1    # Force set version to 1"
  exit 1
fi

# Determine database configuration
if [ "$ENV" = "production" ]; then
  DB_NAME="epr_saas_production"
  DB_USER="epr_production"
  BACKEND_CONTAINER="epr-backend-prod"
else
  DB_NAME="epr_saas_staging"
  DB_USER="epr_staging"
  BACKEND_CONTAINER="epr-backend"
fi

# Construct database URL
DATABASE_URL="postgresql://${DB_USER}:${POSTGRES_PASSWORD}@epr-postgres:5432/${DB_NAME}?sslmode=disable"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}golang-migrate: $ACTION on $ENV${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if container is running
if ! docker ps | grep -q "$BACKEND_CONTAINER"; then
  echo -e "${RED}Error: Container $BACKEND_CONTAINER is not running${NC}"
  echo "Please start the backend service first"
  exit 1
fi

# Execute migration
echo -e "${YELLOW}[MIGRATE] Running: $ACTION${NC}"

if [ "$ACTION" = "force" ]; then
  # Force requires version number
  VERSION=${3:-1}
  docker exec "$BACKEND_CONTAINER" migrate \
    -path /migrations \
    -database "$DATABASE_URL" \
    force "$VERSION"
  echo -e "${GREEN}[SUCCESS] Forced migration version to: $VERSION${NC}"
else
  # Run migration command
  docker exec "$BACKEND_CONTAINER" migrate \
    -path /migrations \
    -database "$DATABASE_URL" \
    "$ACTION" ${3:-}
fi

# Verify status
echo ""
echo -e "${YELLOW}[STATUS] Checking migration version...${NC}"
CURRENT_VERSION=$(docker exec "$BACKEND_CONTAINER" migrate \
  -path /migrations \
  -database "$DATABASE_URL" \
  version 2>&1 | tail -1)

if echo "$CURRENT_VERSION" | grep -q "dirty"; then
  echo -e "${RED}[WARNING] Migration is in dirty state!${NC}"
  echo "Version: $CURRENT_VERSION"
  echo ""
  echo "To fix dirty state, run:"
  echo "  $0 $ENV force <version>"
  exit 1
else
  VERSION_NUM=$(echo "$CURRENT_VERSION" | grep -oP '^\d+' || echo "0")
  echo -e "${GREEN}[SUCCESS] Current migration version: $VERSION_NUM${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Migration completed successfully${NC}"
echo -e "${BLUE}========================================${NC}"
