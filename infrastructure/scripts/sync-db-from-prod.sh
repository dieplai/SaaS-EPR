#!/bin/bash
# ============================================
# EPR SaaS - Sync Staging DB from Production
# ============================================
# Copy production database to staging
# Run before staging deployment
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMP_BACKUP="/tmp/prod_to_staging_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database Sync - Production to Staging${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if containers are running
if ! docker ps | grep -q epr-postgres; then
  echo -e "${RED}Error: PostgreSQL container not running${NC}"
  exit 1
fi

# Step 1: Dump production database
echo -e "${YELLOW}[1/4] Dumping production database${NC}"
docker exec epr-postgres pg_dump \
  -U epr_prod \
  -d epr_saas_production \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl > "$TEMP_BACKUP"

if [ $? -ne 0 ]; then
  echo -e "${RED}ERROR: Failed to dump production database${NC}"
  exit 1
fi
echo -e "${GREEN}OK: Production database dumped${NC}"

# Step 2: Drop staging database connections
echo -e "${YELLOW}[2/4] Terminating staging database connections${NC}"
docker exec epr-postgres psql -U postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'epr_saas_staging' AND pid <> pg_backend_pid();
" 2>/dev/null || true
echo -e "${GREEN}OK: Connections terminated${NC}"

# Step 3: Restore to staging database
echo -e "${YELLOW}[3/4] Restoring database to staging${NC}"
docker exec -i epr-postgres psql -U epr_staging -d epr_saas_staging < "$TEMP_BACKUP"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}OK: Database restored to staging${NC}"
  rm -f "$TEMP_BACKUP"
else
  echo -e "${RED}ERROR: Failed to restore database${NC}"
  rm -f "$TEMP_BACKUP"
  exit 1
fi

# Step 4: Verify staging database
echo -e "${YELLOW}[4/4] Verifying staging database${NC}"
TABLE_COUNT=$(docker exec epr-postgres psql -U epr_staging -d epr_saas_staging -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

if [ "$TABLE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}OK: Staging database verified - $TABLE_COUNT tables${NC}"
else
  echo -e "${RED}ERROR: Staging database verification failed${NC}"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database sync completed successfully${NC}"
echo -e "${GREEN}========================================${NC}"
