# User Service

Service quản lý authentication và user profiles cho EPR SaaS Platform.

## 📁 Cấu trúc project

```
user-service/
├── cmd/
│   └── main.go                 # Entry point
├── internal/
│   ├── config/                 # Configuration management
│   │   └── config.go
│   ├── domain/                 # Business entities
│   │   └── user.go
│   ├── repository/             # Data access layer
│   │   ├── interface.go
│   │   └── postgres/
│   │       ├── user_repository.go
│   │       └── refresh_token_repository.go
│   ├── usecase/                # Business logic
│   │   └── auth_usecase.go
│   └── delivery/               # HTTP handlers
│       └── http/
│           ├── handler.go
│           └── middleware.go
├── go.mod
├── go.sum
└── .env.example
```

## 🏗️ Architecture - Clean Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      HTTP Request                        │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              DELIVERY LAYER (HTTP)                       │
│  - handlers (Gin controllers)                           │
│  - middleware (JWT, CORS, Logger)                       │
│  - HTTP-specific logic                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 USE CASE LAYER                           │
│  - Business logic                                        │
│  - Authentication flows (Register, Login, Refresh)      │
│  - Token management                                     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              REPOSITORY LAYER                            │
│  - Database queries (GORM)                              │
│  - PostgreSQL operations                                │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 DOMAIN LAYER                             │
│  - Entities (User, RefreshToken)                        │
│  - Business rules (password hashing, validation)        │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Cách chạy

### Option 1: Chạy với Docker (Recommended)

**Bước 1: Build và start tất cả services**
```bash
cd backend/services/user-service

# Start tất cả services (PostgreSQL + Redis + User Service)
make docker-up

# Hoặc dùng docker compose trực tiếp
docker compose up -d
```

**Bước 2: Check logs**
```bash
# View logs của user-service
make docker-logs

# View logs của tất cả services
make docker-logs-all
```

**Bước 3: Test API**
```bash
# Health check
make api-health

# Register user
make api-register

# Login
make api-login
```

**Các lệnh Docker hữu ích:**
```bash
make docker-ps          # List containers
make docker-restart     # Restart services
make docker-down        # Stop all services
make docker-rebuild     # Rebuild user-service
make db-shell          # Connect to PostgreSQL
```

---

### Option 2: Chạy local (Development)

**1. Cài đặt dependencies**
```bash
cd backend/services/user-service
make install
```

**2. Setup database**

Đảm bảo PostgreSQL đã chạy và tạo database:

```bash
psql -U postgres
CREATE DATABASE epr_saas;
\q
```

**3. Copy và config .env**
```bash
cp .env.example .env
# Edit .env với config của bạn
```

**Quan trọng:** Đổi `JWT_SECRET` trong production!

**4. Chạy service**
```bash
make run
# Hoặc: go run cmd/main.go
```

Server sẽ chạy tại: `http://localhost:8001`

## 📚 API Endpoints

### Public Endpoints (không cần authentication)

#### 1. Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "user-service",
  "version": "1.0.0"
}
```

#### 2. Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+84123456789",
  "company_name": "ABC Corp"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "is_active": true,
      "is_verified": false
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900
  }
}
```

#### 3. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 4. Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Protected Endpoints (cần authentication)

**Header:** `Authorization: Bearer <access_token>`

#### 5. Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 6. Logout All (logout from all devices)
```http
POST /api/v1/auth/logout-all
Authorization: Bearer <access_token>
```

#### 7. Get Current User
```http
GET /api/v1/users/me
Authorization: Bearer <access_token>
```

## 🔐 JWT Tokens

### Access Token
- **Expiration:** 15 minutes
- **Purpose:** Authenticate API requests
- **Format:** JWT with claims (user_id, email)

### Refresh Token
- **Expiration:** 7 days
- **Purpose:** Generate new access tokens
- **Storage:** Saved in database for revocation

### Token Flow

```
1. Login → Receive access_token + refresh_token
2. Use access_token for API calls
3. Access token expires (15 min) → Use refresh_token to get new access_token
4. Refresh token expires (7 days) → Login again
```

## 🧪 Testing với curl

### Register
```bash
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Profile (với token)
```bash
curl -X GET http://localhost:8001/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🛠️ Technologies

- **Framework:** Gin Web Framework
- **ORM:** GORM
- **Database:** PostgreSQL
- **Authentication:** JWT (golang-jwt)
- **Password Hashing:** bcrypt
- **UUID:** google/uuid

## 📝 TODO

- [ ] Add email verification
- [ ] Add password reset flow
- [ ] Add rate limiting with Redis
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add API documentation (Swagger)
- [ ] Add metrics (Prometheus)
- [ ] Add distributed tracing (Jaeger)

## 🔒 Security Features

✅ Password hashing với bcrypt (cost 10)
✅ JWT với expiration
✅ Refresh token rotation
✅ Soft delete (user data không bị xóa vĩnh viễn)
✅ GORM parameterized queries (SQL injection safe)
✅ Generic error messages (không leak info)
✅ CORS configured
✅ Token revocation (logout)

## 🐛 Debug

### Enable GORM SQL logging
```go
// In config.go
gormLogger := logger.Default.LogMode(logger.Info)
```

### Check database connection
```bash
psql -U postgres -d epr_saas -c "SELECT * FROM users;"
```

### View logs
Service sẽ log tất cả requests với format:
```
2025-01-12 14:30:45 | POST | /api/v1/auth/login | 200 | 45ms | 192.168.1.1
```
