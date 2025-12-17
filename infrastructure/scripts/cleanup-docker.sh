#!/bin/bash
# ============================================
# EPR SaaS - Docker Cleanup (Safe)
# ============================================
# Clean up old Docker images for THIS PROJECT ONLY
# Does NOT affect other projects
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Docker Cleanup (EPR SaaS only)${NC}"
echo -e "${GREEN}========================================${NC}"

# Project-specific image patterns
IMAGE_PATTERNS=(
  "ghcr.io/dieplai/saas-epr-backend"
  "ghcr.io/dieplai/saas-epr-chatbot"
  "ghcr.io/dieplai/saas-epr-web"
)

# Remove dangling images (unused layers) - SAFE
echo -e "${YELLOW}1. Removing dangling images...${NC}"
DANGLING=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l)
if [ "$DANGLING" -gt 0 ]; then
  docker image prune -f
  echo -e "${GREEN}✓ Removed $DANGLING dangling images${NC}"
else
  echo -e "${GREEN}✓ No dangling images found${NC}"
fi

# Remove old versions of THIS project's images only
echo -e "${YELLOW}2. Removing old EPR SaaS images...${NC}"
REMOVED_COUNT=0

for pattern in "${IMAGE_PATTERNS[@]}"; do
  # Get all images matching this pattern
  OLD_IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^$pattern" | grep -v ":staging$" | grep -v ":production$" || true)

  if [ -n "$OLD_IMAGES" ]; then
    echo "$OLD_IMAGES" | while read -r image; do
      echo "  Removing: $image"
      docker rmi "$image" 2>/dev/null || true
      REMOVED_COUNT=$((REMOVED_COUNT + 1))
    done
  fi
done

echo -e "${GREEN}✓ Cleaned up old images${NC}"

# Remove stopped containers of THIS project only
echo -e "${YELLOW}3. Removing stopped EPR SaaS containers...${NC}"
STOPPED=$(docker ps -a -f "name=epr-" -f "status=exited" -q 2>/dev/null | wc -l)
if [ "$STOPPED" -gt 0 ]; then
  docker ps -a -f "name=epr-" -f "status=exited" -q | xargs -r docker rm
  echo -e "${GREEN}✓ Removed $STOPPED stopped containers${NC}"
else
  echo -e "${GREEN}✓ No stopped containers found${NC}"
fi

# Show disk space saved
echo -e "${YELLOW}4. Disk space summary...${NC}"
docker system df

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Cleanup completed!${NC}"
echo -e "${GREEN}========================================${NC}"
