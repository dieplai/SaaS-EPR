# Hướng dẫn Setup NGINX - Staging + Production trên 1 VPS

## Architecture Overview

```
VPS: 103.47.226.171 (8GB RAM)
│
├─ NGINX (Reverse Proxy - Port 80, 443)
│  │
│  ├─ staging.epr.dieplai.io.vn (SSL Certificate 1)
│  │  ├─ / → epr-web-frontend:3000
│  │  ├─ /api → epr-backend:8001
│  │  └─ /chat → epr-ai-chatbot-api:8000
│  │
│  └─ epr.dieplai.io.vn (SSL Certificate 2)
│     ├─ / → epr-web-frontend-prod:3000
│     ├─ /api → epr-backend-prod:8001
│     └─ /chat → epr-ai-chatbot-prod:8000
│
├─ STAGING Services (Docker Containers)
│  ├─ epr-backend (container name từ docker-compose)
│  ├─ epr-ai-chatbot-api
│  └─ epr-web-frontend
│
├─ PRODUCTION Services (Docker Containers - chưa deploy)
│  ├─ epr-backend-prod (sẽ tạo sau)
│  ├─ epr-ai-chatbot-prod
│  └─ epr-web-frontend-prod
│
└─ SHARED Services
   ├─ PostgreSQL (port 5432)
   │  ├─ DB: epr_saas_staging
   │  └─ DB: epr_saas_production
   └─ Redis (port 6379)
```

---

## Bước 1: Verify DNS (Đã có)

```bash
# Check DNS đã trỏ đúng chưa
nslookup staging.epr.dieplai.io.vn
# Output: 103.47.226.171 ✅

nslookup epr.dieplai.io.vn
# Output: 103.47.226.171 ✅
```

---

## Bước 2: Deploy Code lên VPS

```bash
# SSH vào VPS
ssh root@103.47.226.171

# Pull code mới nhất
cd /opt/epr-saas
git pull origin main
```

---

## Bước 3: Start NGINX (HTTP only - để lấy SSL)

Vì chưa có SSL certificate nên phải start NGINX với HTTP trước để Let's Encrypt validate.

```bash
cd /opt/epr-saas

# Tạo thư mục cho certificates
mkdir -p infrastructure/certbot/conf
mkdir -p infrastructure/certbot/www

# Tạo temporary NGINX config (HTTP only)
cat > infrastructure/nginx/conf.d/temp-http.conf <<'EOF'
server {
    listen 80;
    server_name staging.epr.dieplai.io.vn epr.dieplai.io.vn;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

# Start NGINX
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx

# Verify NGINX đang chạy
docker ps | grep nginx
curl http://staging.epr.dieplai.io.vn
# Should return: SSL setup in progress...
```

---

## Bước 4: Lấy SSL Certificates (Staging trước)

```bash
# Request SSL cho STAGING domain
docker compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email dieptrungnam123@gmail.com \
  --agree-tos \
  --no-eff-email \
  -d staging.epr.dieplai.io.vn

# Verify certificate đã tạo
ls -la infrastructure/certbot/conf/live/staging.epr.dieplai.io.vn/
# Should see: fullchain.pem, privkey.pem
```

---

## Bước 5: Lấy SSL Certificate cho Production

```bash
# Request SSL cho PRODUCTION domain
docker compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email dieptrungnam123@gmail.com \
  --agree-tos \
  --no-eff-email \
  -d epr.dieplai.io.vn

# Verify certificate đã tạo
ls -la infrastructure/certbot/conf/live/epr.dieplai.io.vn/
```

---

## Bước 6: Activate Production NGINX Config

```bash
# Xóa temporary config
rm infrastructure/nginx/conf.d/temp-http.conf

# Verify config syntax
docker exec epr-nginx nginx -t

# Reload NGINX với HTTPS configs
docker restart epr-nginx

# Wait 5 giây cho NGINX khởi động
sleep 5
```

---

## Bước 7: Test HTTPS

```bash
# Test staging
curl -I https://staging.epr.dieplai.io.vn
# Should return: 200 OK hoặc 502 Bad Gateway (nếu services chưa chạy - OK)

# Test production
curl -I https://epr.dieplai.io.vn
# Should return: 200 OK hoặc 502 Bad Gateway (chưa deploy production)
```

**502 Bad Gateway là BÌNH THƯỜNG** vì:
- Staging: Services đang chạy nhưng có thể chưa ready
- Production: Chưa deploy containers production

