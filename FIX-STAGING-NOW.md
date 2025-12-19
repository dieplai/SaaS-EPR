# Fix Staging - Emergency Procedure

## 🚨 Vấn đề hiện tại:
- Container `epr-web-frontend` đang chạy IMAGE CŨ (SHA: 41ac8f21)
- Image mới (SHA: 386bc41c) đã có trên server nhưng container CHƯA dùng
- Image build MỚI NHẤT (54b1bdb) có thể chưa được pull về

## ✅ Fix ngay (chạy trên staging server):

### Bước 1: Check commit SHA mới nhất
```bash
cd /opt/epr-saas  # Hoặc path project của bạn
git fetch origin
git log origin/main --oneline -1
```

Bạn sẽ thấy commit SHA (ví dụ: `54b1bdb`)

### Bước 2: Pull image với SHA mới nhất
```bash
# Thay <SHA> bằng commit SHA từ bước 1
LATEST_SHA="54b1bdb007ca650e89223aa62860f5a11666276f"  # Full SHA from git log

# Pull image mới
docker pull "ghcr.io/dieplai/saas-epr-web:staging-${LATEST_SHA}"

# Tag lại thành :staging
docker tag "ghcr.io/dieplai/saas-epr-web:staging-${LATEST_SHA}" \
           "ghcr.io/dieplai/saas-epr-web:staging"
```

### Bước 3: Verify image KHÔNG có localhost
```bash
# Check xem image MỚI có localhost URLs không
docker run --rm ghcr.io/dieplai/saas-epr-web:staging \
  find /app/.next -name "*.js" -type f -exec grep -l "localhost:8001" {} \; | wc -l

# Kết quả phải là 0 (hoặc rất ít)
# Nếu > 0 nghĩa là build args vẫn chưa được apply
```

### Bước 4: Restart container với image mới
```bash
cd /opt/epr-saas  # Project root

# Recreate container
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.staging \
  up -d --force-recreate web-frontend

# Hoặc restart tất cả services
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.staging \
  up -d --force-recreate
```

### Bước 5: Verify container đang dùng image mới
```bash
# Check container image SHA
docker inspect epr-web-frontend | grep -A2 '"Image":'

# Kết quả phải là SHA mới (386bc41c... hoặc mới hơn)
```

### Bước 6: Check container logs
```bash
docker logs epr-web-frontend --tail 50
```

### Bước 7: Hard refresh browser
```
Chrome/Edge: Ctrl + Shift + R
Firefox: Ctrl + Shift + Delete → Clear cache
```

---

## 🔍 Nếu vẫn có localhost URLs trong image mới:

Nghĩa là **build args KHÔNG được apply đúng**. Nguyên nhân có thể:

### Check 1: Verify build logs từ GitHub Actions
```bash
gh run view <RUN_ID> --log | grep -A10 "Build Configuration"
```

Phải thấy:
```
API_URL: https://staging.epr.dieplai.io.vn/api  ✅
```

### Check 2: Rebuild image manually với explicit build args
```bash
cd /opt/epr-saas/web

# Build locally với build args EXPLICIT
docker build \
  --no-cache \
  --build-arg NEXT_PUBLIC_BROWSER_API_URL="https://staging.epr.dieplai.io.vn/api" \
  --build-arg NEXT_PUBLIC_BROWSER_CHATBOT_URL="https://staging.epr.dieplai.io.vn" \
  --build-arg NEXT_PUBLIC_APP_URL="https://staging.epr.dieplai.io.vn" \
  -t ghcr.io/dieplai/saas-epr-web:staging-manual \
  .

# Verify
docker run --rm ghcr.io/dieplai/saas-epr-web:staging-manual \
  find /app/.next -name "*.js" -exec grep -l "localhost:8001" {} \; | wc -l

# Nếu = 0, tag lại và restart
docker tag ghcr.io/dieplai/saas-epr-web:staging-manual \
           ghcr.io/dieplai/saas-epr-web:staging

docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.staging up -d --force-recreate web-frontend
```

---

## 📝 Debug checklist:

- [ ] Commit SHA từ GitHub Actions match với image tag
- [ ] Image mới đã được pull về server
- [ ] Image không chứa localhost URLs
- [ ] Container đang chạy image mới (check SHA)
- [ ] Container status = healthy
- [ ] Browser đã hard refresh
- [ ] Network tab shows correct API URLs

---

## 🎯 Expected Result:

Browser console should show:
```
[API] GET /users/profile
XHR GET https://staging.epr.dieplai.io.vn/api/users/profile ✅
```

NOT:
```
Cross-Origin Request Blocked: ... http://localhost:8001 ❌
```
