#!/bin/bash
# Test image mới nhất trên server
echo "Testing latest web image on staging server..."

ssh dieplai@103.47.226.171 << 'ENDSSH'
# Get latest commit
cd /opt/epr-saas
LATEST_SHA=$(git rev-parse origin/main)
echo "Latest commit: $LATEST_SHA"

# Check if image exists
echo ""
echo "Checking images..."
docker images ghcr.io/dieplai/saas-epr-web --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}" | head -5

# Test localhost URLs in LATEST image
echo ""
echo "Testing for localhost URLs in latest image..."
LOCALHOST_COUNT=$(docker run --rm ghcr.io/dieplai/saas-epr-web:staging \
  find /app/.next -name "*.js" -type f -exec grep -l "localhost:8001" {} \; 2>/dev/null | wc -l)

echo "Files with localhost:8001: $LOCALHOST_COUNT"

if [ "$LOCALHOST_COUNT" -gt 0 ]; then
  echo "❌ ERROR: Image still has localhost URLs!"
  echo "Listing files:"
  docker run --rm ghcr.io/dieplai/saas-epr-web:staging \
    find /app/.next -name "*.js" -exec grep -l "localhost:8001" {} \; 2>/dev/null | head -10
else
  echo "✅ OK: No localhost URLs found"
fi

# Check container status
echo ""
echo "Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}" | grep epr-web

# Check container image SHA
echo ""
echo "Container image:"
docker inspect epr-web-frontend --format='{{.Image}}' | cut -c1-12
ENDSSH
