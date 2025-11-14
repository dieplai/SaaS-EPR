# EPR Legal SaaS Platform

> **Production-grade microservices SaaS platform** với Golang, Python FastAPI, PostgreSQL (pgvector), Web (React), và Flutter (iOS-first)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8.svg)](https://golang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.16+-02569B.svg)](https://flutter.dev/)

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Getting Started](#getting-started)
- [Development Guide](#development-guide)
- [Deployment](#deployment)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTS                              │
├──────────────┬──────────────────┬──────────────────────────┤
│   Web App    │   iOS App        │   Android App            │
│   (React)    │   (Flutter)      │   (Flutter)              │
└──────┬───────┴────────┬─────────┴────────┬─────────────────┘
       │                │                  │
       │ HTTPS/JSON     │ HTTPS/JSON       │ HTTPS/JSON
       └────────────────┴──────────────────┘
                        │
       ┌────────────────▼──────────────────┐
       │      Cloudflare CDN + WAF         │
       │      - SSL/TLS                    │
       │      - DDoS Protection            │
       │      - Rate Limiting (IP-based)   │
       └────────────────┬──────────────────┘
                        │
       ┌────────────────▼──────────────────┐
       │    Nginx Reverse Proxy            │
       │    - Load Balancing               │
       │    - SSL Termination              │
       │    - Request Routing              │
       └────────────────┬──────────────────┘
                        │
┌───────────────────────▼────────────────────────────────────┐
│                  API GATEWAY (Golang/Gin)                  │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Responsibilities:                                │     │
│  │  - JWT Authentication                            │     │
│  │  - Rate Limiting (per user/package)             │     │
│  │  - Request Validation                           │     │
│  │  - Service Routing                              │     │
│  │  - Response Aggregation                         │     │
│  │  - Metrics Collection                           │     │
│  └──────────────────────────────────────────────────┘     │
└───────────────────────┬────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────┐
│ User Service │ │  Package   │ │  AI Chatbot    │
│  (Golang)    │ │  Service   │ │  (Python)      │
│              │ │  (Golang)  │ │                │
│ - Auth       │ │            │ │ - FastAPI      │
│ - Profile    │ │ - Plans    │ │ - RAG Pipeline │
│ - CRUD       │ │ - Quotas   │ │ - LlamaIndex   │
└───────┬──────┘ └─────┬──────┘ └─────┬──────────┘
        │              │              │
        └──────────────┴──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │    PostgreSQL 16            │
        │    ┌─────────────────┐      │
        │    │  pgvector       │      │
        │    │  (embeddings)   │      │
        │    └─────────────────┘      │
        │                             │
        │  Tables:                    │
        │  - users                    │
        │  - subscriptions            │
        │  - conversations            │
        │  - documents (+ vectors)    │
        │  - usage_quotas             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │       Redis 7                │
        │  - Session Cache            │
        │  - API Response Cache       │
        │  - Rate Limit Counters      │
        │  - Pub/Sub (real-time)      │
        └─────────────────────────────┘
```

### Design Patterns

- ✅ **Microservices Architecture** - Loose coupling, independent deployment
- ✅ **API Gateway Pattern** - Single entry point, centralized auth
- ✅ **Repository Pattern** - Data access abstraction
- ✅ **Clean Architecture** - Domain-driven design, testable
- ✅ **CQRS** - Command/Query separation for scalability
- ✅ **Circuit Breaker** - Fault tolerance
- ✅ **Event-Driven** - Async processing with Redis Pub/Sub

---

## 🛠️ Tech Stack

### Backend

**Golang Services:**
- **Framework:** Gin (high-performance HTTP router)
- **ORM:** GORM (database abstraction)
- **Auth:** JWT (golang-jwt/jwt)
- **Validation:** go-playground/validator
- **Database Driver:** pgx (PostgreSQL)
- **Redis Client:** go-redis

**Python AI Service:**
- **Framework:** FastAPI (async, high-performance)
- **RAG:** LlamaIndex (orchestration)
- **LLM:** OpenAI GPT-4
- **Vector:** pgvector (PostgreSQL extension)
- **Embeddings:** OpenAI text-embedding-3-small
- **Validation:** Pydantic v2

### Database

- **Primary:** PostgreSQL 16 with pgvector extension
- **Cache:** Redis 7
- **Vector Similarity:** HNSW index (pgvector)

### Frontend

**Web:**
- **Framework:** React 18 + Vite
- **State:** Zustand / Redux Toolkit
- **UI:** TailwindCSS + Shadcn/ui
- **API:** Axios with interceptors
- **Routing:** React Router v6

**Mobile:**
- **Framework:** Flutter 3.16+
- **State:** Riverpod / Bloc
- **UI:** Material 3 + Cupertino (iOS-optimized)
- **API:** Dio + Retrofit
- **Storage:** flutter_secure_storage

### DevOps

- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** Loki
- **Tracing:** Jaeger (OpenTelemetry)
- **Error Tracking:** Sentry

---

## 📁 Project Structure

```
epr-saas-platform/
├── backend/
│   ├── services/
│   │   ├── api-gateway/              # Entry point (Gin)
│   │   │   ├── cmd/
│   │   │   │   └── main.go           # App entrypoint
│   │   │   ├── internal/
│   │   │   │   ├── config/           # Configuration
│   │   │   │   ├── middleware/       # Auth, logging, rate limit
│   │   │   │   ├── handler/          # HTTP handlers
│   │   │   │   ├── service/          # Business logic
│   │   │   │   └── client/           # HTTP clients to other services
│   │   │   ├── pkg/                  # Public packages
│   │   │   │   ├── jwt/              # JWT utilities
│   │   │   │   └── response/         # Response helpers
│   │   │   ├── Dockerfile
│   │   │   ├── go.mod
│   │   │   └── Makefile
│   │   │
│   │   ├── user-service/             # User management (Gin + GORM)
│   │   │   ├── cmd/
│   │   │   │   └── main.go
│   │   │   ├── internal/
│   │   │   │   ├── domain/           # Entities (User, Profile)
│   │   │   │   ├── repository/       # Database access layer
│   │   │   │   │   ├── postgres/     # PostgreSQL implementation
│   │   │   │   │   └── interface.go  # Repository interface
│   │   │   │   ├── usecase/          # Business logic
│   │   │   │   │   ├── auth.go       # Login, register, JWT
│   │   │   │   │   └── user.go       # CRUD operations
│   │   │   │   └── delivery/         # Delivery layer
│   │   │   │       └── http/         # HTTP handlers
│   │   │   │           ├── handler.go
│   │   │   │           ├── middleware.go
│   │   │   │           └── router.go
│   │   │   ├── migrations/           # Database migrations
│   │   │   │   ├── 000001_create_users.up.sql
│   │   │   │   └── 000001_create_users.down.sql
│   │   │   ├── tests/
│   │   │   │   ├── unit/
│   │   │   │   └── integration/
│   │   │   ├── Dockerfile
│   │   │   └── go.mod
│   │   │
│   │   ├── package-service/          # Subscription management
│   │   │   ├── cmd/
│   │   │   ├── internal/
│   │   │   │   ├── domain/           # Package, Subscription, Quota
│   │   │   │   ├── repository/
│   │   │   │   ├── usecase/
│   │   │   │   │   ├── package.go    # Package CRUD
│   │   │   │   │   ├── subscription.go # Subscribe, upgrade
│   │   │   │   │   └── quota.go      # Quota checking
│   │   │   │   └── delivery/http/
│   │   │   ├── Dockerfile
│   │   │   └── go.mod
│   │   │
│   │   └── ai-chatbot/               # AI service (Python FastAPI)
│   │       ├── app/
│   │       │   ├── main.py           # FastAPI app
│   │       │   ├── api/
│   │       │   │   └── v1/
│   │       │   │       ├── __init__.py
│   │       │   │       ├── chat.py   # Chat endpoints
│   │       │   │       └── health.py # Health check
│   │       │   ├── core/
│   │       │   │   ├── config.py     # Settings (Pydantic)
│   │       │   │   └── dependencies.py # FastAPI dependencies
│   │       │   ├── services/
│   │       │   │   ├── rag/
│   │       │   │   │   ├── retriever.py # Vector search
│   │       │   │   │   ├── llm.py       # LLM client
│   │       │   │   │   └── pipeline.py  # RAG orchestration
│   │       │   │   ├── conversation/
│   │       │   │   │   └── memory.py    # Conversation history
│   │       │   │   └── faq/
│   │       │   │       └── matcher.py   # FAQ matching
│   │       │   ├── models/
│   │       │   │   ├── database.py      # SQLAlchemy models
│   │       │   │   └── schemas.py       # Pydantic schemas
│   │       │   └── utils/
│   │       │       ├── database.py      # DB connection
│   │       │       └── cache.py         # Redis cache
│   │       ├── tests/
│   │       │   ├── test_rag.py
│   │       │   └── test_api.py
│   │       ├── requirements.txt
│   │       ├── Dockerfile
│   │       └── pyproject.toml
│   │
│   ├── shared/                        # Shared code between services
│   │   └── proto/                     # gRPC proto files (future)
│   │
│   └── database/
│       ├── migrations/                # Global migrations
│       │   ├── 000001_init_schema.sql
│       │   ├── 000002_add_pgvector.sql
│       │   └── 000003_seed_packages.sql
│       └── seeds/
│           └── dev_data.sql
│
├── web/                               # React web app
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   └── InputBox.tsx
│   │   │   └── ui/                    # Shadcn components
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Chat.tsx
│   │   ├── services/
│   │   │   └── api/
│   │   │       ├── client.ts          # Axios instance
│   │   │       ├── auth.ts
│   │   │       ├── chat.ts
│   │   │       └── user.ts
│   │   ├── stores/                    # State management
│   │   │   ├── authStore.ts
│   │   │   └── chatStore.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useChat.ts
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── mobile/                            # Flutter app (iOS-first)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── core/
│   │   │   ├── config/
│   │   │   │   └── app_config.dart
│   │   │   ├── network/
│   │   │   │   ├── api_client.dart    # Dio client
│   │   │   │   └── interceptors.dart  # Auth, logging
│   │   │   ├── theme/
│   │   │   │   ├── app_theme.dart
│   │   │   │   ├── colors.dart
│   │   │   │   └── typography.dart
│   │   │   └── utils/
│   │   │       ├── secure_storage.dart
│   │   │       └── validators.dart
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── data/
│   │   │   │   │   ├── models/
│   │   │   │   │   ├── repositories/
│   │   │   │   │   └── datasources/
│   │   │   │   ├── domain/
│   │   │   │   │   ├── entities/
│   │   │   │   │   └── usecases/
│   │   │   │   └── presentation/
│   │   │   │       ├── pages/
│   │   │   │       │   ├── login_page.dart
│   │   │   │       │   └── register_page.dart
│   │   │   │       ├── widgets/
│   │   │   │       └── providers/      # Riverpod
│   │   │   ├── chat/
│   │   │   │   ├── data/
│   │   │   │   ├── domain/
│   │   │   │   └── presentation/
│   │   │   │       ├── pages/
│   │   │   │       │   └── chat_page.dart
│   │   │   │       └── widgets/
│   │   │   │           ├── message_bubble.dart
│   │   │   │           └── chat_input.dart
│   │   │   └── profile/
│   │   ├── shared/
│   │   │   ├── widgets/
│   │   │   │   ├── loading_indicator.dart
│   │   │   │   └── error_widget.dart
│   │   │   └── constants/
│   │   └── routes/
│   │       └── app_router.dart
│   ├── android/
│   ├── ios/
│   ├── test/
│   ├── pubspec.yaml
│   └── Dockerfile (for building)
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml         # Local development
│   │   ├── docker-compose.prod.yml    # Production
│   │   └── docker-compose.monitoring.yml
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── sites/
│   │       ├── api.conf
│   │       └── app.conf
│   ├── terraform/                     # IaC (optional)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── scripts/
│       ├── setup-vps.sh               # VPS initial setup
│       ├── deploy.sh                  # Deployment script
│       ├── backup.sh                  # Database backup
│       └── restore.sh                 # Database restore
│
├── docs/
│   ├── api/
│   │   └── openapi.yaml               # API documentation
│   ├── architecture/
│   │   ├── diagrams/
│   │   └── adr/                       # Architecture Decision Records
│   └── guides/
│       ├── development.md
│       └── deployment.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                     # CI pipeline
│       ├── cd-production.yml          # CD pipeline
│       └── security-scan.yml
│
├── .gitignore
├── .env.example
├── Makefile                           # Root commands
├── README.md                          # This file
└── LICENSE
```

---

## 🔄 Data Flow

### 1. Authentication Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ POST /v1/auth/login
     │ {email, password}
     ▼
┌────────────────┐
│  API Gateway   │
│  - Validate    │
└────┬───────────┘
     │
     │ Forward to User Service
     ▼
┌────────────────┐
│  User Service  │
│  1. Find user  │
│  2. Check pwd  │
│  3. Gen JWT    │
└────┬───────────┘
     │
     │ JWT tokens
     ▼
┌────────────────┐
│  Redis Cache   │
│  Store refresh │
│  token         │
└────┬───────────┘
     │
     │ Return tokens
     ▼
┌──────────┐
│  Client  │
│  Store in│
│  storage │
└──────────┘
```

### 2. Chat Query Flow (RAG Pipeline)

```
┌──────────┐
│  Client  │
│  "EPR là │
│   gì?"   │
└────┬─────┘
     │
     │ POST /v1/chat/query
     │ Authorization: Bearer <token>
     ▼
┌─────────────────┐
│  API Gateway    │
│  1. Verify JWT  │
│  2. Rate limit  │
└────┬────────────┘
     │
     │ Check quota
     ▼
┌──────────────────┐
│ Package Service  │
│ - Get quota      │
│ - Check limit    │
│ - Increment      │
└────┬─────────────┘
     │ ✅ Quota OK
     │
     │ Forward to AI Chatbot
     ▼
┌─────────────────────────────────────────┐
│         AI Chatbot Service              │
│                                         │
│  1. Save user message to DB             │
│     ┌──────────────────────────┐       │
│     │ PostgreSQL               │       │
│     │ INSERT INTO conversations│       │
│     └──────────────────────────┘       │
│                                         │
│  2. Generate embedding                  │
│     ┌──────────────────────────┐       │
│     │ OpenAI Embeddings API    │       │
│     │ text-embedding-3-small   │       │
│     └──────────────────────────┘       │
│                                         │
│  3. Vector similarity search            │
│     ┌──────────────────────────┐       │
│     │ PostgreSQL pgvector      │       │
│     │ SELECT ... FROM documents│       │
│     │ ORDER BY embedding <=>   │       │
│     │ '[query_embedding]'      │       │
│     │ LIMIT 5                  │       │
│     └──────────────────────────┘       │
│                                         │
│  4. Build context                       │
│     - Retrieved documents               │
│     - Conversation history (last 5)     │
│     - System prompt                     │
│                                         │
│  5. LLM generation                      │
│     ┌──────────────────────────┐       │
│     │ OpenAI GPT-4             │       │
│     │ Generate answer          │       │
│     └──────────────────────────┘       │
│                                         │
│  6. Save assistant message              │
│     ┌──────────────────────────┐       │
│     │ PostgreSQL               │       │
│     │ INSERT conversation      │       │
│     └──────────────────────────┘       │
│                                         │
│  7. Cache response (optional)           │
│     ┌──────────────────────────┐       │
│     │ Redis                    │       │
│     │ SETEX query:hash answer  │       │
│     └──────────────────────────┘       │
└─────────────────┬───────────────────────┘
                  │
                  │ Return answer + sources
                  ▼
            ┌──────────┐
            │  Client  │
            │  Display │
            └──────────┘
```

### 3. Subscription Management Flow

```
┌──────────┐
│  Client  │
│  Upgrade │
│  to Pro  │
└────┬─────┘
     │
     │ POST /v1/subscriptions
     │ {package_id: "pro"}
     ▼
┌─────────────────┐
│  API Gateway    │
│  - Auth check   │
└────┬────────────┘
     │
     ▼
┌──────────────────────────────────┐
│     Package Service              │
│                                  │
│  BEGIN TRANSACTION;              │
│                                  │
│  1. Get current subscription     │
│     SELECT * FROM subscriptions  │
│     WHERE user_id = $1;          │
│                                  │
│  2. Calculate pro-rated amount   │
│     (if mid-cycle upgrade)       │
│                                  │
│  3. Update subscription          │
│     UPDATE subscriptions         │
│     SET package_id = $2,         │
│         status = 'active'        │
│     WHERE user_id = $1;          │
│                                  │
│  4. Update quota                 │
│     UPDATE usage_quotas          │
│     SET queries_limit = 1000     │
│     WHERE user_id = $1;          │
│                                  │
│  5. Log analytics event          │
│     INSERT INTO analytics_events │
│     (type: 'subscription_upgrade')│
│                                  │
│  COMMIT;                         │
└──────────────────────────────────┘
     │
     │ Success response
     ▼
┌──────────┐
│  Client  │
│  Show    │
│  success │
└──────────┘
```

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
- Docker Desktop 4.x+
- Git
- 8GB+ RAM

# For local development (optional)
- Golang 1.22+
- Python 3.11+
- Node.js 18+
- Flutter 3.16+
```

### Quick Start (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/epr-saas-platform.git
cd epr-saas-platform

# 2. Setup environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Start infrastructure
make infra-up
# Starts: PostgreSQL, Redis

# 4. Run migrations
make migrate-up

# 5. Start services
make dev
# Starts: API Gateway, User Service, Package Service, AI Chatbot

# 6. Verify
make health
```

### Access Points

```
API Gateway:     http://localhost:8000
User Service:    http://localhost:8001
Package Service: http://localhost:8002
AI Chatbot:      http://localhost:8004
Web App:         http://localhost:3000
PostgreSQL:      localhost:5432
Redis:           localhost:6379
```

---

## 💻 Development Guide

### Backend Development (Golang)

```bash
# Create new service
make service-new NAME=payment-service

# Run service locally
cd backend/services/user-service
make dev

# Run tests
make test

# Generate mocks
make mock
```

### Backend Development (Python)

```bash
# Setup virtual environment
cd backend/services/ai-chatbot
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run with hot reload
uvicorn app.main:app --reload --port 8004

# Run tests
pytest
```

### Frontend Development (Web)

```bash
cd web
npm install
npm run dev
```

### Mobile Development (Flutter)

```bash
cd mobile

# Get dependencies
flutter pub get

# Run on iOS simulator
flutter run -d ios

# Run on Android emulator
flutter run -d android

# Build for iOS
flutter build ios --release
```

### Database Migrations

```bash
# Create new migration
make migrate-create NAME=add_user_avatar

# Apply migrations
make migrate-up

# Rollback
make migrate-down

# Reset database (⚠️ deletes all data)
make migrate-reset
```

---

## 📊 Monitoring

### Metrics (Prometheus + Grafana)

```bash
# Start monitoring stack
make monitoring-up

# Access Grafana
open http://localhost:3000
# Login: admin / admin
```

**Key Metrics:**
- Request rate, latency (p50, p95, p99)
- Error rate
- Database connections
- Redis cache hit rate
- OpenAI API costs

### Logging

```bash
# View logs
make logs

# Follow logs
make logs-follow

# Service-specific logs
make logs SERVICE=ai-chatbot
```

---

## 🔐 Security

### Authentication

- JWT tokens (access: 15 mins, refresh: 7 days)
- Refresh token rotation
- Secure HTTP-only cookies (web)
- flutter_secure_storage (mobile)

### Rate Limiting

- IP-based: 100 req/min (Cloudflare)
- User-based: Based on package tier
- API key rate limits (for API access)

### Data Protection

- Passwords: bcrypt hashing
- Secrets: Environment variables
- SQL injection: Parameterized queries
- XSS: Input sanitization

---

## 🚢 Deployment

### VPS Deployment (Recommended)

```bash
# Setup VPS (first time only)
make vps-setup HOST=your-vps-ip

# Deploy
make deploy-production
```

### Docker Deployment

```bash
# Build images
make build-all

# Push to registry
make push-all

# Pull and run on server
ssh deploy@vps "cd ~/epr-saas && docker compose -f docker-compose.prod.yml up -d"
```

---

## 📱 Mobile App Specifics

### iOS Optimization

**Performance:**
- Preload chat screen
- Image caching
- Lazy loading
- Background fetch for notifications

**UI/UX:**
- Native iOS navigation
- Cupertino widgets
- Haptic feedback
- Dark mode support
- Dynamic Type (accessibility)

**Build:**
```bash
# iOS release build
flutter build ipa --release

# Submit to App Store
# (requires Apple Developer account)
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

## 📧 Contact

- **Author:** Your Name
- **Email:** your.email@example.com
- **GitHub:** [@yourusername](https://github.com/yourusername)

---

**Built with ❤️ for learning and production use**
