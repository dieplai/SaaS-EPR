#!/bin/bash
# ============================================
# Fix Dirty Migration State
# ============================================
# Fixes dirty migration state by forcing version
# Then re-runs migrations
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ENV=$1

if [ -z "$ENV" ]; then
  echo -e "${RED}Error: Environment required${NC}"
  echo "Usage: $0 staging|production"
  exit 1
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Fixing Dirty Migration State - $ENV${NC}"
echo -e "${YELLOW}========================================${NC}"

# Determine database
if [ "$ENV" = "production" ]; then
  DB_NAME="epr_saas_production"
  DB_USER="epr_production"
else
  DB_NAME="epr_saas_staging"
  DB_USER="epr_staging"
fi

# Check current dirty state
echo -e "${YELLOW}[1/3] Checking current migration state${NC}"
DIRTY_STATE=$(docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
  "SELECT dirty FROM schema_migrations ORDER BY version DESC LIMIT 1;" 2>/dev/null | xargs)

echo "Current dirty state: $DIRTY_STATE"

if [ "$DIRTY_STATE" = "t" ] || [ "$DIRTY_STATE" = "true" ]; then
  echo -e "${RED}Migration is dirty, fixing...${NC}"

  # Get current version
  CURRENT_VERSION=$(docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;" 2>/dev/null | xargs)

  echo "Current version: $CURRENT_VERSION"

  # Force clean the version
  echo -e "${YELLOW}[2/3] Forcing migration version to $CURRENT_VERSION (clean state)${NC}"
  PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
  "$PROJECT_ROOT/infrastructure/scripts/db/migrate.sh" "$ENV" force "$CURRENT_VERSION"

  echo -e "${GREEN}OK: Migration state cleaned${NC}"
else
  echo -e "${GREEN}OK: Migration is not dirty${NC}"
fi

# Run pending migrations
echo -e "${YELLOW}[3/3] Running pending migrations${NC}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
"$PROJECT_ROOT/infrastructure/scripts/db/migrate.sh" "$ENV" up

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Migration fix completed successfully${NC}"
echo -e "${GREEN}========================================${NC}"
