# 🎓 EPR SaaS Learning Project - Setup Guide

## 🎯 Mục Tiêu Học
Xây dựng hệ thống SaaS microservices với:
- **Golang** microservices (API Gateway, User, Package, Payment)
- **Python FastAPI** cho AI Chatbot
- **PostgreSQL** + **Redis** + **Weaviate**
- **Ollama** (local LLM miễn phí)
- **Docker Compose** orchestration
- **Prometheus + Grafana** monitoring

**100% MIỄN PHÍ** - Chạy hoàn toàn trên local

---

## ⚙️ Yêu Cầu Hệ Thống

### Phần Cứng
- **RAM:** 8GB minimum, 16GB recommended
- **Disk:** 20GB free space
- **CPU:** 4 cores+ (cho Ollama LLM)

### Phần Mềm
```bash
# Bắt buộc:
✅ Docker Desktop 4.x+
✅ Git
✅ VS Code / Cursor (IDE)

# Auto-install qua Docker:
✅ Golang 1.22+
✅ Python 3.11+
✅ PostgreSQL 16
✅ Redis 7
✅ Weaviate 1.24+
```

---

## 🚀 Quick Start (10 phút)

### 1. Clone & Setup
```bash
cd /home/dieplai/Documents/luanvan

# Tạo cấu trúc project mới
mkdir -p epr-saas-learning
cd epr-saas-learning

# Download docker-compose
curl -o docker-compose.yml https://raw.githubusercontent.com/[YOUR_REPO]/docker-compose.yml

# Copy env template
cp .env.example .env

# Start tất cả services
docker compose up -d
```

### 2. Verify Services
```bash
# Check tất cả containers đang chạy
docker compose ps

# Expected output:
# api-gateway     ✓ Running on :8000
# user-service    ✓ Running on :8001
# package-service ✓ Running on :8002
# payment-service ✓ Running on :8003
# ai-chatbot      ✓ Running on :8004
# postgres        ✓ Running on :5432
# redis           ✓ Running on :6379
# weaviate        ✓ Running on :8080
# ollama          ✓ Running on :11434
# prometheus      ✓ Running on :9090
# grafana         ✓ Running on :3000
```

### 3. Seed Database
```bash
# Run migrations + seed data
docker compose exec postgres psql -U postgres -d epr_saas -f /migrations/schema.sql
docker compose exec postgres psql -U postgres -d epr_saas -f /seeds/dev_data.sql

# Verify users created
docker compose exec postgres psql -U postgres -d epr_saas -c "SELECT email, full_name FROM users;"
```

### 4. Test API
```bash
# Health check
curl http://localhost:8000/health

# Register user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Chat với AI (sử dụng token từ login)
curl -X POST http://localhost:8000/api/v1/chat/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "EPR là gì?"
  }'
```

### 5. Access Dashboards
```bash
# Grafana (monitoring)
open http://localhost:3000
# Login: admin / admin

# Prometheus (metrics)
open http://localhost:9090

# Jaeger (tracing)
open http://localhost:16686

# Weaviate Console
open http://localhost:8080/v1/schema
```

---

## 📚 Learning Path (Lộ Trình Học)

### **Week 1-2: Golang Basics + API Gateway**
**Mục tiêu:** Hiểu Golang, build API Gateway

```bash
# Study materials:
- Tour of Go: https://go.dev/tour/
- Fiber docs: https://docs.gofiber.io/
- JWT in Go: https://github.com/golang-jwt/jwt

# Tasks:
✅ Setup Golang environment
✅ Learn Go syntax, goroutines, channels
✅ Build simple Fiber server
✅ Implement JWT middleware
✅ Add rate limiting
✅ Test với Postman/Insomnia
```

**Code Location:**
```
api-gateway/
├── cmd/main.go              # Start here
├── internal/middleware/     # Study middleware pattern
└── internal/router/         # Study routing
```

**Learning Exercise:**
- [ ] Add new middleware: `LogRequest()`
- [ ] Implement CORS properly
- [ ] Add request ID tracking
- [ ] Write unit tests

---

### **Week 3-4: User Service (Golang + PostgreSQL)**
**Mục tiêu:** CRUD operations, database, clean architecture

```bash
# Study materials:
- GORM docs: https://gorm.io/docs/
- Clean Architecture: Uncle Bob
- Repository Pattern

# Tasks:
✅ Learn GORM (ORM cho Golang)
✅ Understand migrations
✅ Implement repository pattern
✅ Build user CRUD handlers
✅ Password hashing (bcrypt)
✅ Input validation
```

**Code Location:**
```
services/user-service/
├── internal/
│   ├── handler/     # HTTP handlers (controller)
│   ├── service/     # Business logic
│   ├── repository/  # Database access
│   └── model/       # Data models
```

**Learning Exercise:**
- [ ] Add email verification flow
- [ ] Implement "forgot password"
- [ ] Add user profile upload (MinIO)
- [ ] Write integration tests

---

### **Week 5-6: Package & Subscription Service**
**Mục tiêu:** Business logic phức tạp, quotas, billing

```bash
# Study materials:
- Subscription patterns
- Quota management
- State machines

# Tasks:
✅ Design subscription state machine
✅ Implement package management
✅ Build quota checking logic
✅ Handle upgrades/downgrades
✅ Scheduled tasks (check expiry)
```

**Code Location:**
```
services/package-service/
├── internal/
│   ├── quota/       # Quota engine
│   ├── billing/     # Billing logic
│   └── scheduler/   # Cron jobs
```

