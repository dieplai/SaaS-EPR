# 🎓 EPR Legal SaaS - Learning Project

> **Microservices SaaS Platform** kết hợp **Golang** và **Python** để xây dựng hệ thống tư vấn pháp luật AI-powered

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-20.10+-blue.svg)](https://www.docker.com/)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8.svg)](https://golang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)

---

## 🎯 Về Project Này

Đây là **learning project** để nắm vững:
- **Microservices architecture** với Golang + Python
- **AI/RAG chatbot** với LlamaIndex + Ollama
- **PostgreSQL + Redis + Vector DB** (Weaviate)
- **Docker Compose** orchestration
- **Monitoring stack** (Prometheus + Grafana + Jaeger)

**100% MIỄN PHÍ** - Chạy hoàn toàn trên local, không cần deploy!

---

## 🏗️ Kiến Trúc

```
┌──────────────────────────────────────────────────┐
│              API Gateway (Golang)                │
│  Authentication • Rate Limiting • Routing        │
└────────┬──────────────────┬──────────────────────┘
         │                  │
    ┌────┴─────┐      ┌─────┴──────────────┐
    │          │      │                    │
┌───▼──┐  ┌───▼──┐  ┌──▼──────┐  ┌───────▼────┐
│ User │  │ Pack │  │ Payment │  │ AI Chatbot │
│ Svc  │  │ Svc  │  │  Svc    │  │  (Python)  │
│ Go   │  │ Go   │  │  Go     │  │  FastAPI   │
└───┬──┘  └───┬──┘  └──┬──────┘  └───────┬────┘
    │         │         │                 │
    └─────────┴─────────┴────────┬────────┘
                                 │
               ┌─────────────────┴──────────┐
               │  PostgreSQL • Redis        │
               │  Weaviate • Ollama (LLM)   │
               └────────────────────────────┘
```

### Services

| Service | Tech | Port | Mô tả |
|---------|------|------|-------|
| **API Gateway** | Golang/Fiber | 8000 | Entry point, auth, routing |
| **User Service** | Golang/GORM | 8001 | User management, auth |
| **Package Service** | Golang | 8002 | Subscription, quotas |
| **Payment Service** | Golang | 8003 | Billing (future) |
| **AI Chatbot** | Python/FastAPI | 8004 | Legal consultation AI |
| **PostgreSQL** | SQL | 5432 | Main database |
| **Redis** | Cache | 6379 | Sessions, caching |
| **Weaviate** | Vector DB | 8080 | Document embeddings |
| **Ollama** | Local LLM | 11434 | Free AI models |
| **Prometheus** | Monitoring | 9090 | Metrics collection |
| **Grafana** | Monitoring | 3000 | Dashboards |
| **Jaeger** | Tracing | 16686 | Distributed tracing |

---

## 🚀 Quick Start

### Prerequisites

```bash
# Bắt buộc:
✅ Docker Desktop 4.x+
✅ Git
✅ 8GB+ RAM
✅ 20GB+ free disk space
```

### Installation

```bash
# 1. Clone repo
cd /home/dieplai/Documents/luanvan

# 2. Setup environment
make setup

# 3. Edit .env file (thêm OpenAI API key nếu có)
nano .env
# Hoặc để USE_LOCAL_LLM=true để dùng Ollama miễn phí

# 4. Start all services
make up

# 5. Wait for services to be ready (~30s)
make status

# 6. Run database migrations
make migrate

# 7. Seed demo data
make seed

# 8. Pull Ollama models (optional, ~5GB download)
make ollama-pull
```

### Verify Setup

```bash
# Check service health
make health

# View all service URLs
make urls

# Test API
curl http://localhost:8000/health
```

---

## 📖 Sử Dụng

### Development Workflow

```bash
# Start services và xem logs
make dev

# Rebuild specific service
make rebuild SERVICE=ai-chatbot

# Shell vào container
make shell-ai

# View logs
make logs-ai
```

### Database Operations

```bash
# Database shell
make db-shell

# Reset database
make db-reset

# Backup
make db-backup

# Restore
make db-restore
```

### Testing

```bash
# Health check
make health

# Test chat API (cần JWT token)
export TOKEN="your-jwt-token-here"
make curl-chat

# API testing script
make test-api
```

### Monitoring

```bash
# Open Grafana
make grafana

# Open Prometheus
make prometheus

# Open Jaeger (tracing)
make jaeger

# Open pgAdmin (database UI)
make pgadmin
```

---

## 📚 Learning Path

Xem chi tiết: [LEARNING_SETUP.md](./LEARNING_SETUP.md)

### Week 1-2: Golang Basics + API Gateway
- [ ] Tour of Go
- [ ] Build Fiber server
- [ ] JWT middleware
- [ ] Rate limiting

### Week 3-4: User Service (CRUD + Database)
- [ ] GORM ORM
- [ ] Repository pattern
- [ ] Password hashing
- [ ] Database migrations

### Week 5-6: Package & Subscription Service
- [ ] Business logic
- [ ] Quota system
- [ ] State machines

### Week 7-8: Python FastAPI + AI
- [ ] Migrate Flask → FastAPI
- [ ] Integrate Ollama
- [ ] Streaming responses
- [ ] RAG optimization

### Week 9-10: Service Communication
- [ ] gRPC
- [ ] Circuit breaker
- [ ] Distributed tracing

### Week 11-12: Monitoring & DevOps
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] CI/CD pipeline

