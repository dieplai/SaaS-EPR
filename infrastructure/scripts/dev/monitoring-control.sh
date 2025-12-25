#!/bin/bash
# ============================================
# EPR SaaS - Monitoring Control Script
# ============================================
# Manage monitoring stack (Loki, Prometheus, Grafana)
# Usage: ./monitoring-control.sh start|stop|restart|status
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Check command
if [ -z "$1" ]; then
  echo -e "${RED}ERROR: Command required${NC}"
  echo "Usage: $0 start|stop|restart|status"
  exit 1
fi

COMMAND=$1

cd "$PROJECT_ROOT"

case "$COMMAND" in
  start)
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Starting Monitoring Stack${NC}"
    echo -e "${GREEN}========================================${NC}"

    # Check if network exists, create if not
    if ! docker network inspect epr-network > /dev/null 2>&1; then
      echo "Creating epr-network..."
      docker network create epr-network
    fi

    # Start monitoring services
    docker compose -f infrastructure/docker-compose.logging.yml up -d

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Monitoring Stack Started${NC}"
    echo ""
    echo "Access points:"
    echo "  - Grafana:    http://localhost:3000 (admin/admin123)"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Loki:       http://localhost:3100"
    echo ""
    echo "Run '$0 status' to check service health"
    echo -e "${GREEN}========================================${NC}"
    ;;

  stop)
    echo -e "${YELLOW}Stopping Monitoring Stack${NC}"
    docker compose -f infrastructure/docker-compose.logging.yml down
    echo -e "${GREEN}OK: Monitoring stack stopped${NC}"
    ;;

  restart)
    echo -e "${YELLOW}Restarting Monitoring Stack${NC}"
    docker compose -f infrastructure/docker-compose.logging.yml restart
    echo -e "${GREEN}OK: Monitoring stack restarted${NC}"
    ;;

  status)
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Monitoring Stack Status${NC}"
    echo -e "${GREEN}========================================${NC}"

    # Check each service
    SERVICES=("epr-grafana" "epr-prometheus" "epr-loki" "epr-promtail" "epr-node-exporter" "epr-cadvisor")

    for service in "${SERVICES[@]}"; do
      if docker ps --format '{{.Names}}' | grep -q "^$service$"; then
        STATUS=$(docker inspect --format='{{.State.Status}}' "$service")
        if [ "$STATUS" == "running" ]; then
          echo -e "${GREEN}OK: $service is running${NC}"
        else
          echo -e "${YELLOW}WARNING: $service status: $STATUS${NC}"
        fi
      else
        echo -e "${RED}ERROR: $service is not running${NC}"
      fi
    done

    echo -e "${GREEN}========================================${NC}"

    # Check HTTP endpoints
    echo ""
    echo "Checking HTTP endpoints:"

    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
      echo -e "${GREEN}OK: Grafana is accessible${NC}"
    else
      echo -e "${RED}ERROR: Grafana is not accessible${NC}"
    fi

    if curl -sf http://localhost:9090/-/healthy > /dev/null 2>&1; then
      echo -e "${GREEN}OK: Prometheus is accessible${NC}"
    else
      echo -e "${RED}ERROR: Prometheus is not accessible${NC}"
    fi

    if curl -sf http://localhost:3100/ready > /dev/null 2>&1; then
      echo -e "${GREEN}OK: Loki is accessible${NC}"
    else
      echo -e "${RED}ERROR: Loki is not accessible${NC}"
    fi
    ;;

  *)
    echo -e "${RED}ERROR: Invalid command${NC}"
    echo "Usage: $0 start|stop|restart|status"
    exit 1
    ;;
esac
