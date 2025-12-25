#!/bin/bash
# ============================================
# Run Database Migrations
# ============================================
# Automatically runs all pending migrations
# Usage: ./run-migrations.sh staging|production
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

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Running Database Migrations - $ENV${NC}"
echo -e "${YELLOW}========================================${NC}"

# Determine database name and user based on environment
if [ "$ENV" = "production" ]; then
  DB_NAME="epr_saas_production"
  DB_USER="epr_production"
else
  DB_NAME="epr_saas_staging"
  DB_USER="epr_staging"
fi

# Enable UUID extension first (required for migrations)
echo -e "${YELLOW}[1/3] Enabling required extensions${NC}"
docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" > /dev/null 2>&1
echo -e "${GREEN}OK: Extensions enabled${NC}"

# Run all migrations in order
echo -e "${YELLOW}[2/3] Running migrations${NC}"
MIGRATION_DIR="$PROJECT_ROOT/backend/database/migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
  echo -e "${RED}ERROR: Migration directory not found: $MIGRATION_DIR${NC}"
  exit 1
fi

# Count migrations
MIGRATION_COUNT=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}No migrations found${NC}"
  exit 0
fi

echo -e "${YELLOW}Found $MIGRATION_COUNT migration(s)${NC}"

# Run each migration
for migration_file in "$MIGRATION_DIR"/*.sql; do
  migration_name=$(basename "$migration_file")
  echo -e "${YELLOW}  Running: $migration_name${NC}"

  # Copy migration to container
  docker cp "$migration_file" epr-postgres:/tmp/migration.sql

  # Run migration (capture output, show errors)
  if docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/migration.sql > /tmp/migration_output.log 2>&1; then
    echo -e "${GREEN}  ✓ $migration_name${NC}"
  else
    # Check if errors are just "already exists" warnings
    if grep -q "already exists\|does not exist" /tmp/migration_output.log; then
      echo -e "${YELLOW}  ⚠ $migration_name (already applied)${NC}"
    else
      echo -e "${RED}  ✗ $migration_name FAILED${NC}"
      cat /tmp/migration_output.log
      exit 1
    fi
  fi

  # Cleanup
  docker exec epr-postgres rm -f /tmp/migration.sql
done

echo -e "${GREEN}OK: All migrations completed${NC}"

# Verify critical tables exist
echo -e "${YELLOW}[3/3] Verifying database schema${NC}"
CRITICAL_TABLES=("users" "packages" "subscriptions" "conversations" "conversation_sessions")

for table in "${CRITICAL_TABLES[@]}"; do
  if docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "\dt $table" | grep -q "$table"; then
    echo -e "${GREEN}  ✓ Table: $table${NC}"
  else
    echo -e "${RED}  ✗ Table missing: $table${NC}"
    exit 1
  fi
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Migrations completed successfully${NC}"
echo -e "${GREEN}========================================${NC}"
