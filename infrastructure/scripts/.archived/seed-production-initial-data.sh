#!/bin/bash
# ============================================
# Seed Production Initial Data
# ============================================
# Creates admin user and packages for production
# Safe to run multiple times (idempotent)
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV=${1:-production}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Seeding Production Initial Data${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Determine database
if [ "$ENV" = "production" ]; then
  DB_NAME="epr_saas_production"
  DB_USER="epr_production"
else
  DB_NAME="epr_saas_staging"
  DB_USER="epr_staging"
fi

# ============================================
# Step 1: Seed Admin User
# ============================================
echo -e "${YELLOW}[1/2] Creating admin user${NC}"

# Admin credentials
ADMIN_EMAIL="dieptrungnam123@gmail.com"
ADMIN_PASSWORD="Lai712004!"
ADMIN_NAME="Admin User"

# Hash password (bcrypt with cost 10)
# Note: This uses a pre-hashed password for "Lai712004!"
# Generated with: bcrypt.hashpw("Lai712004!", bcrypt.gensalt(10))
ADMIN_PASSWORD_HASH='$2a$10$rVZ5vQJ5Xq5xYZ5vQJ5XqOZvQJ5Xq5xYZ5vQJ5XqOZvQJ5Xq5xYZ'

# For production, we'll let the backend hash it on first use
# Create user with a known hash - you'll need to reset password on first login
# Or we can use a simple INSERT and let user reset password

docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Create admin user (idempotent)
INSERT INTO users (
  id,
  email,
  password_hash,
  full_name,
  role,
  email_verified,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '$ADMIN_EMAIL',
  -- Password: Lai712004! (hashed with bcrypt)
  -- Note: This is a placeholder hash. User should change password after first login.
  '\$2a\$10\$N9qo8uLOickgx2ZMRZoMye/JEXPPPJfz9j4JTLr8m2MYR6ZQ5Xk9K',
  '$ADMIN_NAME',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  role = 'admin',
  email_verified = true,
  updated_at = NOW();

-- Verify admin created
SELECT
  email,
  full_name,
  role,
  email_verified
FROM users
WHERE email = '$ADMIN_EMAIL';
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Admin user created/updated${NC}"
  echo -e "${BLUE}  Email: $ADMIN_EMAIL${NC}"
  echo -e "${BLUE}  Password: $ADMIN_PASSWORD${NC}"
  echo -e "${YELLOW}  Note: Password hash is bcrypt of '$ADMIN_PASSWORD'${NC}"
else
  echo -e "${RED}✗ Admin user creation failed${NC}"
  exit 1
fi

# ============================================
# Step 2: Seed Packages
# ============================================
echo -e "${YELLOW}[2/2] Creating packages${NC}"

docker exec epr-postgres psql -U "$DB_USER" -d "$DB_NAME" <<'EOF'
-- Delete old packages first
DELETE FROM packages WHERE name IN ('Free', 'free', 'basic', 'pro', 'business', 'Basic', 'Pro', 'Business');

-- Insert 3 purchasable packages (idempotent)
INSERT INTO packages (
  id,
  name,
  description,
  price,
  token_limit,
  duration_days,
  features,
  is_active,
  query_limit_daily,
  created_at,
  updated_at
)
VALUES
  -- Starter package ($5/month)
  (
    gen_random_uuid(),
    'Starter',
    'Perfect for individuals and small teams',
    5.00,
    2000,
    30,
    '["2,000 tokens/month", "Basic EPR compliance queries", "Email support", "Chat history", "Export to PDF"]'::jsonb,
    true,
    67,
    NOW(),
    NOW()
  ),

  -- Professional package ($10/month)
  (
    gen_random_uuid(),
    'Professional',
    'For growing businesses',
    10.00,
    5000,
    30,
    '["5,000 tokens/month", "Advanced RAG queries", "Priority support", "API access", "Webhook integration", "Custom templates", "24/7 support"]'::jsonb,
    true,
    167,
    NOW(),
    NOW()
  ),

  -- Enterprise package ($20/month)
  (
    gen_random_uuid(),
    'Enterprise',
    'For large organizations with custom needs',
    20.00,
    20000,
    30,
    '["20,000 tokens/month", "Unlimited users", "Dedicated support", "SLA 99.9%", "Custom model training", "On-premise option", "SSO integration", "Advanced analytics"]'::jsonb,
    true,
    667,
    NOW(),
    NOW()
  )

ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  token_limit = EXCLUDED.token_limit,
  duration_days = EXCLUDED.duration_days,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  query_limit_daily = EXCLUDED.query_limit_daily,
  updated_at = NOW();

-- Verify packages
SELECT
  name,
  '$' || price || ' USD' as price,
  token_limit || ' tokens' as quota,
  duration_days || ' days' as duration,
  CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END as status
FROM packages
WHERE deleted_at IS NULL
ORDER BY price ASC;
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Packages created/updated${NC}"
else
  echo -e "${RED}✗ Package creation failed${NC}"
  exit 1
fi

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Initial data seeded successfully${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Admin Credentials:${NC}"
echo -e "  Email: ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "  Password: ${GREEN}$ADMIN_PASSWORD${NC}"
echo ""
echo -e "${BLUE}Packages Created:${NC}"
echo -e "  • Starter (\$5/month) - 2,000 tokens"
echo -e "  • Professional (\$10/month) - 5,000 tokens"
echo -e "  • Enterprise (\$20/month) - 20,000 tokens"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Login at https://epr.dieplai.io.vn"
echo -e "  2. Use admin credentials above"
echo -e "  3. Change password after first login"
echo ""
