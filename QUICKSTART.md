# ⚡ Quick Start - 5 Phút Setup

## 🎯 Mục Tiêu
Chạy được **EPR Legal SaaS** với đầy đủ:
- ✅ PostgreSQL + Redis + Weaviate + Ollama
- ✅ AI Chatbot service (Python/FastAPI)
- ✅ Monitoring stack (Prometheus + Grafana)
- ✅ 100% FREE, chạy local

**Total time:** ~5 phút (không kể download models)

---

## ✅ Prerequisites

Chỉ cần **Docker Desktop**:

```bash
# Check Docker installed
docker --version  # Should be 20.10+
docker compose version  # Should be 2.0+
```

**Yêu cầu:**
- 8GB RAM (16GB recommended)
- 20GB free disk
- Internet connection (lần đầu)

---

## 🚀 Setup trong 5 Phút

### Step 1: Chuẩn bị environment

```bash
cd /home/dieplai/Documents/luanvan

# Tạo .env file
cp .env.example .env

# (Optional) Thêm OpenAI API key vào .env nếu muốn
# Hoặc để USE_LOCAL_LLM=true để dùng Ollama miễn phí
```

### Step 2: Start services

```bash
# Start tất cả services
make up

# Hoặc nếu không có make:
docker compose up -d
```

**Đợi ~30 giây** để services khởi động.

### Step 3: Setup database

```bash
# Run migrations
make migrate

# Seed demo data (tạo user demo@epr-legal.com / demo123)
make seed
```

### Step 4: (Optional) Download Ollama models

```bash
# Pull llama3 (4GB) + embedding model (270MB)
# Bước này mất ~10-20 phút tùy internet
make ollama-pull
```

**Có thể skip bước này** nếu dùng OpenAI API.

### Step 5: Verify

```bash
# Check tất cả services
make health

# Test API
curl http://localhost:8004/health

# View logs
make logs-ai
```

---

## 🎉 Xong! Bây giờ làm gì?

### Test Chatbot

**Option 1: Dùng curl**

```bash
# Query đơn giản
curl -X POST http://localhost:8004/query \
  -H "Content-Type: application/json" \
  -d '{"query": "EPR là gì?", "session_id": "test123"}'
```

**Option 2: Dùng frontend (hiện tại)**

```bash
# Open browser
open http://localhost:8004/static/index.html
```

### Explore Monitoring

```bash
# Open Grafana
make grafana
# Login: admin / admin

# Open Prometheus
make prometheus

# Open Jaeger (tracing)
make jaeger
```

### Database GUI

```bash
# Start pgAdmin
make pgadmin
# Open: http://localhost:5050
# Login: admin@epr.com / admin

# Connect to database:
# Host: postgres
# Port: 5432
# Username: postgres
# Password: postgres
# Database: epr_saas
```

---

## 📚 Next Steps - Learning Path

### Week 1: Hiểu Codebase Hiện Tại
- [ ] Đọc code Python chatbot service
- [ ] Hiểu RAG pipeline (LlamaIndex + Weaviate)
- [ ] Test conversation memory
- [ ] Xem database schema

**Tasks:**
```bash
# Explore chatbot code
cd EPR_split_2025
ls -la systems/  # Các systems: FAQ, PDF catalog, conversation

# View database
make db-shell
\dt  # List tables
SELECT * FROM users;
SELECT * FROM packages;
```

### Week 2: Migrate Flask → FastAPI
- [ ] Học FastAPI basics
- [ ] Refactor app.py → FastAPI structure
- [ ] Add async/await
- [ ] Add streaming responses

**Resources:**
- FastAPI tutorial: https://fastapi.tiangolo.com/tutorial/
- Learning guide: [LEARNING_SETUP.md](./LEARNING_SETUP.md)

### Week 3-4: Build Golang API Gateway
- [ ] Học Golang basics
- [ ] Setup Fiber framework
- [ ] Implement JWT auth
- [ ] Add rate limiting

**Resources:**
- Tour of Go: https://go.dev/tour/
- Fiber docs: https://docs.gofiber.io/

### Week 5+: Expand Services
- [ ] Build User Service (Golang)
- [ ] Build Package Service (Golang)
- [ ] Integrate gRPC
- [ ] Add monitoring metrics

