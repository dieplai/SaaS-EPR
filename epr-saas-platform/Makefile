.PHONY: help setup infra-up infra-down dev migrate-up migrate-down test clean

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m

##@ General

help: ## Display this help
	@echo "$(GREEN)EPR Legal SaaS Platform - Makefile Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup & Installation

setup: ## First-time setup (create .env, install deps)
	@echo "$(GREEN)Setting up EPR SaaS Platform...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(YELLOW)✓ Created .env file - Please add your OPENAI_API_KEY!$(NC)"; \
	else \
		echo "$(YELLOW)! .env already exists$(NC)"; \
	fi
	@echo "$(GREEN)✓ Setup complete!$(NC)"

##@ Infrastructure

infra-up: ## Start PostgreSQL + Redis only
	@echo "$(GREEN)Starting infrastructure...$(NC)"
	@docker compose up -d postgres redis
	@echo "$(GREEN)✓ Infrastructure started!$(NC)"
	@make infra-health

infra-down: ## Stop infrastructure
	@docker compose down

infra-health: ## Check infrastructure health
	@echo "$(GREEN)Checking infrastructure health...$(NC)"
	@docker compose ps postgres redis

##@ Database

migrate-up: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	@docker compose exec -T postgres psql -U postgres -d epr_saas -f /docker-entrypoint-initdb.d/000001_init_schema.sql
	@echo "$(GREEN)✓ Migrations complete$(NC)"

migrate-down: ## Rollback migrations
	@echo "$(YELLOW)Rolling back migrations...$(NC)"
	@docker compose exec -T postgres psql -U postgres -d epr_saas -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@echo "$(GREEN)✓ Rollback complete$(NC)"

migrate-reset: ## Reset database (drop + recreate)
	@echo "$(RED)⚠️  Resetting database...$(NC)"
	@make migrate-down
	@make migrate-up
	@echo "$(GREEN)✓ Database reset$(NC)"

db-shell: ## Open PostgreSQL shell
	@docker compose exec postgres psql -U postgres -d epr_saas

db-backup: ## Backup database
	@mkdir -p backups
	@docker compose exec -T postgres pg_dump -U postgres epr_saas > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Backup saved to backups/$(NC)"

##@ Development

dev: ## Start all services for development
	@echo "$(GREEN)Starting all services...$(NC)"
	@docker compose up -d
	@echo "$(GREEN)✓ All services started!$(NC)"
	@make health
	@make logs-follow

dev-go: ## Start Golang services only
	@docker compose up -d postgres redis api-gateway user-service package-service

dev-python: ## Start Python AI service only
	@docker compose up -d postgres redis ai-chatbot

dev-web: ## Start web + backend
	@docker compose --profile web up -d

stop: ## Stop all services
	@docker compose down

restart: ## Restart all services
	@docker compose restart

clean: ## Stop and remove all containers, volumes
	@echo "$(RED)⚠️  This will delete ALL data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		echo "$(GREEN)✓ Cleaned$(NC)"; \
	fi

##@ Monitoring

monitoring-up: ## Start monitoring stack
	@docker compose --profile monitoring up -d
	@echo "$(GREEN)✓ Monitoring started$(NC)"
	@echo "Grafana: http://localhost:3001 (admin/admin)"
	@echo "Prometheus: http://localhost:9090"

tools-up: ## Start utility tools (pgAdmin, Redis Commander)
	@docker compose --profile tools up -d
	@echo "$(GREEN)✓ Tools started$(NC)"
	@echo "pgAdmin: http://localhost:5050 (admin@epr.com/admin)"
	@echo "Redis Commander: http://localhost:8081"

grafana: ## Open Grafana
	@open http://localhost:3001 || xdg-open http://localhost:3001

prometheus: ## Open Prometheus
	@open http://localhost:9090 || xdg-open http://localhost:9090

##@ Logs

logs: ## View all logs
	@docker compose logs

logs-follow: ## Follow all logs
	@docker compose logs -f

logs-api: ## API Gateway logs
	@docker compose logs -f api-gateway

logs-user: ## User Service logs
	@docker compose logs -f user-service

logs-ai: ## AI Chatbot logs
	@docker compose logs -f ai-chatbot

logs-db: ## PostgreSQL logs
	@docker compose logs -f postgres

##@ Testing

test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	@cd backend/services/user-service && go test ./...
	@cd backend/services/package-service && go test ./...
	@cd backend/services/ai-chatbot && pytest

test-go: ## Run Golang tests only
	@cd backend/services/user-service && go test -v ./...
	@cd backend/services/package-service && go test -v ./...

test-python: ## Run Python tests only
	@cd backend/services/ai-chatbot && pytest -v

test-coverage: ## Run tests with coverage
	@cd backend/services/user-service && go test -cover ./...

##@ Build

build: ## Build all Docker images
	@docker compose build

build-api: ## Build API Gateway
	@docker compose build api-gateway

build-user: ## Build User Service
	@docker compose build user-service

