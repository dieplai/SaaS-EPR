#!/bin/bash
# ============================================
# EPR SaaS - Database Setup Script
# ============================================
# Idempotent database and user creation
# Safe to run multiple times
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check required environment variable
if [ -z "$POSTGRES_PASSWORD" ]; then
  echo -e "${RED}ERROR: POSTGRES_PASSWORD environment variable not set${NC}"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database Setup - Idempotent${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if PostgreSQL container is running
if ! docker ps | grep -q epr-postgres; then
  echo -e "${RED}ERROR: PostgreSQL container not running${NC}"
  exit 1
fi

echo -e "${YELLOW}Setting up databases and users${NC}"

# Execute idempotent database setup
docker exec -i epr-postgres psql -U postgres postgres <<EOF
-- Create production database if not exists
SELECT 'CREATE DATABASE epr_saas_production'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'epr_saas_production')\gexec

-- Create production user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'epr_prod') THEN
    CREATE USER epr_prod WITH PASSWORD '${POSTGRES_PASSWORD}';
  END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE epr_saas_production TO epr_prod;

-- Create staging database if not exists
SELECT 'CREATE DATABASE epr_saas_staging'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'epr_saas_staging')\gexec

-- Create staging user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'epr_staging') THEN
    CREATE USER epr_staging WITH PASSWORD '${POSTGRES_PASSWORD}';
  END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE epr_saas_staging TO epr_staging;
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}OK: Databases and users configured${NC}"
else
  echo -e "${RED}ERROR: Database setup failed${NC}"
  exit 1
fi

# Grant schema permissions for production
echo -e "${YELLOW}Configuring production database permissions${NC}"
docker exec -i epr-postgres psql -U postgres -d epr_saas_production <<EOF
GRANT ALL ON SCHEMA public TO epr_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO epr_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO epr_prod;
EOF

# Grant schema permissions for staging
echo -e "${YELLOW}Configuring staging database permissions${NC}"
docker exec -i epr-postgres psql -U postgres -d epr_saas_staging <<EOF
GRANT ALL ON SCHEMA public TO epr_staging;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO epr_staging;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO epr_staging;
EOF

# Verify databases exist
echo -e "${YELLOW}Verifying database setup${NC}"
PROD_DB=$(docker exec epr-postgres psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='epr_saas_production';" | xargs)
STAGING_DB=$(docker exec epr-postgres psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='epr_saas_staging';" | xargs)

if [ "$PROD_DB" = "1" ] && [ "$STAGING_DB" = "1" ]; then
  echo -e "${GREEN}OK: Database verification passed${NC}"
  echo "  - epr_saas_production (user: epr_prod)"
  echo "  - epr_saas_staging (user: epr_staging)"
else
  echo -e "${RED}ERROR: Database verification failed${NC}"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database setup completed successfully${NC}"
echo -e "${GREEN}========================================${NC}"
