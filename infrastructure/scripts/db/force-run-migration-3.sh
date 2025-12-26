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

# Create payments table directly
echo -e "${YELLOW}[2/5] Creating payments table${NC}"

# Create table
docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'VND',
    period VARCHAR(10) NOT NULL CHECK (period IN ('monthly', 'yearly')),
    sepay_transaction_id BIGINT UNIQUE,
    sepay_reference_code VARCHAR(100),
    sepay_gateway VARCHAR(50),
    sepay_account_number VARCHAR(50),
    sepay_transaction_date TIMESTAMP,
    sepay_transfer_content TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP,
    expires_at TIMESTAMP,
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_payments_package FOREIGN KEY (package_id) REFERENCES packages(id)
);"

# Create indexes
docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_code ON payments(order_code);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_sepay_transaction_id ON payments(sepay_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);"

# Create trigger
docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
CREATE TRIGGER trigger_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();"

echo -e "${GREEN}OK: Payments table created${NC}"

# Update migration version to 3
echo -e "${YELLOW}[3/5] Updating migration version to 3${NC}"
docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
  "UPDATE schema_migrations SET version = 3, dirty = false WHERE version = 2;"

echo -e "${GREEN}OK: Migration version updated to 3${NC}"

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
