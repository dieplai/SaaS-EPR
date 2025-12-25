#!/bin/bash
# ============================================
# Reset Production Database - ONE-TIME USE
# ============================================
# WARNING: This will DROP and RECREATE production database
# Only use this for fixing schema issues on fresh deployment
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo -e "${RED}============================================${NC}"
echo -e "${RED}⚠️  PRODUCTION DATABASE RESET${NC}"
echo -e "${RED}============================================${NC}"
echo -e "${YELLOW}This will:${NC}"
echo -e "  1. Backup current production database"
echo -e "  2. Stop production services"
echo -e "  3. DROP and RECREATE production database"
echo -e "  4. Run all migrations"
echo -e "  5. Seed packages data"
echo -e "  6. Start production services"
echo ""
echo -e "${RED}WARNING: All current production data will be LOST!${NC}"
echo ""

# Confirmation
read -p "Are you sure you want to continue? Type 'YES' to confirm: " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
  echo -e "${YELLOW}Aborted.${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}Starting production database reset...${NC}"
echo ""

# ============================================
# Step 1: Backup
# ============================================
echo -e "${YELLOW}[1/8] Backing up production database${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/backup-db.sh"; then
  echo -e "${GREEN}✓ Backup completed${NC}"
else
  echo -e "${RED}✗ Backup failed - ABORTING${NC}"
  exit 1
fi

# ============================================
# Step 2: Stop services
# ============================================
echo -e "${YELLOW}[2/8] Stopping production services${NC}"
docker stop epr-backend-prod epr-ai-chatbot-prod epr-web-frontend-prod 2>/dev/null || true
echo -e "${GREEN}✓ Services stopped${NC}"

# ============================================
# Step 3: Drop and recreate database
# ============================================
echo -e "${YELLOW}[3/8] Dropping and recreating production database${NC}"

# Terminate connections
docker exec epr-postgres psql -U postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'epr_saas_production' AND pid <> pg_backend_pid();
" 2>/dev/null || true

# Drop and recreate
docker exec epr-postgres psql -U postgres <<EOF
DROP DATABASE IF EXISTS epr_saas_production;
CREATE DATABASE epr_saas_production;
GRANT ALL PRIVILEGES ON DATABASE epr_saas_production TO epr_production;
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database recreated${NC}"
else
  echo -e "${RED}✗ Database recreation failed${NC}"
  exit 1
fi

# ============================================
# Step 4: Grant schema permissions
# ============================================
echo -e "${YELLOW}[4/8] Granting schema permissions${NC}"
docker exec epr-postgres psql -U postgres -d epr_saas_production <<EOF
GRANT ALL ON SCHEMA public TO epr_production;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO epr_production;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO epr_production;
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Permissions granted${NC}"
else
  echo -e "${RED}✗ Permission grant failed${NC}"
  exit 1
fi

# ============================================
# Step 5: Run migrations
# ============================================
echo -e "${YELLOW}[5/8] Running database migrations${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/run-migrations.sh" production; then
  echo -e "${GREEN}✓ Migrations completed${NC}"
else
  echo -e "${RED}✗ Migrations failed${NC}"
  exit 1
fi

# ============================================
# Step 6: Seed packages
# ============================================
echo -e "${YELLOW}[6/8] Seeding packages data${NC}"
if "$PROJECT_ROOT/infrastructure/scripts/reseed-packages.sh" production; then
  echo -e "${GREEN}✓ Packages seeded${NC}"
else
  echo -e "${RED}✗ Package seeding failed${NC}"
  exit 1
fi

# ============================================
# Step 7: Start services
# ============================================
echo -e "${YELLOW}[7/8] Starting production services${NC}"
docker start epr-backend-prod epr-ai-chatbot-prod epr-web-frontend-prod

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Services started${NC}"
  sleep 5  # Wait for services to initialize
else
  echo -e "${RED}✗ Service start failed${NC}"
  exit 1
fi

# ============================================
# Step 8: Verify
# ============================================
echo -e "${YELLOW}[8/8] Verifying database setup${NC}"
echo ""

# Check packages
echo -e "${BLUE}Packages in database:${NC}"
docker exec epr-postgres psql -U epr_production -d epr_saas_production -c "SELECT name, price, token_limit FROM packages ORDER BY price;"

# Check subscriptions table has deleted_at
echo ""
echo -e "${BLUE}Checking subscriptions.deleted_at column:${NC}"
HAS_DELETED_AT=$(docker exec epr-postgres psql -U epr_production -d epr_saas_production -t -c "\d subscriptions" | grep deleted_at | wc -l)

if [ "$HAS_DELETED_AT" -gt 0 ]; then
  echo -e "${GREEN}✓ subscriptions.deleted_at column exists${NC}"
else
  echo -e "${RED}✗ subscriptions.deleted_at column missing${NC}"
fi

# Check backend logs for errors
echo ""
echo -e "${BLUE}Recent backend logs:${NC}"
docker logs epr-backend-prod --tail 10

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✓ Production database reset completed${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Test login at https://epr.dieplai.io.vn"
echo -e "  2. Create a test account"
echo -e "  3. Verify packages are visible"
echo -e "  4. Test chat functionality"
echo ""
echo -e "${YELLOW}Note: All previous users/data have been removed${NC}"
echo -e "${YELLOW}You'll need to create new admin user if needed${NC}"
echo ""