**Learning Exercise:**
- [ ] Add promo codes
- [ ] Implement usage alerts
- [ ] Create billing webhooks
- [ ] Generate invoices (PDF)

---

### **Week 7-8: Python FastAPI + AI Service**
**Mục tiêu:** Refactor chatbot sang FastAPI, integrate Ollama

```bash
# Study materials:
- FastAPI docs: https://fastapi.tiangolo.com/
- Ollama docs: https://ollama.ai/docs
- LangChain/LlamaIndex

# Tasks:
✅ Migrate Flask → FastAPI
✅ Add async/await everywhere
✅ Integrate Ollama local LLM
✅ Implement streaming responses
✅ Add model switching (Ollama/OpenAI)
✅ Optimize RAG pipeline
```

**Code Location:**
```
services/ai-chatbot/app/
├── main.py                 # FastAPI app
├── api/routes/             # API endpoints
├── services/
│   ├── llm/
│   │   ├── ollama_client.py    # Local LLM
│   │   └── openai_client.py    # Cloud LLM
│   ├── rag/
│   │   ├── retriever.py
│   │   └── embeddings.py
│   └── conversation/
│       └── memory.py
```

**Learning Exercise:**
- [ ] Add conversation export
- [ ] Implement feedback system (thumbs up/down)
- [ ] Add streaming response (SSE)
- [ ] Cache similar queries (Redis)

---

### **Week 9-10: Service Communication**
**Mục tiêu:** Microservices giao tiếp, gRPC, message queue

```bash
# Study materials:
- gRPC docs: https://grpc.io/docs/languages/go/
- Protocol Buffers
- Redis Pub/Sub

# Tasks:
✅ Add gRPC between Go services
✅ Implement service discovery
✅ Add circuit breaker (resilience)
✅ Message queue cho async tasks
✅ Distributed tracing (Jaeger)
```

**Learning Exercise:**
- [ ] Convert REST → gRPC (internal)
- [ ] Add retry logic
- [ ] Implement saga pattern (distributed transactions)
- [ ] Load testing (k6)

---

### **Week 11-12: Monitoring & DevOps**
**Mục tiêu:** Observability, CI/CD, deployment

```bash
# Study materials:
- Prometheus: https://prometheus.io/docs/
- Grafana dashboards
- GitHub Actions

# Tasks:
✅ Add Prometheus metrics
✅ Create Grafana dashboards
✅ Setup logging (Loki)
✅ Distributed tracing (Jaeger)
✅ Build CI/CD pipeline
✅ Deploy to Railway (optional)
```

**Learning Exercise:**
- [ ] Create custom metrics
- [ ] Alert on high error rate
- [ ] Auto-scale on CPU usage
- [ ] Blue-green deployment

---

## 🎯 Milestones

### Milestone 1: Local Development (Week 4)
- ✅ All services running in Docker
- ✅ Can register user
- ✅ Can login and get JWT
- ✅ Can query chatbot (Ollama)

### Milestone 2: Full Features (Week 8)
- ✅ Subscription management works
- ✅ Quota limiting works
- ✅ Multiple LLM models
- ✅ Admin dashboard functional

### Milestone 3: Production Ready (Week 12)
- ✅ Monitoring dashboards
- ✅ CI/CD pipeline
- ✅ Load tested (100 concurrent users)
- ✅ Documentation complete

---

## 🐛 Troubleshooting

### Container không start được
```bash
# Check logs
docker compose logs -f [service-name]

# Restart service
docker compose restart [service-name]

# Rebuild từ đầu
docker compose down -v
docker compose up --build
```

### PostgreSQL connection refused
```bash
# Check PostgreSQL running
docker compose ps postgres

# Test connection
docker compose exec postgres psql -U postgres -d epr_saas -c "SELECT 1;"
```

### Ollama models không tải
```bash
# Pull model manually
docker compose exec ollama ollama pull llama3

# List available models
docker compose exec ollama ollama list
```

### Out of memory
```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory: 8GB+

# Hoặc chỉ chạy services cần thiết:
docker compose up postgres redis api-gateway user-service ai-chatbot
```

---

## 📖 Resources

### Golang
- [Go by Example](https://gobyexample.com/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Fiber Framework](https://docs.gofiber.io/)
- [GORM ORM](https://gorm.io/docs/)

### Python
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [LlamaIndex Docs](https://docs.llamaindex.ai/)
- [Ollama Python Client](https://github.com/ollama/ollama-python)

### Docker & DevOps
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Prometheus Basics](https://prometheus.io/docs/introduction/overview/)
- [Grafana Tutorials](https://grafana.com/tutorials/)

### Architecture
- [Microservices Patterns](https://microservices.io/patterns/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [12-Factor App](https://12factor.net/)

---

## 🎓 Learning Tips

1. **Học từng service một** - Đừng cố làm tất cả cùng lúc
2. **Đọc logs thường xuyên** - Hiểu errors
3. **Test ngay khi code** - Đừng đợi đến cuối
4. **Git commit thường xuyên** - Mỗi feature 1 commit
5. **Đọc docs chính thức** - Đừng chỉ copy code

---

## 💡 Next Steps

Sau khi hoàn thành project này, bạn sẽ biết:
- ✅ Build microservices với Golang + Python
- ✅ Docker & containerization
- ✅ Database design & migrations
- ✅ Authentication & authorization
- ✅ AI/RAG integration
- ✅ Monitoring & observability
- ✅ CI/CD pipelines

**Skills marketable:** Backend Engineer, DevOps, Full-stack, AI Engineer

---

**Happy Learning! 🚀**
