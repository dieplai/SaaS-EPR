#!/bin/bash
# ============================================
# EPR SaaS - Pre-flight Check Script
# ============================================
# Verify environment is ready for deployment
# Run BEFORE deployment to catch issues early
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check argument
if [ -z "$1" ]; then
  echo -e "${RED}ERROR: Environment required${NC}"
  echo "Usage: $0 staging|production"
  exit 1
fi

ENV=$1

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Pre-flight Check - Environment: $ENV${NC}"
echo -e "${GREEN}========================================${NC}"

ALL_CHECKS_PASSED=true

# Check 1: Docker daemon running
echo -e "${YELLOW}[1/8] Checking Docker daemon${NC}"
if docker info > /dev/null 2>&1; then
  echo -e "${GREEN}OK: Docker daemon is running${NC}"
else
  echo -e "${RED}ERROR: Docker daemon is not running${NC}"
  ALL_CHECKS_PASSED=false
fi

# Check 2: Docker Compose available
echo -e "${YELLOW}[2/8] Checking Docker Compose${NC}"
if docker compose version > /dev/null 2>&1; then
  COMPOSE_VERSION=$(docker compose version --short)
  echo -e "${GREEN}OK: Docker Compose $COMPOSE_VERSION${NC}"
else
  echo -e "${RED}ERROR: Docker Compose not available${NC}"
  ALL_CHECKS_PASSED=false
fi

# Check 3: Disk space
echo -e "${YELLOW}[3/8] Checking disk space${NC}"
AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
MIN_SPACE=5

if [ "$AVAILABLE_SPACE" -gt "$MIN_SPACE" ]; then
  echo -e "${GREEN}OK: ${AVAILABLE_SPACE}GB available (minimum ${MIN_SPACE}GB)${NC}"
else
  echo -e "${RED}ERROR: Only ${AVAILABLE_SPACE}GB available (minimum ${MIN_SPACE}GB required)${NC}"
  ALL_CHECKS_PASSED=false
fi

# Check 4: Required ports available
echo -e "${YELLOW}[4/8] Checking required ports${NC}"
REQUIRED_PORTS=(5432 6379 8000 8001 3001)
for port in "${REQUIRED_PORTS[@]}"; do
  if lsof -i:$port > /dev/null 2>&1; then
    echo -e "${GREEN}OK: Port $port is in use (expected)${NC}"
  else
    echo -e "${YELLOW}WARNING: Port $port is not in use${NC}"
  fi
done

# Check 5: Required secrets present
echo -e "${YELLOW}[5/8] Checking required secrets${NC}"
REQUIRED_SECRETS=(
  "POSTGRES_PASSWORD"
  "REDIS_PASSWORD"
  "JWT_SECRET"
  "OPENAI_API_KEY"
  "QDRANT_API_KEY"
  "QDRANT_CLOUD_URL"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
  if [ -n "${!secret}" ]; then
    echo -e "${GREEN}OK: $secret is set${NC}"
  else
    echo -e "${RED}ERROR: $secret is not set${NC}"
    ALL_CHECKS_PASSED=false
  fi
done

# Check 6: Git repository status
echo -e "${YELLOW}[6/8] Checking Git repository${NC}"
if git rev-parse --git-dir > /dev/null 2>&1; then
  CURRENT_BRANCH=$(git branch --show-current)
  echo -e "${GREEN}OK: Git repository on branch $CURRENT_BRANCH${NC}"
else
  echo -e "${RED}ERROR: Not a Git repository${NC}"
  ALL_CHECKS_PASSED=false
fi

# Check 7: PostgreSQL container running
echo -e "${YELLOW}[7/8] Checking database container${NC}"
if docker ps | grep -q epr-postgres; then
  echo -e "${GREEN}OK: PostgreSQL container is running${NC}"
else
  echo -e "${YELLOW}WARNING: PostgreSQL container not running${NC}"
fi

# Check 8: Backup directory writable
echo -e "${YELLOW}[8/8] Checking backup directory${NC}"
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/backups"
mkdir -p "$BACKUP_DIR"

if [ -w "$BACKUP_DIR" ]; then
  echo -e "${GREEN}OK: Backup directory is writable${NC}"
else
  echo -e "${RED}ERROR: Backup directory is not writable${NC}"
  ALL_CHECKS_PASSED=false
fi

echo -e "${GREEN}========================================${NC}"

if [ "$ALL_CHECKS_PASSED" = true ]; then
  echo -e "${GREEN}Pre-flight Check Passed${NC}"
  echo -e "${GREEN}Environment is ready for deployment${NC}"
  echo -e "${GREEN}========================================${NC}"
  exit 0
else
  echo -e "${RED}Pre-flight Check Failed${NC}"
  echo -e "${RED}Fix errors before deployment${NC}"
  echo -e "${GREEN}========================================${NC}"
  exit 1
fi
