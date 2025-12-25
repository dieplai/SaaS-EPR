#!/bin/bash
# ============================================
# Seed Database with Initial Data
# ============================================
# WARNING: Only run this MANUALLY when needed
# DO NOT run automatically in CI/CD!
# ============================================
# Usage: ./seed-database.sh staging|production
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
echo -e "${YELLOW}Seeding Database - $ENV${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "${RED}WARNING: This will INSERT data into database!${NC}"
echo -e "${RED}Only run this on fresh database or for testing${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo -e "${YELLOW}Aborted${NC}"
  exit 0
fi

# Determine database name and user based on environment
if [ "$ENV" = "production" ]; then
  DB_NAME="epr_saas_production"
  DB_USER="epr_production"
else
  DB_NAME="epr_saas_staging"
  DB_USER="epr_staging"
fi

# Seed scripts directory
SEED_DIR="$PROJECT_ROOT/infrastructure/docker/init-scripts"

# List of seed files (in order)
SEED_FILES=(
  "03-seed-packages.sql"
  # Add more seed files here as needed
)

echo -e "${YELLOW}Running seed scripts${NC}"

for seed_file in "${SEED_FILES[@]}"; do
  seed_path="$SEED_DIR/$seed_file"

  if [ ! -f "$seed_path" ]; then
    echo -e "${YELLOW}  ⚠ Skipping: $seed_file (not found)${NC}"
    continue
  fi

  echo -e "${YELLOW}  Seeding: $seed_file${NC}"

  # Copy seed file to container
  docker cp "$seed_path" epr-postgres:/tmp/seed.sql

  # Run seed script
  if docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/seed.sql > /tmp/seed_output.log 2>&1; then
    echo -e "${GREEN}  ✓ $seed_file${NC}"
  else
    # Check if errors are just "already exists" or "duplicate key"
    if grep -q -E "duplicate key|already exists|ON CONFLICT" /tmp/seed_output.log; then
      echo -e "${YELLOW}  ⚠ $seed_file (data already exists, skipped)${NC}"
    else
      echo -e "${RED}  ✗ $seed_file FAILED${NC}"
      cat /tmp/seed_output.log
      exit 1
    fi
  fi

  # Cleanup
  docker exec epr-postgres rm -f /tmp/seed.sql
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database seeded successfully${NC}"
echo -e "${GREEN}========================================${NC}"

# Show summary
echo -e "${YELLOW}Summary:${NC}"
docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM packages) as packages_count,
  (SELECT COUNT(*) FROM subscriptions) as subscriptions_count;"
