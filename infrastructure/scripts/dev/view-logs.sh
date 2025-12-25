#!/bin/bash
# ============================================
# EPR SaaS - Log Viewer Script
# ============================================
# Easy access to service logs
# Usage: ./view-logs.sh [service] [options]
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Default options
FOLLOW=false
LINES=50

# Parse arguments
SERVICE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--follow)
      FOLLOW=true
      shift
      ;;
    -n|--lines)
      LINES="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [service] [options]"
      echo ""
      echo "Services:"
      echo "  backend      - Backend API service"
      echo "  chatbot      - AI Chatbot service"
      echo "  web          - Web frontend"
      echo "  postgres     - PostgreSQL database"
      echo "  redis        - Redis cache"
      echo "  all          - All services"
      echo ""
      echo "Options:"
      echo "  -f, --follow       Follow log output (like tail -f)"
      echo "  -n, --lines NUM    Number of lines to show (default: 50)"
      echo "  -h, --help         Show this help"
      echo ""
      echo "Examples:"
      echo "  $0 backend                  # Show last 50 lines of backend logs"
      echo "  $0 backend -f               # Follow backend logs"
      echo "  $0 backend -n 100           # Show last 100 lines"
      echo "  $0 all -f                   # Follow all service logs"
      exit 0
      ;;
    *)
      SERVICE="$1"
      shift
      ;;
  esac
done

# Check if service specified
if [ -z "$SERVICE" ]; then
  echo -e "${RED}ERROR: Service required${NC}"
  echo "Run '$0 --help' for usage"
  exit 1
fi

# Map service names to container names
case "$SERVICE" in
  backend)
    CONTAINER="epr-backend"
    ;;
  chatbot)
    CONTAINER="epr-ai-chatbot-api"
    ;;
  web)
    CONTAINER="epr-web-frontend"
    ;;
  postgres)
    CONTAINER="epr-postgres"
    ;;
  redis)
    CONTAINER="epr-redis"
    ;;
  all)
    CONTAINER="all"
    ;;
  *)
    echo -e "${RED}ERROR: Invalid service: $SERVICE${NC}"
    echo "Run '$0 --help' for available services"
    exit 1
    ;;
esac

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}EPR SaaS - Log Viewer${NC}"
echo -e "${GREEN}========================================${NC}"

if [ "$CONTAINER" == "all" ]; then
  echo "Showing logs from all services..."
  echo ""

  if [ "$FOLLOW" = true ]; then
    docker compose -f docker-compose.yml logs -f --tail="$LINES"
  else
    docker compose -f docker-compose.yml logs --tail="$LINES"
  fi
else
  # Check if container exists
  if ! docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER$"; then
    echo -e "${RED}ERROR: Container $CONTAINER not found${NC}"
    echo "Is the service running? Check with: docker ps"
    exit 1
  fi

  echo "Service: $SERVICE (container: $CONTAINER)"
  echo "Lines: $LINES"
  if [ "$FOLLOW" = true ]; then
    echo "Mode: Follow (Ctrl+C to stop)"
  else
    echo "Mode: Static"
  fi
  echo ""

  # Show logs
  if [ "$FOLLOW" = true ]; then
    docker logs -f --tail="$LINES" "$CONTAINER"
  else
    docker logs --tail="$LINES" "$CONTAINER"
  fi
fi
