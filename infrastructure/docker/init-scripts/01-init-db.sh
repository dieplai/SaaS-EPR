#!/bin/bash
# ============================================
# PostgreSQL Database Initialization
# ============================================
# Auto-runs when PostgreSQL container starts for the first time
# Creates databases and users for staging and production
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PostgreSQL Initialization${NC}"
echo -e "${GREEN}========================================${NC}"

# Get password from environment (set in docker-compose)
DB_PASSWORD="${POSTGRES_PASSWORD:-changeme}"

echo -e "${YELLOW}Creating databases and users${NC}"

# Create production database and user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    -- Production database
    CREATE DATABASE epr_saas_production;
    CREATE USER epr_prod WITH PASSWORD '$DB_PASSWORD';
    GRANT ALL PRIVILEGES ON DATABASE epr_saas_production TO epr_prod;

    -- Connect to production database and grant schema permissions
    \c epr_saas_production
    GRANT ALL ON SCHEMA public TO epr_prod;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO epr_prod;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO epr_prod;

    -- Staging database
    \c postgres
    CREATE DATABASE epr_saas_staging;
    CREATE USER epr_staging WITH PASSWORD '$DB_PASSWORD';
    GRANT ALL PRIVILEGES ON DATABASE epr_saas_staging TO epr_staging;

    -- Connect to staging database and grant schema permissions
    \c epr_saas_staging
    GRANT ALL ON SCHEMA public TO epr_staging;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO epr_staging;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO epr_staging;
EOSQL

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database initialization completed${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Created databases:"
echo "  - epr_saas_production (user: epr_prod)"
echo "  - epr_saas_staging (user: epr_staging)"
echo ""
