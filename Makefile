.PHONY: help setup up down restart logs clean test migrate seed ollama-pull

# Colors for terminal output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(GREEN)EPR SaaS Learning Project - Makefile Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup & Installation

setup: ## First-time setup (create .env, pull images)
	@echo "$(GREEN)Setting up EPR SaaS project...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(YELLOW)✓ Created .env file - Please fill in your API keys!$(NC)"; \
	else \
		echo "$(YELLOW)! .env already exists, skipping...$(NC)"; \
	fi
	@echo "$(GREEN)✓ Pulling Docker images...$(NC)"
	@docker compose pull
	@echo "$(GREEN)✓ Setup complete! Run 'make up' to start services$(NC)"

install: setup ## Alias for setup

##@ Docker Compose

up: ## Start all services
	@echo "$(GREEN)Starting all services...$(NC)"
	@docker compose up -d
	@echo "$(GREEN)✓ Services started!$(NC)"
	@make status

up-build: ## Start all services with rebuild
	@echo "$(GREEN)Building and starting all services...$(NC)"
	@docker compose up -d --build

down: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	@docker compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)Restarting all services...$(NC)"
	@docker compose restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

stop: down ## Alias for down

clean: ## Stop services and remove volumes (⚠️  DELETES ALL DATA)
	@echo "$(RED)⚠️  This will delete all data including databases!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		echo "$(GREEN)✓ Cleaned up$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

status: ## Show status of all services
	@echo "$(GREEN)Service Status:$(NC)"
	@docker compose ps

##@ Logs

logs: ## Tail all service logs
	@docker compose logs -f

logs-api: ## Tail API Gateway logs
	@docker compose logs -f api-gateway

logs-user: ## Tail User Service logs
	@docker compose logs -f user-service

logs-ai: ## Tail AI Chatbot logs
	@docker compose logs -f ai-chatbot

logs-db: ## Tail PostgreSQL logs
	@docker compose logs -f postgres

logs-redis: ## Tail Redis logs
	@docker compose logs -f redis

##@ Database

migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	@docker compose exec postgres psql -U postgres -d epr_saas -f /migrations/schema.sql
	@echo "$(GREEN)✓ Migrations complete$(NC)"

seed: ## Seed database with demo data
	@echo "$(GREEN)Seeding database...$(NC)"
	@docker compose exec postgres psql -U postgres -d epr_saas -f /seeds/dev_data.sql
	@echo "$(GREEN)✓ Database seeded$(NC)"

db-reset: ## Reset database (migrate + seed)
	@echo "$(YELLOW)Resetting database...$(NC)"
	@make migrate
	@make seed
	@echo "$(GREEN)✓ Database reset complete$(NC)"

db-shell: ## Open PostgreSQL shell
	@docker compose exec postgres psql -U postgres -d epr_saas

db-backup: ## Backup database to file
	@echo "$(GREEN)Backing up database...$(NC)"
	@mkdir -p backups
	@docker compose exec -T postgres pg_dump -U postgres epr_saas > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Backup saved to backups/$(NC)"

