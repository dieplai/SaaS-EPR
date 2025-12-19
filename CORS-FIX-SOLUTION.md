# CORS Fix - Root Cause Solution

## 🎯 Root Cause Analysis

### Problem:
Browser requests from `https://staging.epr.dieplai.io.vn` were being **blocked by CORS** with error:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:8001/api/v1/users/profile
```

### Real Root Cause (NOT build args!):

**Backend CORS middleware only allows localhost origins:**

```go
// backend/internal/identity/presentation/http/middleware/error_handler.go
allowedOrigins := os.getenv("CORS_ALLOWED_ORIGINS")
if allowedOrigins == "" {
    // DEFAULT: Only localhost! ❌
    allowedOrigins = "http://localhost:3000,http://localhost:3001,..."
}

// Check if request origin is in whitelist
if origin != "" && isOriginAllowed(origin, allowedOrigins) {
    c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
    c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
} else {
    // REJECT! No CORS headers → Browser blocks request
}
```

**When deployed to staging/production:**
- Browser sends: `Origin: https://staging.epr.dieplai.io.vn`
- Backend checks whitelist: Only has `localhost` URLs
- Backend **does NOT set CORS headers**
- Browser **blocks the response** → CORS error!

---

## ✅ Solution - Update CORS Whitelist

### What We Fixed:

Added `CORS_ALLOWED_ORIGINS` and `CORS_ORIGINS` to environment templates:

**For Backend (Go - uses `CORS_ALLOWED_ORIGINS`):**
```bash
# infrastructure/.env.staging.template
CORS_ALLOWED_ORIGINS=https://staging.epr.dieplai.io.vn,http://staging.epr.dieplai.io.vn,http://localhost:3000

# infrastructure/.env.prod.template
CORS_ALLOWED_ORIGINS=https://epr.dieplai.io.vn,http://epr.dieplai.io.vn
```

**For Chatbot (Python - uses `CORS_ORIGINS`):**
```bash
# infrastructure/.env.staging.template
CORS_ORIGINS=https://staging.epr.dieplai.io.vn,http://staging.epr.dieplai.io.vn,http://localhost:3000

# infrastructure/.env.prod.template
CORS_ORIGINS=https://epr.dieplai.io.vn,http://epr.dieplai.io.vn
```

**Why both HTTP and HTTPS?**
- During development/testing, you might access via HTTP
- Production should only use HTTPS (but HTTP fallback for compatibility)

**Why include localhost in staging?**
- Allows local development/testing against staging backend
- Remove if security is a concern

---

## 🚀 Deployment Steps

### 1. Commit Changes
```bash
git add infrastructure/.env.staging.template infrastructure/.env.prod.template
git commit -m "fix(cors): Add production/staging URLs to CORS whitelist

ROOT CAUSE:
- Backend CORS middleware only allowed localhost origins
- Requests from staging/production domains were rejected
- Browser blocked responses due to missing CORS headers

SOLUTION:
- Add CORS_ALLOWED_ORIGINS for backend (Go)
- Add CORS_ORIGINS for chatbot (Python FastAPI)
- Include both HTTP and HTTPS for compatibility
- Separate configs for staging vs production

This fixes CORS errors without needing to rebuild frontend.
Only backend/chatbot need restart to load new env vars.
"

git push origin main
```

### 2. CI/CD Auto-Deploy
GitHub Actions will automatically:
1. Build images (no changes needed - backend code unchanged)
2. Deploy to staging
3. Generate new `.env.staging` file with CORS vars
4. Restart containers with new environment

### 3. Verify Deployment
After deployment completes (~5 minutes):

```bash
# SSH to staging server
ssh user@staging-server

# Check backend environment
docker exec epr-backend env | grep CORS_ALLOWED_ORIGINS
# Should show: CORS_ALLOWED_ORIGINS=https://staging.epr.dieplai.io.vn,...

# Check chatbot environment
docker exec epr-ai-chatbot-api env | grep CORS_ORIGINS
# Should show: CORS_ORIGINS=https://staging.epr.dieplai.io.vn,...

# Check backend logs for CORS headers
docker logs epr-backend --tail 50 | grep "Access-Control"
```

### 4. Test in Browser
1. Open `https://staging.epr.dieplai.io.vn`
2. Open DevTools → Network tab
3. Try to login
4. Check response headers:
   ```
   ✅ Access-Control-Allow-Origin: https://staging.epr.dieplai.io.vn
   ✅ Access-Control-Allow-Credentials: true
   ```

5. Should NOT see CORS errors anymore!

---

## 🔍 Why This is Better Than Build Args Fix

### Previous Approach (Fixing build args):
- ❌ Problem: Frontend was calling `localhost:8001` instead of production URL
- ❌ Solution: Fix `NEXT_PUBLIC_BROWSER_API_URL` build args
- ❌ Issue: **This was only a symptom, not root cause!**
- ❌ Even with correct URLs, CORS would still block requests

### Current Approach (Fixing CORS whitelist):
- ✅ **Addresses real root cause**: Backend rejecting cross-origin requests
- ✅ **No frontend rebuild needed**: Only backend config change
- ✅ **Faster deployment**: Just restart containers, no image rebuild
- ✅ **More maintainable**: Clear separation of concerns
- ✅ **Proper fix**: CORS is the actual blocker, not URL misconfiguration

