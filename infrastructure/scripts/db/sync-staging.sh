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
  echo -e "${RED}ERROR: PostgreSQL container not running${NC}"
  exit 1
fi

# Check if production database exists and has data
echo -e "${YELLOW}Checking production database status${NC}"

# Check if database exists
DB_EXISTS=$(docker exec epr-postgres psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='epr_saas_production';" 2>/dev/null | xargs || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
  echo -e "${YELLOW}INFO: Production database does not exist yet${NC}"
  echo -e "${YELLOW}INFO: Skipping database sync (first deployment)${NC}"
  echo -e "${GREEN}========================================${NC}"
  exit 0
fi

# Check if production database has tables
PROD_TABLE_COUNT=$(docker exec epr-postgres psql -U epr_production -d epr_saas_production -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")

if [ "$PROD_TABLE_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}INFO: Production database is empty (no tables)${NC}"
  echo -e "${YELLOW}INFO: Skipping database sync${NC}"
  echo -e "${GREEN}========================================${NC}"
  exit 0
fi

echo -e "${GREEN}OK: Production database found with $PROD_TABLE_COUNT tables${NC}"

# Step 1: Dump production database (EXCLUDE extension ownership)
echo -e "${YELLOW}[1/4] Dumping production database${NC}"
# Use --no-owner and filter out extension DROP/CREATE commands
# Extensions are already installed in staging via db/setup.sh
docker exec epr-postgres pg_dump \
  -U epr_production \
  -d epr_saas_production \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  | grep -v "DROP EXTENSION" \
  | grep -v "CREATE EXTENSION" \
  | grep -v "COMMENT ON EXTENSION" \
  > "$TEMP_BACKUP"

if [ $? -ne 0 ]; then
  echo -e "${RED}ERROR: Failed to dump production database${NC}"
  exit 1
fi
echo -e "${GREEN}OK: Production database dumped (extensions excluded)${NC}"

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
