#!/bin/bash
# ============================================
# EPR SaaS - Rebuild PostgreSQL
# ============================================
# Rebuild PostgreSQL volume from scratch
# Use when volume is corrupted
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Rebuild PostgreSQL Volume${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${RED}WARNING: This will DELETE all database data${NC}"
echo -e "${RED}Make sure you have backups!${NC}"
echo ""

read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${YELLOW}Rebuild cancelled${NC}"
  exit 0
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Stop PostgreSQL container
echo -e "${YELLOW}[1/4] Stopping PostgreSQL container${NC}"
docker stop epr-postgres || true
docker rm epr-postgres || true
echo -e "${GREEN}OK: Container stopped${NC}"

# Remove corrupted volume
echo -e "${YELLOW}[2/4] Removing corrupted volume${NC}"
docker volume rm epr-saas-platform_postgres_data || true
echo -e "${GREEN}OK: Volume removed${NC}"

# Recreate PostgreSQL with fresh volume
echo -e "${YELLOW}[3/4] Recreating PostgreSQL container${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
echo -e "${GREEN}OK: PostgreSQL recreated${NC}"

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}[4/4] Waiting for PostgreSQL to be ready${NC}"
sleep 10

for i in {1..30}; do
  if docker exec epr-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}OK: PostgreSQL is ready${NC}"
    break
  fi
  echo "  Waiting... ($i/30)"
  sleep 2
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PostgreSQL rebuild completed${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Run: ./infrastructure/scripts/setup-database.sh"
echo "  2. Run: docker restart epr-backend"
echo "  3. Or redeploy: ./infrastructure/scripts/deploy.sh staging"