---

## 🛠️ Useful Commands

### Development

```bash
make dev              # Start + tail logs
make restart          # Restart all services
make logs             # View all logs
make logs-ai          # AI service logs only
```

### Database

```bash
make db-shell         # PostgreSQL shell
make db-reset         # Reset DB (migrate + seed)
make db-backup        # Backup database
```

### AI/LLM

```bash
make ollama-list      # List downloaded models
make ollama-run       # Interactive chat với Ollama
make weaviate-schema  # View vector DB schema
```

### Cleanup

```bash
make down             # Stop services
make clean            # Stop + remove volumes (⚠️ deletes data)
```

### All commands

```bash
make help             # Show all available commands
```

---

## 🐛 Troubleshooting

### Port already in use

```bash
# Change ports in docker-compose.yml
# Or kill process:
lsof -ti:8004 | xargs kill -9
```

### Out of memory

```bash
# Increase Docker memory:
# Docker Desktop → Settings → Resources → Memory: 8GB+

# Or run only essential services:
docker compose up postgres redis weaviate ai-chatbot
```

### Services not starting

```bash
# View logs
make logs

# Rebuild
make down
make up-build
```

### Database connection error

```bash
# Check PostgreSQL
docker compose ps postgres

# Restart
docker compose restart postgres

# Test connection
make db-shell
```

---

## 📊 Architecture Overview

```
Local Machine (Your Laptop)
│
├─ Docker Compose Network
│  │
│  ├─ AI Chatbot (Python/FastAPI) :8004
│  │  ├─ RAG Pipeline (LlamaIndex)
│  │  ├─ Conversation Memory
│  │  └─ FAQ System
│  │
│  ├─ PostgreSQL :5432
│  │  └─ users, packages, subscriptions, conversations
│  │
│  ├─ Redis :6379
│  │  └─ sessions, caching
│  │
│  ├─ Weaviate :8080
│  │  └─ document embeddings (34 PDFs)
│  │
│  ├─ Ollama :11434
│  │  └─ llama3, mistral (local LLM)
│  │
│  └─ Monitoring
│     ├─ Prometheus :9090
│     ├─ Grafana :3000
│     └─ Jaeger :16686
```

---

## 💰 Cost Breakdown

| Component | Status | Cost |
|-----------|--------|------|
| Docker Desktop | FREE | $0 |
| PostgreSQL (local) | FREE | $0 |
| Redis (local) | FREE | $0 |
| Weaviate (local) | FREE | $0 |
| Ollama (local LLM) | FREE | $0 |
| Monitoring stack | FREE | $0 |
| **OpenAI API** (optional) | $5 credit | ~$0-5/month |

**Total: $0/month** (100% free nếu dùng Ollama)

---

## 🎓 Learning Resources

### Documentation
- [Full Learning Guide](./LEARNING_SETUP.md)
- [Main README](./README.md)
- [Architecture Docs](./docs/ARCHITECTURE.md)

### External
- [Docker Compose](https://docs.docker.com/compose/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Golang](https://go.dev/tour/)
- [LlamaIndex](https://docs.llamaindex.ai/)
- [Ollama](https://ollama.ai/docs)

### Video Tutorials
- Docker Basics: https://www.youtube.com/watch?v=3c-iBn73dDE
- FastAPI Crash Course: https://www.youtube.com/watch?v=0sOvCWFmrtA
- Golang Crash Course: https://www.youtube.com/watch?v=YS4e4q9oBaU

---

## ✅ Checklist - You're Ready When:

- [ ] `make health` shows all services UP
- [ ] Can query chatbot via curl/frontend
- [ ] Can login to Grafana
- [ ] Can connect to PostgreSQL via pgAdmin
- [ ] Understand project structure
- [ ] Read LEARNING_SETUP.md

---

## 🚀 Happy Learning!

**Bạn vừa setup được một production-grade microservices SaaS platform!**

Next: Đọc [LEARNING_SETUP.md](./LEARNING_SETUP.md) để bắt đầu coding.

Questions? Check:
- Troubleshooting section above
- Main README.md
- GitHub Issues (tạo issue mới nếu cần)

**Good luck! 🎉**
