#!/bin/bash
# ============================================
# EPR SaaS - AUTOMATED BACKUP SCRIPT
# ============================================
# Automated PostgreSQL + Redis backups with rotation
# Run via cron: 0 3 * * * /path/to/backup-automated.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR="/var/backups/epr-saas"
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL credentials
POSTGRES_CONTAINER="epr-postgres"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

# Databases to backup
DATABASES=("epr_saas_production" "epr_saas_staging")

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}EPR SaaS Automated Backup${NC}"
echo -e "${GREEN}Date: $(date)${NC}"
echo -e "${GREEN}========================================${NC}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"/{postgresql,redis,logs}

# ============================================
# POSTGRESQL BACKUPS
# ============================================
echo -e "${YELLOW}[1/3] Backing up PostgreSQL databases${NC}"

for DB in "${DATABASES[@]}"; do
    BACKUP_FILE="${BACKUP_DIR}/postgresql/${DB}_${DATE}.sql.gz"
    echo -e "${YELLOW}Backing up ${DB}...${NC}"

    docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" ${POSTGRES_CONTAINER} \
        pg_dump -U ${POSTGRES_USER} -Fc ${DB} | gzip > "${BACKUP_FILE}"

    if [ -f "${BACKUP_FILE}" ]; then
        SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
        echo -e "${GREEN}✓ ${DB} backed up (${SIZE})${NC}"
    else
        echo -e "${RED}✗ Failed to backup ${DB}${NC}"
        exit 1
    fi
done

# Backup WAL files (for point-in-time recovery)
echo -e "${YELLOW}Archiving WAL files...${NC}"
docker exec ${POSTGRES_CONTAINER} \
    pg_basebackup -U ${POSTGRES_USER} -D - -Ft -z -Xs -P \
    > "${BACKUP_DIR}/postgresql/wal_archive_${DATE}.tar.gz" 2>&1 || true

# ============================================
# REDIS BACKUPS
# ============================================
echo -e "${YELLOW}[2/3] Backing up Redis${NC}"

REDIS_CONTAINER="epr-redis"
REDIS_BACKUP="${BACKUP_DIR}/redis/dump_${DATE}.rdb"

# Trigger Redis save
docker exec ${REDIS_CONTAINER} redis-cli BGSAVE

# Wait for save to complete
sleep 5

# Copy dump file
docker cp ${REDIS_CONTAINER}:/data/dump.rdb "${REDIS_BACKUP}"

if [ -f "${REDIS_BACKUP}" ]; then
    SIZE=$(du -h "${REDIS_BACKUP}" | cut -f1)
    echo -e "${GREEN}✓ Redis backed up (${SIZE})${NC}"
else
    echo -e "${RED}✗ Failed to backup Redis${NC}"
    exit 1
fi

# ============================================
# UPLOAD TO S3 (if configured)
# ============================================
if [ -n "${S3_BUCKET}" ]; then
    echo -e "${YELLOW}[3/3] Uploading to S3${NC}"

    aws s3 sync "${BACKUP_DIR}" "s3://${S3_BUCKET}/epr-saas-backups/" \
        --exclude "*" \
        --include "postgresql/*_${DATE}*" \
        --include "redis/*_${DATE}*" \
        --storage-class STANDARD_IA

    echo -e "${GREEN}✓ Uploaded to S3${NC}"
else
    echo -e "${YELLOW}[3/3] S3 upload skipped (S3_BUCKET not configured)${NC}"
fi

# ============================================
# CLEANUP OLD BACKUPS
# ============================================
echo -e "${YELLOW}Cleaning up backups older than ${RETENTION_DAYS} days${NC}"

find "${BACKUP_DIR}/postgresql" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}/postgresql" -type f -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}/redis" -type f -name "*.rdb" -mtime +${RETENTION_DAYS} -delete

echo -e "${GREEN}✓ Cleanup completed${NC}"

# ============================================
# VERIFY BACKUPS
# ============================================
echo -e "${YELLOW}Verifying backup integrity${NC}"

for DB in "${DATABASES[@]}"; do
    LATEST_BACKUP=$(ls -t "${BACKUP_DIR}/postgresql/${DB}_"*.sql.gz 2>/dev/null | head -1)

    if [ -f "${LATEST_BACKUP}" ]; then
        # Test if backup can be read
        if gzip -t "${LATEST_BACKUP}" 2>/dev/null; then
            echo -e "${GREEN}✓ ${DB} backup integrity OK${NC}"
        else
            echo -e "${RED}✗ ${DB} backup integrity FAILED${NC}"
            exit 1
        fi
    fi
done

# ============================================
# LOG BACKUP STATUS
# ============================================
LOG_FILE="${BACKUP_DIR}/logs/backup_${DATE}.log"
cat > "${LOG_FILE}" <<EOF
Backup completed: $(date)
PostgreSQL: $(ls -lh "${BACKUP_DIR}/postgresql" | grep "${DATE}" | wc -l) files
Redis: $(ls -lh "${BACKUP_DIR}/redis" | grep "${DATE}" | wc -l) files
Total size: $(du -sh "${BACKUP_DIR}" | cut -f1)
EOF

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup completed successfully${NC}"
echo -e "${GREEN}Log: ${LOG_FILE}${NC}"
echo -e "${GREEN}========================================${NC}"