---

## Bước 8: Deploy Staging Services (hiện tại)

```bash
cd /opt/epr-saas

# Set environment variables
export POSTGRES_PASSWORD="KgDpqlyheSrkw5Lkj8CssEjG9Dj8PVJy"
export REDIS_PASSWORD="<your-redis-password>"
export JWT_SECRET="<your-jwt-secret>"
export OPENAI_API_KEY="<your-openai-key>"
export QDRANT_API_KEY="<your-qdrant-key>"
export QDRANT_CLOUD_URL="<your-qdrant-url>"

# Deploy staging
./infrastructure/scripts/deploy.sh staging
```

---

## Bước 9: Test Staging hoàn chỉnh

```bash
# Test frontend
curl https://staging.epr.dieplai.io.vn
# Should return HTML

# Test backend API
curl https://staging.epr.dieplai.io.vn/api/health
# Should return: {"status":"ok"}

# Test chatbot
curl https://staging.epr.dieplai.io.vn/chat/health
# Should return: {"status":"ok","service":"epr-chatbot-service"}
```

Truy cập browser: https://staging.epr.dieplai.io.vn ✅

---

## Bước 10: Deploy Production (sau này)

**LƯU Ý:** Production sẽ deploy sau khi staging test kỹ.

Khi sẵn sàng deploy production:
```bash
# Create tag
git tag -a v1.0.0 -m "First production release"
git push origin v1.0.0

# GitHub Actions sẽ yêu cầu manual approval
# Approve trên GitHub → Auto deploy production
```

Production sẽ chạy với container names khác:
- `epr-backend-prod`
- `epr-ai-chatbot-prod`
- `epr-web-frontend-prod`

---

## Bước 11: Setup Auto-renewal SSL

```bash
# Tạo renewal script
cat > /opt/epr-saas/infrastructure/scripts/renew-ssl.sh <<'EOF'
#!/bin/bash
cd /opt/epr-saas
docker compose run --rm certbot renew
docker restart epr-nginx
EOF

chmod +x /opt/epr-saas/infrastructure/scripts/renew-ssl.sh

# Add vào crontab (chạy mỗi tuần)
crontab -e
# Add dòng này:
0 0 * * 0 /opt/epr-saas/infrastructure/scripts/renew-ssl.sh
```

---

## Troubleshooting

### 1. Certificate request fails
```bash
# Check DNS
nslookup staging.epr.dieplai.io.vn

# Check port 80 mở chưa
nc -zv 103.47.226.171 80

# Check NGINX logs
docker logs epr-nginx

# Check certbot logs
docker logs epr-certbot
```

### 2. 502 Bad Gateway
```bash
# Check containers có chạy không
docker ps | grep epr

# Check logs
docker logs epr-backend
docker logs epr-web-frontend
docker logs epr-ai-chatbot-api

# Check NGINX routing
docker exec epr-nginx cat /etc/nginx/conf.d/staging.epr.dieplai.io.vn.conf
```

### 3. SSL Certificate không load
```bash
# Check certificate files
ls -la /opt/epr-saas/infrastructure/certbot/conf/live/

# Restart NGINX
docker restart epr-nginx
```

---

## Khi thêm Project Mới (Sau này)

### 1. Add DNS
```
newproject.dieplai.io.vn  →  103.47.226.171
```

### 2. Copy NGINX config template
```bash
cp infrastructure/nginx/conf.d/staging.epr.dieplai.io.vn.conf \
   infrastructure/nginx/conf.d/newproject.dieplai.io.vn.conf

# Edit file, đổi:
# - server_name → newproject.dieplai.io.vn
# - proxy_pass → newproject-backend:8001, etc.
```

### 3. Get SSL certificate
```bash
docker compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your@email.com \
  --agree-tos \
  -d newproject.dieplai.io.vn
```

### 4. Reload NGINX
```bash
docker restart epr-nginx
```

---

## Tóm tắt Commands

```bash
# 1. Pull code
cd /opt/epr-saas && git pull

# 2. Start NGINX (HTTP)
docker compose up -d nginx

# 3. Get SSL
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot -d staging.epr.dieplai.io.vn

# 4. Activate HTTPS config
rm infrastructure/nginx/conf.d/temp-http.conf
docker restart epr-nginx

# 5. Deploy staging
./infrastructure/scripts/deploy.sh staging

# 6. Test
curl https://staging.epr.dieplai.io.vn
```
