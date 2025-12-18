#!/bin/bash
# ============================================
# EPR SaaS - SSL Setup with Let's Encrypt
# ============================================
# Auto-generate SSL certificates using Certbot
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DOMAIN="epr.dieplai.io.vn"
EMAIL="dieptrungnam123@gmail.com"  # For Let's Encrypt notifications

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SSL Setup - Let's Encrypt${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo -e "${YELLOW}Email: $EMAIL${NC}"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# ============================================
# Step 1: Create directories for certificates
# ============================================
echo -e "${YELLOW}[1/5] Creating certificate directories${NC}"
mkdir -p infrastructure/certbot/conf
mkdir -p infrastructure/certbot/www
echo -e "${GREEN}OK: Directories created${NC}"

# ============================================
# Step 2: Start NGINX (HTTP only for validation)
# ============================================
echo -e "${YELLOW}[2/5] Starting NGINX for HTTP validation${NC}"

# Temporary NGINX config for Let's Encrypt validation
cat > infrastructure/nginx/conf.d/temp-http.conf <<'EOF'
server {
    listen 80;
    server_name epr.dieplai.io.vn;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Let\'s Encrypt validation server';
        add_header Content-Type text/plain;
    }
}
EOF

# Start NGINX temporarily
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx
sleep 5
echo -e "${GREEN}OK: NGINX started${NC}"

# ============================================
# Step 3: Request SSL certificate
# ============================================
echo -e "${YELLOW}[3/5] Requesting SSL certificate from Let's Encrypt${NC}"

docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}OK: SSL certificate obtained${NC}"
else
  echo -e "${RED}ERROR: Failed to obtain SSL certificate${NC}"
  echo -e "${RED}Check if:${NC}"
  echo "  1. Domain DNS is pointing to this server IP"
  echo "  2. Port 80 is open and accessible"
  echo "  3. No firewall blocking port 80"
  exit 1
fi

# ============================================
# Step 4: Replace with production NGINX config
# ============================================
echo -e "${YELLOW}[4/5] Activating production NGINX config${NC}"
rm infrastructure/nginx/conf.d/temp-http.conf
docker restart epr-nginx
sleep 3
echo -e "${GREEN}OK: Production config activated${NC}"

# ============================================
# Step 5: Setup auto-renewal
# ============================================
echo -e "${YELLOW}[5/5] Setting up auto-renewal${NC}"

# Create renewal script
cat > infrastructure/scripts/renew-ssl.sh <<'RENEWAL_SCRIPT'
#!/bin/bash
# Auto-renewal script for SSL certificates
# Add to crontab: 0 0 * * 0 /opt/epr-saas/infrastructure/scripts/renew-ssl.sh

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Attempting SSL certificate renewal..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot renew

if [ $? -eq 0 ]; then
  echo "Certificate renewed successfully"
  docker restart epr-nginx
  echo "NGINX restarted"
else
  echo "Certificate renewal failed or not needed"
fi
RENEWAL_SCRIPT

chmod +x infrastructure/scripts/renew-ssl.sh
echo -e "${GREEN}OK: Auto-renewal script created${NC}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SSL Setup Completed${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Test HTTPS: https://$DOMAIN"
echo "  2. Add to crontab for auto-renewal:"
echo "     crontab -e"
echo "     0 0 * * 0 /opt/epr-saas/infrastructure/scripts/renew-ssl.sh"
echo ""
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
