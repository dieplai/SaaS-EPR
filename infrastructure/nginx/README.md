# NGINX + SSL Setup Guide

## Architecture

```
User Request
    ↓
epr.dieplai.io.vn (HTTPS)
    ↓
NGINX Reverse Proxy (Port 80/443)
    ↓
┌─────────────────────────────────────┐
│  Path-based Routing:                │
│  /           → Frontend (port 3000) │
│  /api/*      → Backend (port 8001)  │
│  /chat/*     → Chatbot (port 8000)  │
└─────────────────────────────────────┘
```

## DNS Setup

Thêm record này vào DNS provider:

```
Type: A
Host: epr
Value: 103.47.226.171
TTL: 0 (Auto)
```

Verify DNS đã hoạt động:
```bash
nslookup epr.dieplai.io.vn
# Should return: 103.47.226.171
```

## First-Time Setup (trên VPS)

### 1. Deploy application (không có SSL)
```bash
cd /opt/epr-saas
./infrastructure/scripts/deploy.sh staging
```

### 2. Setup SSL với Let's Encrypt
```bash
cd /opt/epr-saas
./infrastructure/scripts/setup-ssl.sh
```

Script sẽ tự động:
- Tạo certificate directories
- Start NGINX tạm thời cho HTTP validation
- Request SSL certificate từ Let's Encrypt
- Restart NGINX với HTTPS config
- Tạo auto-renewal script

### 3. Setup auto-renewal (chạy 1 lần duy nhất)
```bash
# Thêm vào crontab để auto-renew mỗi tuần
crontab -e

# Add this line:
0 0 * * 0 /opt/epr-saas/infrastructure/scripts/renew-ssl.sh
```

## Testing

### Test HTTP → HTTPS redirect
```bash
curl -I http://epr.dieplai.io.vn
# Should return: 301 Moved Permanently
```

### Test HTTPS
```bash
curl -I https://epr.dieplai.io.vn
# Should return: 200 OK
```

### Test API routing
```bash
# Backend API
curl https://epr.dieplai.io.vn/api/health
# Should return backend health response

# Chatbot API
curl https://epr.dieplai.io.vn/chat/health
# Should return chatbot health response
```

## Troubleshooting

### Certificate request fails
```bash
# Check DNS is pointing correctly
nslookup epr.dieplai.io.vn

# Check port 80 is accessible
nc -zv 103.47.226.171 80

# Check NGINX logs
docker logs epr-nginx

# Check Certbot logs
docker logs epr-certbot
```

### NGINX fails to start
```bash
# Test NGINX config
docker exec epr-nginx nginx -t

# Check NGINX error logs
docker logs epr-nginx --tail 100
```

## Manual Certificate Renewal

```bash
cd /opt/epr-saas
./infrastructure/scripts/renew-ssl.sh
```

## File Structure

```
infrastructure/
├── nginx/
│   ├── nginx.conf                    # Main NGINX config
│   ├── conf.d/
│   │   └── epr.dieplai.io.vn.conf   # Site config (path routing)
│   └── README.md                     # This file
├── certbot/
│   ├── conf/                         # SSL certificates (auto-generated)
│   └── www/                          # ACME challenge files
└── scripts/
    ├── setup-ssl.sh                  # First-time SSL setup
    └── renew-ssl.sh                  # Auto-renewal script
```

## Security Features

- ✅ Auto HTTP → HTTPS redirect
- ✅ TLS 1.2 and TLS 1.3 only
- ✅ Strong cipher suites
- ✅ HSTS enabled (1 year)
- ✅ X-Frame-Options, X-XSS-Protection headers
- ✅ Auto-renewal every 12 hours (certificate expires in 90 days)

## Internal Service Communication

**CRITICAL:** Services communicate internally via Docker network, NOT through public domain!

```yaml
# ❌ WRONG - Don't do this
Backend calls Chatbot: https://epr.dieplai.io.vn/chat/...

# ✅ CORRECT - Internal Docker network
Backend calls Chatbot: http://epr-ai-chatbot-api:8000/...
```