---

## 🛠️ Tech Stack

### Backend
- **Golang 1.22+** - High-performance services
  - Fiber (web framework)
  - GORM (ORM)
  - JWT-go (authentication)
- **Python 3.11+** - AI/ML service
  - FastAPI (async web framework)
  - LlamaIndex (RAG framework)
  - Ollama (local LLM)

### Databases
- **PostgreSQL 16** - Main database
- **Redis 7** - Caching, sessions
- **Weaviate 1.24** - Vector database

### AI/ML
- **Ollama** - Local LLM (llama3, mistral, phi3)
- **OpenAI** - GPT models (optional, paid)
- **LlamaIndex** - RAG orchestration
- **nomic-embed-text** - Embeddings (free)

### DevOps
- **Docker + Docker Compose** - Containerization
- **Prometheus** - Metrics
- **Grafana** - Dashboards
- **Jaeger** - Distributed tracing

---

## 📁 Project Structure

```
epr-saas-learning/
├── docker-compose.yml          # Orchestration
├── Makefile                    # Dev shortcuts
├── .env                        # Configuration
│
├── api-gateway/                # Service 1: API Gateway (Go)
├── services/
│   ├── user-service/           # Service 2: Users (Go)
│   ├── package-service/        # Service 3: Subscriptions (Go)
│   ├── payment-service/        # Service 4: Billing (Go)
│   └── ai-chatbot/             # Service 5: AI (Python)
│
├── database/
│   ├── migrations/             # SQL migrations
│   └── seeds/                  # Demo data
│
├── monitoring/
│   ├── prometheus/             # Metrics config
│   └── grafana/                # Dashboards
│
└── docs/                       # Documentation
    ├── LEARNING_SETUP.md
    ├── API.md
    └── ARCHITECTURE.md
```

---

## 🎓 Resources

### Documentation
- [Learning Setup Guide](./LEARNING_SETUP.md)
- [API Documentation](./docs/API.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)

### External Resources
- [Go by Example](https://gobyexample.com/)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Microservices Patterns](https://microservices.io/patterns/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

## 🐛 Troubleshooting

### Services không start
```bash
# Check logs
make logs

# Restart specific service
docker compose restart [service-name]

# Rebuild from scratch
make clean && make up-build
```

### Out of memory
```bash
# Increase Docker memory: Settings → Resources → 8GB+

# Or run minimal stack
docker compose up postgres redis weaviate ai-chatbot
```

### Port conflicts
```bash
# Check ports in use
lsof -i :8000

# Change ports in docker-compose.yml
```

---

## 📊 Cost Breakdown

| Component | Local Dev | Production (optional) |
|-----------|-----------|----------------------|
| Docker | FREE | FREE |
| PostgreSQL | FREE | ~$7/month (Supabase) |
| Redis | FREE | ~$10/month (Upstash) |
| Weaviate | FREE | ~$25/month (cloud) |
| Ollama LLM | FREE | FREE (self-host) |
| OpenAI API | FREE ($5 credit) | Pay-as-you-go |
| **TOTAL** | **$0/month** | **$42-50/month** |

---

## 🤝 Contributing

Đây là learning project, nhưng welcome contributions!

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- [LlamaIndex](https://www.llamaindex.ai/) - RAG framework
- [Ollama](https://ollama.ai/) - Local LLM runtime
- [Weaviate](https://weaviate.io/) - Vector database
- [Fiber](https://gofiber.io/) - Golang web framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python async framework

---

## 📧 Contact

Có câu hỏi? Tạo [GitHub Issue](https://github.com/yourusername/epr-saas/issues)

---

**Happy Learning! 🚀**

Made with ❤️ for learning microservices architecture
