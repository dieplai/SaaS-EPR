#!/bin/bash
# ============================================
# Reseed Packages - Manual execution only
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENV=${1:-staging}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo -e "${YELLOW}Reseeding packages for $ENV environment${NC}"

# Determine database
if [ "$ENV" = "production" ]; then
  DB_NAME="epr_saas_production"
  DB_USER="epr_production"
else
  DB_NAME="epr_saas_staging"
  DB_USER="epr_staging"
fi

# Copy seed file
docker cp "$PROJECT_ROOT/infrastructure/docker/init-scripts/03-seed-packages.sql" epr-postgres:/tmp/seed.sql

# Run seed
echo -e "${YELLOW}Running seed script...${NC}"
docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/seed.sql

# Cleanup
docker exec epr-postgres rm /tmp/seed.sql

# Show results
echo -e "${GREEN}Packages after seeding:${NC}"
docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT name, price, token_limit, is_active FROM packages ORDER BY price;"

echo -e "${GREEN}Done!${NC}"
