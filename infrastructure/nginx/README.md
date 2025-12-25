# NGINX Configuration - EPR SaaS Platform

## 📁 Files in this Directory

```
infrastructure/nginx/
├── epr-staging.conf          # ✅ Staging config (self-contained)
├── epr-production.conf       # ✅ Production config (self-contained)
├── sites-available/          # ⚠️ OLD - deprecated, use files above
└── README.md                 # This file
```

**✅ Use:** `epr-staging.conf` and `epr-production.conf` (new, self-contained)
**⚠️ Avoid:** `sites-available/` (old structure)

## Architecture

```
VPS (103.47.226.171)
│
├─ NGINX Native (/etc/nginx/)           # Entry point
│  ├─ sites-available/
│  │  ├─ staging.epr.dieplai.io.vn     # Copy from epr-staging.conf
│  │  └─ epr.dieplai.io.vn             # Copy from epr-production.conf
│  └─ sites-enabled/                    # Active sites (symlinks)
│
├─ Certbot Native (/etc/letsencrypt/)   # SSL certificates
│  ├─ live/staging.epr.dieplai.io.vn/
│  └─ live/epr.dieplai.io.vn/
│
└─ Docker Containers (App Services)
   ├─ Staging (ports: 3000, 8000, 8001)
   └─ Production (ports: 3100, 8100, 8101)
```

## Setup (One-time manual setup on VPS)

### 1. Install NGINX & Certbot
```bash
apt update
apt install nginx certbot python3-certbot-nginx -y
```

### 2. Deploy NGINX configs

**✅ NEW METHOD (Recommended):**

NGINX configs are now self-contained in:
- `infrastructure/nginx/epr-staging.conf`
- `infrastructure/nginx/epr-production.conf`

**Copy to VPS:**
```bash
cd /opt/epr-saas

# Staging
sudo cp infrastructure/nginx/epr-staging.conf \
   /etc/nginx/sites-available/staging.epr.dieplai.io.vn

# Production
sudo cp infrastructure/nginx/epr-production.conf \
   /etc/nginx/sites-available/epr.dieplai.io.vn

# Enable sites
sudo ln -sf /etc/nginx/sites-available/staging.epr.dieplai.io.vn /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/epr.dieplai.io.vn /etc/nginx/sites-enabled/

# Remove default
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

**OR use SCP from local machine:**
```bash
# From your local machine
scp infrastructure/nginx/epr-staging.conf user@103.47.226.171:/tmp/
scp infrastructure/nginx/epr-production.conf user@103.47.226.171:/tmp/

# Then on VPS
sudo mv /tmp/epr-staging.conf /etc/nginx/sites-available/staging.epr.dieplai.io.vn
sudo mv /tmp/epr-production.conf /etc/nginx/sites-available/epr.dieplai.io.vn
sudo ln -sf /etc/nginx/sites-available/staging.epr.dieplai.io.vn /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/epr.dieplai.io.vn /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Get SSL certificates
```bash
# Staging
certbot certonly --webroot -w /var/www/certbot \
  -d staging.epr.dieplai.io.vn \
  --email your@email.com --agree-tos --no-eff-email

# Production
certbot certonly --webroot -w /var/www/certbot \
  -d epr.dieplai.io.vn \
  --email your@email.com --agree-tos --no-eff-email
```

### 4. SSL auto-renewal
Certbot automatically sets up renewal. Verify:
```bash
systemctl list-timers | grep certbot
certbot renew --dry-run
```

## Workflow

### Development (Local)
```bash
docker-compose -f docker-compose.yml up
# Access: http://localhost:3000
```

### Staging/Production (VPS)
```bash
git push origin main  # Triggers GitHub Actions
# → Build images
# → Push to GHCR
# → Deploy to VPS
# → NGINX proxies traffic
```

## NGINX Routing

### Staging (staging.epr.dieplai.io.vn)
- `/` → `http://localhost:3000` (Frontend)
- `/api/*` → `http://localhost:8001` (Backend)
- `/chat/*` → `http://localhost:8000` (Chatbot)

### Production (epr.dieplai.io.vn)
- `/` → `http://localhost:3100` (Frontend)
- `/api/*` → `http://localhost:8101` (Backend)
- `/chat/*` → `http://localhost:8100` (Chatbot)

## Benefits of NGINX Native

✅ **Performance:** No Docker overhead
✅ **Stability:** SystemD managed, auto-restart
✅ **SSL Management:** Certbot integration
✅ **Industry Standard:** Standard DevOps practice
✅ **Logs:** `/var/log/nginx/`
✅ **Mobile Ready:** HTTPS + WebSocket support for mobile apps

## 📱 Mobile App Support

The configs support Flutter/React Native apps out of the box:

### Configuration
```dart
// mobile/lib/core/config/api_config.dart
Environment.staging    → https://staging.epr.dieplai.io.vn
Environment.production → https://epr.dieplai.io.vn
```

### Features
- ✅ HTTPS with valid SSL certificates
- ✅ WebSocket support (`/chat/ws`)
- ✅ Server-sent events (`/chat/stream`)
- ✅ CORS handled at application level (backend/chatbot)

See `mobile/lib/core/api/README.md` for mobile integration guide.

## Adding New Projects

When adding a new project (e.g., `newproject.dieplai.io.vn`):

1. **Create NGINX config** in Git:
```bash
cp infrastructure/nginx/sites-available/staging.epr.dieplai.io.vn \
   infrastructure/nginx/sites-available/newproject.dieplai.io.vn
# Edit server_name and ports
```

2. **Commit to Git**
3. **On VPS:**
```bash
cp infrastructure/nginx/sites-available/newproject.dieplai.io.vn \
   /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/newproject.dieplai.io.vn /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot certonly --webroot -w /var/www/certbot -d newproject.dieplai.io.vn
```

## Troubleshooting

### Check NGINX status
```bash
systemctl status nginx
nginx -t
```

### Check logs
```bash
tail -f /var/log/nginx/staging.epr.access.log
tail -f /var/log/nginx/staging.epr.error.log
```

### Check SSL certificates
```bash
certbot certificates
ls -la /etc/letsencrypt/live/
```

### Reload config after changes
```bash
nginx -t && systemctl reload nginx
```
