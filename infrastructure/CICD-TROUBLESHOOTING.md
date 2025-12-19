# CI/CD Troubleshooting Guide

## Common Issues & Solutions

### ❌ Issue: Frontend uses localhost URLs in production/staging

**Symptom:**
```
Cross-Origin Request Blocked: ... http://localhost:8001/api/v1/users/profile
```

**Root Cause:**
Next.js `NEXT_PUBLIC_*` variables are embedded at **BUILD TIME**, not runtime. If build args are not passed correctly, it falls back to localhost.

**Solution:**
1. **Dockerfile must validate build args** (✅ Fixed in web/Dockerfile)
   - Fails build if args are missing
   - Logs build configuration for debugging
   - Removes any .env files that could override

2. **Workflow must pass args correctly** (✅ Fixed in .github/workflows/deploy.yml)
   - Set URLs in separate step (avoid complex ternary in YAML)
   - Verify configuration before build
   - Use simple variable references

**Test locally before pushing:**
```bash
./infrastructure/scripts/test-build-web.sh staging
```

---

### 🔍 Debugging Docker Builds

**View build logs with args:**
```bash
# In CI/CD, enable verbose logging
docker build --progress=plain --no-cache ...
```

**Verify environment variables in running container:**
```bash
# Staging
docker exec epr-web-frontend env | grep NEXT_PUBLIC

# Production
docker exec epr-web-frontend-prod env | grep NEXT_PUBLIC
```

**NOTE:** In Next.js, NEXT_PUBLIC vars are baked into JavaScript bundle. Checking `env` shows build-time values, not what's actually in the JS.

**Better verification - check actual bundle:**
```bash
# Run container and check from browser console
docker run -p 3000:3000 epr-web-test:staging

# Then open browser console and run:
console.log({
  API_URL: process.env.NEXT_PUBLIC_BROWSER_API_URL,
  // This won't work in browser! Need to check actual API calls
});

# Best way: Check Network tab in DevTools for actual API calls
```

---

### 📋 CI/CD Pipeline Flow

```
1. Trigger (push to main → staging | manual → production)
   │
2. Set Environment Variables
   │ ├─ staging: https://staging.epr.dieplai.io.vn
   │ └─ production: https://epr.dieplai.io.vn
   │
3. Verify Build Configuration (logged to console)
   │
4. Build Docker Images
   │ ├─ Backend (no build args needed)
   │ ├─ Chatbot (no build args needed)
   │ └─ Web Frontend (REQUIRES build args)
   │    ├─ Validate args (fail if missing)
   │    ├─ Log configuration
   │    ├─ Remove .env files
   │    └─ Build with ENV vars
   │
5. Push to GitHub Container Registry (GHCR)
   │ ├─ :staging or :production (mutable tag)
   │ └─ :staging-SHA or :production-SHA (immutable tag)
   │
6. Deploy to VPS
   │ ├─ SSH to server
   │ ├─ Pull latest code
   │ ├─ Pull Docker images (using SHA tags for reliability)
   │ ├─ Setup database
   │ ├─ Run docker-compose with proper env file
   │ └─ Health checks & smoke tests
   │
7. Deployment Summary (GitHub Actions summary)
```

---

### 🛡️ Best Practices for Next.js in Docker

#### ❌ DON'T:
```dockerfile
# Don't rely on .env files in Docker
COPY .env.local .  # Bad!

# Don't use runtime env for NEXT_PUBLIC_*
ENV NEXT_PUBLIC_API_URL=https://... # Too late!
```

#### ✅ DO:
```dockerfile
# Use build args
ARG NEXT_PUBLIC_BROWSER_API_URL
RUN if [ -z "$NEXT_PUBLIC_BROWSER_API_URL" ]; then exit 1; fi

# Set as ENV before build
ENV NEXT_PUBLIC_BROWSER_API_URL=$NEXT_PUBLIC_BROWSER_API_URL
RUN pnpm run build

# Remove .env files explicitly
RUN rm -f .env* 2>/dev/null || true
```

#### In GitHub Actions:
```yaml
# ❌ DON'T - Complex ternary in build-args
build-args: |
  NEXT_PUBLIC_API_URL=${{ env.name == 'prod' && 'https://prod.com' || 'https://staging.com' }}

# ✅ DO - Separate step to set vars
- name: Set URLs
  id: urls
  run: |
    if [ "$ENV" == "production" ]; then
      echo "api_url=https://prod.com" >> $GITHUB_OUTPUT
    else
      echo "api_url=https://staging.com" >> $GITHUB_OUTPUT
    fi

- name: Build
  build-args: |
    NEXT_PUBLIC_API_URL=${{ steps.urls.outputs.api_url }}
```

---

### 🧪 Testing Checklist Before Deployment

- [ ] Test Docker build locally with staging args
- [ ] Test Docker build locally with production args
- [ ] Verify build logs show correct URLs
- [ ] Run container and test API calls
- [ ] Check browser DevTools Network tab for API endpoints
- [ ] Commit and push changes
- [ ] Monitor GitHub Actions build logs
- [ ] Verify deployment on staging
- [ ] Test login flow on staging
- [ ] Only then deploy to production

---

### 📚 Key Concepts

**Build Time vs Runtime:**
- `NEXT_PUBLIC_*` variables → Build time (baked into JS bundle)
- Regular env variables → Runtime (server-side only)
- Docker ENV → Available at runtime but too late for NEXT_PUBLIC_*
- Docker ARG → Available at build time ✅

**Next.js Environment Priority:**
```
.env.local (highest)
  ↓
.env.production / .env.development
  ↓
.env
  ↓
ENV variables from Dockerfile
  ↓
Default values in code (lowest)
```

**Docker Build Context:**
- `.dockerignore` prevents files from being sent to Docker daemon
- But if `.env.local` is in Git (shouldn't be), it still gets sent
- Solution: Explicitly `rm -f .env*` in Dockerfile

---

### 🚨 Emergency Rollback

If deployment fails:

```bash
# SSH to server
ssh user@server

# Navigate to project
cd /opt/epr-saas

# Run rollback script
./infrastructure/scripts/rollback.sh staging
```

The rollback script will:
1. Stop current containers
2. Pull previous image version
3. Restart containers
4. Verify health

---

### 📞 Support

If issues persist:
1. Check GitHub Actions logs
2. Check Docker build logs on server: `docker logs epr-web-frontend`
3. Verify environment: `docker exec epr-web-frontend env`
4. Check this troubleshooting guide
5. Ask senior DevOps team
