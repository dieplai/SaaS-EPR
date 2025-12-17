#!/bin/bash
# ============================================
# EPR SaaS - Production Database Backup
# ============================================
# Backup production DB before deployment
# Keep only 1 latest backup
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/production_db_backup_$TIMESTAMP.sql"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database Backup - Production${NC}"
echo -e "${GREEN}========================================${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if production is running
if ! docker ps | grep -q epr-postgres; then
  echo -e "${RED}Error: PostgreSQL container not running${NC}"
  exit 1
fi

# Backup database
echo -e "${YELLOW}Creating database dump${NC}"
docker exec epr-postgres pg_dump \
  -U epr_prod \
  -d epr_saas_production \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}OK: Backup saved to $BACKUP_FILE${NC}"

  # Compress backup
  echo -e "${YELLOW}Compressing backup${NC}"
  gzip "$BACKUP_FILE"
  echo -e "${GREEN}OK: Backup compressed${NC}"

  # Cleanup old backups (keep only latest 1)
  echo -e "${YELLOW}Cleaning up old backups${NC}"
  cd "$BACKUP_DIR"
  ls -t production_db_backup_*.sql.gz 2>/dev/null | tail -n +2 | xargs -r rm -f

  BACKUP_COUNT=$(ls -1 production_db_backup_*.sql.gz 2>/dev/null | wc -l)
  echo -e "${GREEN}OK: Keeping ${BACKUP_COUNT} latest backup${NC}"
else
  echo -e "${RED}ERROR: Backup failed${NC}"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup completed successfully${NC}"
echo -e "${GREEN}========================================${NC}"