db-restore: ## Restore database from latest backup
	@echo "$(YELLOW)Restoring database from latest backup...$(NC)"
	@docker compose exec -T postgres psql -U postgres epr_saas < $$(ls -t backups/*.sql | head -1)
	@echo "$(GREEN)✓ Database restored$(NC)"

##@ Redis

redis-cli: ## Open Redis CLI
	@docker compose exec redis redis-cli

redis-flush: ## Flush all Redis data
	@echo "$(RED)⚠️  This will delete all Redis data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose exec redis redis-cli FLUSHALL; \
		echo "$(GREEN)✓ Redis flushed$(NC)"; \
	fi

##@ AI / LLM

ollama-pull: ## Pull Ollama models (llama3, embedding)
	@echo "$(GREEN)Pulling Ollama models...$(NC)"
	@echo "$(YELLOW)This may take a while (models are 4-7GB each)...$(NC)"
	@docker compose exec ollama ollama pull llama3
	@docker compose exec ollama ollama pull nomic-embed-text
	@echo "$(GREEN)✓ Models downloaded$(NC)"

ollama-list: ## List downloaded Ollama models
	@docker compose exec ollama ollama list

ollama-run: ## Interactive chat with Ollama (for testing)
	@docker compose exec -it ollama ollama run llama3

weaviate-schema: ## Show Weaviate schema
	@curl -s http://localhost:8080/v1/schema | jq

weaviate-objects: ## Count objects in Weaviate
	@curl -s http://localhost:8080/v1/objects | jq '.objects | length'

##@ Development

dev: up logs ## Start services and tail logs (dev mode)

dev-ai: ## Run only AI chatbot service in dev mode
	@echo "$(GREEN)Starting AI chatbot in dev mode...$(NC)"
	@docker compose up -d postgres redis weaviate ollama
	@sleep 5
	@cd EPR_split_2025 && uvicorn app:app --reload --port 8004

shell-ai: ## Shell into AI chatbot container
	@docker compose exec ai-chatbot /bin/bash

shell-postgres: ## Shell into PostgreSQL container
	@docker compose exec postgres /bin/bash

##@ Testing

test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	@# Add test commands here
	@echo "$(YELLOW)No tests configured yet$(NC)"

test-api: ## Test API endpoints
	@echo "$(GREEN)Testing API endpoints...$(NC)"
	@bash scripts/test-api.sh

load-test: ## Run load test with k6
	@echo "$(GREEN)Running load test...$(NC)"
	@k6 run scripts/load-test.js

##@ Monitoring

grafana: ## Open Grafana dashboard
	@echo "$(GREEN)Opening Grafana...$(NC)"
	@open http://localhost:3000 || xdg-open http://localhost:3000

prometheus: ## Open Prometheus UI
	@echo "$(GREEN)Opening Prometheus...$(NC)"
	@open http://localhost:9090 || xdg-open http://localhost:9090

jaeger: ## Open Jaeger tracing UI
	@echo "$(GREEN)Opening Jaeger...$(NC)"
	@open http://localhost:16686 || xdg-open http://localhost:16686

pgadmin: ## Start pgAdmin and open UI
	@docker compose --profile tools up -d pgadmin
	@echo "$(GREEN)Opening pgAdmin...$(NC)"
	@sleep 3
	@open http://localhost:5050 || xdg-open http://localhost:5050

##@ Code Quality

fmt: ## Format code (Go + Python)
	@echo "$(GREEN)Formatting code...$(NC)"
	@find . -name "*.go" -not -path "./vendor/*" -exec gofmt -w {} \;
	@find . -name "*.py" -not -path "./venv/*" -exec black {} \;
	@echo "$(GREEN)✓ Code formatted$(NC)"

lint: ## Lint code
	@echo "$(GREEN)Linting code...$(NC)"
	@# Go lint
	@find ./api-gateway ./services -name "*.go" -not -path "*/vendor/*" | xargs -n1 dirname | sort -u | xargs -I {} sh -c 'cd {} && golangci-lint run ./...'
	@# Python lint
	@cd EPR_split_2025 && flake8 . || true
	@echo "$(GREEN)✓ Linting complete$(NC)"

##@ Utils

ps: status ## Alias for status

exec: ## Execute command in container (usage: make exec SERVICE=ai-chatbot CMD="ls -la")
	@docker compose exec $(SERVICE) $(CMD)

rebuild: ## Rebuild specific service (usage: make rebuild SERVICE=ai-chatbot)
	@echo "$(GREEN)Rebuilding $(SERVICE)...$(NC)"
	@docker compose up -d --build $(SERVICE)

scale: ## Scale service (usage: make scale SERVICE=ai-chatbot COUNT=3)
	@docker compose up -d --scale $(SERVICE)=$(COUNT)

health: ## Check health of all services
	@echo "$(GREEN)Checking service health...$(NC)"
	@curl -s http://localhost:8000/health | jq || echo "API Gateway: $(RED)DOWN$(NC)"
	@curl -s http://localhost:8004/health | jq || echo "AI Chatbot: $(RED)DOWN$(NC)"
	@docker compose exec postgres pg_isready && echo "PostgreSQL: $(GREEN)UP$(NC)" || echo "PostgreSQL: $(RED)DOWN$(NC)"
	@docker compose exec redis redis-cli ping && echo "Redis: $(GREEN)UP$(NC)" || echo "Redis: $(RED)DOWN$(NC)"

urls: ## Show all service URLs
	@echo "$(GREEN)Service URLs:$(NC)"
	@echo "  API Gateway:    http://localhost:8000"
	@echo "  AI Chatbot:     http://localhost:8004"
	@echo "  Grafana:        http://localhost:3000 (admin/admin)"
	@echo "  Prometheus:     http://localhost:9090"
	@echo "  Jaeger:         http://localhost:16686"
	@echo "  MinIO Console:  http://localhost:9001 (minioadmin/minioadmin)"
	@echo "  Weaviate:       http://localhost:8080"
	@echo "  pgAdmin:        http://localhost:5050 (admin@epr.com/admin)"

##@ Quick Tests

curl-health: ## Test health endpoint
	@curl -s http://localhost:8000/health | jq

curl-chat: ## Test chat endpoint (requires TOKEN env var)
	@curl -X POST http://localhost:8004/api/v1/chat/query \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer $(TOKEN)" \
		-d '{"query": "EPR là gì?"}' | jq

##@ Documentation

docs: ## Generate API documentation
	@echo "$(GREEN)Generating API docs...$(NC)"
	@echo "$(YELLOW)Not implemented yet$(NC)"

architecture: ## Show architecture diagram
	@cat docs/ARCHITECTURE.md 2>/dev/null || echo "$(YELLOW)Architecture doc not found$(NC)"