build-ai: ## Build AI Chatbot
	@docker compose build ai-chatbot

##@ Health & Status

health: ## Check health of all services
	@echo "$(GREEN)Checking service health...$(NC)"
	@curl -sf http://localhost:8000/health > /dev/null && echo "API Gateway: $(GREEN)✓ UP$(NC)" || echo "API Gateway: $(RED)✗ DOWN$(NC)"
	@curl -sf http://localhost:8001/health > /dev/null && echo "User Service: $(GREEN)✓ UP$(NC)" || echo "User Service: $(RED)✗ DOWN$(NC)"
	@curl -sf http://localhost:8002/health > /dev/null && echo "Package Service: $(GREEN)✓ UP$(NC)" || echo "Package Service: $(RED)✗ DOWN$(NC)"
	@curl -sf http://localhost:8004/health > /dev/null && echo "AI Chatbot: $(GREEN)✓ UP$(NC)" || echo "AI Chatbot: $(RED)✗ DOWN$(NC)"
	@docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1 && echo "PostgreSQL: $(GREEN)✓ UP$(NC)" || echo "PostgreSQL: $(RED)✗ DOWN$(NC)"
	@docker compose exec redis redis-cli ping > /dev/null 2>&1 && echo "Redis: $(GREEN)✓ UP$(NC)" || echo "Redis: $(RED)✗ DOWN$(NC)"

status: ## Show status of all services
	@docker compose ps

urls: ## Show all service URLs
	@echo "$(GREEN)Service URLs:$(NC)"
	@echo "  API Gateway:      http://localhost:8000"
	@echo "  User Service:     http://localhost:8001"
	@echo "  Package Service:  http://localhost:8002"
	@echo "  AI Chatbot:       http://localhost:8004"
	@echo "  Web App:          http://localhost:3000"
	@echo ""
	@echo "$(GREEN)Tools:$(NC)"
	@echo "  pgAdmin:          http://localhost:5050 (admin@epr.com/admin)"
	@echo "  Redis Commander:  http://localhost:8081"
	@echo "  Grafana:          http://localhost:3001 (admin/admin)"
	@echo "  Prometheus:       http://localhost:9090"

##@ Mobile Development

flutter-setup: ## Setup Flutter mobile app
	@cd mobile && flutter pub get
	@echo "$(GREEN)✓ Flutter dependencies installed$(NC)"

flutter-ios: ## Run Flutter app on iOS simulator
	@cd mobile && flutter run -d ios

flutter-android: ## Run Flutter app on Android emulator
	@cd mobile && flutter run -d android

flutter-build-ios: ## Build iOS app
	@cd mobile && flutter build ios --release

flutter-build-android: ## Build Android app
	@cd mobile && flutter build apk --release

##@ Deployment

deploy-vps: ## Deploy to VPS
	@echo "$(GREEN)Deploying to VPS...$(NC)"
	@./infrastructure/scripts/deploy.sh

vps-setup: ## Initial VPS setup
	@echo "$(GREEN)Setting up VPS...$(NC)"
	@./infrastructure/scripts/setup-vps.sh

##@ Code Quality

fmt: ## Format code
	@echo "$(GREEN)Formatting code...$(NC)"
	@cd backend/services/user-service && go fmt ./...
	@cd backend/services/package-service && go fmt ./...
	@cd backend/services/ai-chatbot && black . && isort .

lint: ## Lint code
	@echo "$(GREEN)Linting code...$(NC)"
	@cd backend/services/user-service && golangci-lint run || true
	@cd backend/services/package-service && golangci-lint run || true
	@cd backend/services/ai-chatbot && flake8 . || true

##@ Utils

shell-api: ## Shell into API Gateway container
	@docker compose exec api-gateway sh

shell-user: ## Shell into User Service container
	@docker compose exec user-service sh

shell-ai: ## Shell into AI Chatbot container
	@docker compose exec ai-chatbot bash

shell-db: ## Shell into PostgreSQL container
	@docker compose exec postgres bash

redis-cli: ## Open Redis CLI
	@docker compose exec redis redis-cli

redis-flush: ## Flush all Redis data
	@docker compose exec redis redis-cli FLUSHALL

##@ API Testing

api-test-register: ## Test user registration
	@curl -X POST http://localhost:8000/api/v1/auth/register \
		-H "Content-Type: application/json" \
		-d '{"email":"test@example.com","password":"test123","full_name":"Test User"}' | jq

api-test-login: ## Test user login
	@curl -X POST http://localhost:8000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email":"demo@epr-legal.com","password":"demo123"}' | jq

api-test-chat: ## Test chat query (requires TOKEN env var)
	@curl -X POST http://localhost:8004/api/v1/chat/query \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer $(TOKEN)" \
		-d '{"query":"EPR là gì?"}' | jq

##@ Quick Start

quick-start: setup infra-up migrate-up dev ## Complete quick start (setup + migrate + dev)
	@echo ""
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)✓ EPR Legal SaaS Platform is ready!$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo ""
	@make urls
