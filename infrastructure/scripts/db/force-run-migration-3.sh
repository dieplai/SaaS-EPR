#!/bin/bash
# ============================================
# Force run migration 3 on production
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Force Running Migration 3 on Production${NC}"
echo -e "${YELLOW}========================================${NC}"

DB_NAME="epr_saas_production"
DB_USER="epr_production"

# Check if payments table exists
echo -e "${YELLOW}[1/5] Checking if payments table exists${NC}"
TABLE_EXISTS=$(docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
  "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments');" | xargs)

echo "Table exists: $TABLE_EXISTS"

if [ "$TABLE_EXISTS" = "t" ] || [ "$TABLE_EXISTS" = "true" ]; then
  echo -e "${YELLOW}Payments table exists, dropping it to recreate with correct schema...${NC}"
  docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "DROP TABLE IF EXISTS payments CASCADE;"
  echo -e "${GREEN}OK: Old payments table dropped${NC}"
fi

# Force migration to version 2
echo -e "${YELLOW}[2/5] Forcing migration version to 2${NC}"
docker exec epr-backend-prod migrate \
  -path /migrations \
  -database "postgresql://${DB_USER}:${POSTGRES_PASSWORD}@epr-postgres:5432/${DB_NAME}?sslmode=disable" \
  force 2

echo -e "${GREEN}OK: Forced to version 2${NC}"

# Run migration 3
echo -e "${YELLOW}[3/5] Running migration 3 (create payments table)${NC}"
docker exec epr-backend-prod migrate \
  -path /migrations \
  -database "postgresql://${DB_USER}:${POSTGRES_PASSWORD}@epr-postgres:5432/${DB_NAME}?sslmode=disable" \
  up 1

echo -e "${GREEN}OK: Migration 3 applied${NC}"

# Verify payments table
echo -e "${YELLOW}[4/5] Verifying payments table structure${NC}"
docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "\d payments"

# Check migration version
echo -e "${YELLOW}[5/5] Checking final migration version${NC}"
FINAL_VERSION=$(docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
  "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;" | xargs)

echo -e "${GREEN}Final migration version: $FINAL_VERSION${NC}"

if [ "$FINAL_VERSION" = "3" ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}SUCCESS: Migration 3 applied successfully${NC}"
  echo -e "${GREEN}========================================${NC}"
else
  echo -e "${RED}ERROR: Migration version is not 3${NC}"
  exit 1
fi