---

## 📋 How CORS Works (Simplified)

```
┌──────────────┐
│   BROWSER    │
│ (staging URL)│
└──────┬───────┘
       │ 1. Request with Origin header
       │    Origin: https://staging.epr.dieplai.io.vn
       │    credentials: 'include'
       │
       ▼
┌─────────────────────┐
│   BACKEND (Go)      │
│   CORS Middleware   │
├─────────────────────┤
│ 2. Check whitelist  │
│                     │
│ IF origin in        │
│ CORS_ALLOWED_ORIGINS│
│   → Set headers ✅   │
│ ELSE                │
│   → No headers ❌    │
└──────┬──────────────┘
       │ 3. Response
       │    Access-Control-Allow-Origin: https://staging.epr.dieplai.io.vn
       │    Access-Control-Allow-Credentials: true
       │
       ▼
┌──────────────┐
│   BROWSER    │
│ (staging URL)│
├──────────────┤
│ 4. Browser    │
│    checks     │
│    CORS       │
│    headers    │
│              │
│ IF headers   │
│   present ✅  │
│   → Allow    │
│ ELSE ❌       │
│   → Block    │
└──────────────┘
```

---

## 🛡️ Security Considerations

### Why Not Use Wildcard (`*`)?
```go
// ❌ INSECURE - Don't do this!
c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
```

**Problem:** Browsers **reject** wildcard with credentials:
> `Access-Control-Allow-Origin: *` is not allowed when `Access-Control-Allow-Credentials: true`

**Why?** Security! Wildcard would allow ANY website to:
- Send authenticated requests with user's cookies
- Read sensitive user data
- Perform actions on user's behalf

### Our Approach (Whitelist):
```go
// ✅ SECURE - Explicit whitelist
allowedOrigins := "https://staging.epr.dieplai.io.vn,https://epr.dieplai.io.vn"

if isOriginAllowed(origin, allowedOrigins) {
    // Only set CORS headers if origin is trusted
    c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
    c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
}
```

**Benefits:**
- ✅ Only trusted origins can make authenticated requests
- ✅ Prevents CSRF attacks from malicious websites
- ✅ Works with HTTP-only cookies (credentials: 'include')
- ✅ Complies with browser security policies

---

## 📊 Before vs After

### Before (CORS Blocked):
```
Browser Request:
  Origin: https://staging.epr.dieplai.io.vn
  credentials: 'include'
      ↓
Backend Response:
  (No CORS headers because origin not in whitelist)
      ↓
Browser:
  ❌ CORS Error: "Cross-Origin Request Blocked"
  ❌ Cannot read response
  ❌ Cookies not sent/received
```

### After (CORS Allowed):
```
Browser Request:
  Origin: https://staging.epr.dieplai.io.vn
  credentials: 'include'
      ↓
Backend Response:
  Access-Control-Allow-Origin: https://staging.epr.dieplai.io.vn
  Access-Control-Allow-Credentials: true
  Set-Cookie: accessToken=...; HttpOnly
      ↓
Browser:
  ✅ CORS headers valid
  ✅ Response readable
  ✅ Cookies stored and sent automatically
```

---

## 🧪 Testing Checklist

After deployment:

- [ ] Login works without CORS errors
- [ ] Response headers include `Access-Control-Allow-Origin`
- [ ] Response headers include `Access-Control-Allow-Credentials: true`
- [ ] Cookies are set (check Application → Cookies in DevTools)
- [ ] Authenticated requests include cookies automatically
- [ ] Backend logs show correct CORS headers being set
- [ ] Chatbot API calls work (if using chat feature)
- [ ] No console errors related to CORS
- [ ] Can logout successfully

---

## 🔄 Rollback Plan

If issues occur:

### Option 1: Add localhost temporarily
```bash
# SSH to server
ssh user@staging-server

# Edit .env.staging (quick fix)
nano .env.staging

# Add localhost to CORS list
CORS_ALLOWED_ORIGINS=https://staging.epr.dieplai.io.vn,http://localhost:3000

# Restart backend
docker restart epr-backend
docker restart epr-ai-chatbot-api
```

### Option 2: Revert commit
```bash
git revert <commit-sha>
git push origin main
# Wait for CI/CD to redeploy
```

---

## 📚 Related Files

- `backend/internal/identity/presentation/http/middleware/error_handler.go` - Backend CORS implementation
- `backend/services/epr-chatbot-service/fastapi_server.py` - Chatbot CORS implementation
- `infrastructure/.env.staging.template` - Staging environment template
- `infrastructure/.env.prod.template` - Production environment template
- `web/src/lib/api.ts` - Frontend API client (uses `credentials: 'include'`)

---

## ✅ Summary

**Problem:** CORS blocking requests from production/staging domains

**Root Cause:** Backend CORS whitelist only included localhost URLs

**Solution:** Add production/staging URLs to CORS whitelist via environment variables

**Benefits:**
- ✅ Fixes real root cause, not just symptoms
- ✅ No frontend rebuild needed
- ✅ Fast deployment (restart containers only)
- ✅ Secure (whitelist approach, not wildcard)
- ✅ Maintainable (environment-based configuration)

**Deployment:** Just push to Git, CI/CD handles the rest!
