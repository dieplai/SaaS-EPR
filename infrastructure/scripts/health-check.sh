#!/bin/bash
# ============================================
# EPR SaaS - Health Check Script
# ============================================
# Check service health with retries
# Exit code 0 = healthy, 1 = unhealthy
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
MAX_RETRIES=30
RETRY_INTERVAL=5
SERVICES=(
  "Backend:http://localhost:8001/health"
  "Chatbot:http://localhost:8000/health"
)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Health Check - Starting${NC}"
echo -e "${GREEN}========================================${NC}"

ALL_HEALTHY=true

for service_def in "${SERVICES[@]}"; do
  SERVICE_NAME=$(echo "$service_def" | cut -d: -f1)
  SERVICE_URL=$(echo "$service_def" | cut -d: -f2-)

  echo -e "${YELLOW}Checking $SERVICE_NAME...${NC}"

  HEALTHY=false
  for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf "$SERVICE_URL" > /dev/null 2>&1; then
      echo -e "${GREEN}OK: $SERVICE_NAME is healthy (attempt $i/$MAX_RETRIES)${NC}"
      HEALTHY=true
      break
    else
      if [ $i -eq $MAX_RETRIES ]; then
        echo -e "${RED}ERROR: $SERVICE_NAME health check failed after $MAX_RETRIES attempts${NC}"
      else
        echo "  Attempt $i/$MAX_RETRIES failed, retrying in ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
      fi
    fi
  done

  if [ "$HEALTHY" = false ]; then
    ALL_HEALTHY=false
    echo -e "${RED}ERROR: $SERVICE_NAME is unhealthy${NC}"
    echo "  URL: $SERVICE_URL"
    echo "  Check logs: docker logs ${SERVICE_NAME,,} 2>&1 | tail -50"
  fi
done

echo -e "${GREEN}========================================${NC}"

if [ "$ALL_HEALTHY" = true ]; then
  echo -e "${GREEN}Health Check Passed - All services healthy${NC}"
  echo -e "${GREEN}========================================${NC}"
  exit 0
else
  echo -e "${RED}Health Check Failed - Some services unhealthy${NC}"
  echo -e "${GREEN}========================================${NC}"
  exit 1
fi
