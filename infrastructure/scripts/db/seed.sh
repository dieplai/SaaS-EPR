#!/bin/bash
# ============================================
# Idempotent Database Seeding
# ============================================
# Seeds database with initial data (packages + admin user)
# Safe to run multiple times (uses ON CONFLICT DO UPDATE)
# Merged from: seed-database.sh, reseed-packages.sh, seed-production-initial-data.sh
# ============================================
# Usage: ./seed.sh <staging|production>
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV=$1

if [ -z "$ENV" ]; then
  echo -e "${RED}Error: Environment required${NC}"
  echo "Usage: $0 <staging|production>"
  echo ""
  echo "Examples:"
  echo "  $0 staging      # Seed staging database"
  echo "  $0 production   # Seed production database"
  exit 1
fi

# Determine database configuration
if [ "$ENV" = "production" ]; then
  DB_NAME="epr_saas_production"
  DB_USER="epr_production"
else
  DB_NAME="epr_saas_staging"
  DB_USER="epr_staging"
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SEED_DIR="$PROJECT_ROOT/backend/database/seeds"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Database Seeding - $ENV${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if seed directory exists
if [ ! -d "$SEED_DIR" ]; then
  echo -e "${RED}Error: Seed directory not found: $SEED_DIR${NC}"
  exit 1
fi

# Check if database container is running
if ! docker ps | grep -q "epr-postgres"; then
  echo -e "${RED}Error: PostgreSQL container (epr-postgres) is not running${NC}"
  echo "Please start the database service first"
  exit 1
fi

# Seed all SQL files in order
SEED_COUNT=0
ERROR_COUNT=0

echo -e "${YELLOW}Running seed scripts...${NC}"
echo ""

for seed_file in "$SEED_DIR"/*.sql; do
  [ -f "$seed_file" ] || continue

  seed_name=$(basename "$seed_file")
  echo -e "${YELLOW}[SEED] $seed_name${NC}"

  # Copy seed file to container
  if ! docker cp "$seed_file" epr-postgres:/tmp/seed.sql 2>/dev/null; then
    echo -e "${RED}  ✗ Failed to copy seed file${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
    continue
  fi

  # Execute seed script
  if docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/seed.sql > /tmp/seed_output.log 2>&1; then
    echo -e "${GREEN}  ✓ Completed${NC}"
    SEED_COUNT=$((SEED_COUNT + 1))
  else
    # Check if it's a non-critical error (duplicate keys, etc.)
    if grep -q -E "duplicate key|already exists|ON CONFLICT" /tmp/seed_output.log; then
      echo -e "${YELLOW}  ⚠ Already seeded (idempotent)${NC}"
      SEED_COUNT=$((SEED_COUNT + 1))
    else
      echo -e "${RED}  ✗ Failed${NC}"
      cat /tmp/seed_output.log
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
  fi

  # Cleanup temporary file
  docker exec epr-postgres rm -f /tmp/seed.sql 2>/dev/null || true
  echo ""
done

# Cleanup output log
rm -f /tmp/seed_output.log

# Summary
echo -e "${BLUE}========================================${NC}"

if [ "$ERROR_COUNT" -gt 0 ]; then
  echo -e "${RED}✗ Seeding completed with errors${NC}"
  echo -e "${YELLOW}Seeded: $SEED_COUNT files${NC}"
  echo -e "${RED}Errors: $ERROR_COUNT files${NC}"
else
  echo -e "${GREEN}✓ Seeding completed successfully${NC}"
  echo -e "${GREEN}Seeded: $SEED_COUNT files${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo ""

# Verify data
echo -e "${YELLOW}Verification:${NC}"
echo ""

# Check packages
PACKAGE_COUNT=$(docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" \
  -t -c "SELECT COUNT(*) FROM packages WHERE deleted_at IS NULL;" 2>/dev/null | xargs || echo "0")
echo -e "  Packages: ${GREEN}$PACKAGE_COUNT${NC}"

if [ "$PACKAGE_COUNT" -ne 3 ]; then
  echo -e "  ${YELLOW}⚠ Expected 3 packages (Starter, Professional, Enterprise)${NC}"
fi

# Check admin users
ADMIN_COUNT=$(docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" \
  -t -c "SELECT COUNT(*) FROM users WHERE role = 'admin';" 2>/dev/null | xargs || echo "0")
echo -e "  Admin users: ${GREEN}$ADMIN_COUNT${NC}"

if [ "$ADMIN_COUNT" -eq 0 ]; then
  echo -e "  ${YELLOW}⚠ No admin users found${NC}"
fi

# Show package details
echo ""
echo -e "${YELLOW}Package Details:${NC}"
docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
  "SELECT name, price, token_limit, is_active FROM packages WHERE deleted_at IS NULL ORDER BY price;" 2>/dev/null || true

echo ""

# Exit with error if there were critical errors
if [ "$ERROR_COUNT" -gt 0 ]; then
  exit 1
fi

exit 0
