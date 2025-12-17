# ============================================
# EPR Legal SaaS - Development Makefile
# Simplified for core development
# ============================================

.PHONY: help dev stop restart logs health clean db-migrate db-shell test

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m

##@ General

help: ## Display this help
	@echo "$(GREEN)EPR Legal SaaS - Development Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

dev: ## Start all services (postgres + redis + backend)
	@echo "$(GREEN)Starting all services...$(NC)"
	@docker compose up -d
	@echo "$(GREEN)✓ Services started!$(NC)"
	@make health

stop: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	@docker compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)Restarting services...$(NC)"
	@docker compose restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

logs: ## View all logs
	@docker compose logs -f

logs-backend: ## View backend logs only
	@docker compose logs -f epr-backend

logs-postgres: ## View postgres logs only
	@docker compose logs -f postgres

logs-chatbot-api: ## View chatbot API logs
	@docker compose logs -f ai-chatbot-api

logs-chatbot-ui: ## View chatbot UI logs
	@docker compose logs -f ai-chatbot-ui

logs-chatbot: ## View all chatbot logs
	@docker compose logs -f ai-chatbot-api ai-chatbot-ui

##@ Database

db-migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	@docker compose exec -T postgres psql -U postgres -d epr_saas < infrastructure/docker/init-scripts/01-create-tables.sql
	@echo "$(GREEN)✓ Migrations complete$(NC)"

db-shell: ## Open PostgreSQL shell
	@docker compose exec postgres psql -U postgres -d epr_saas

db-reset: ## Reset database (⚠️  DELETES ALL DATA)
	@echo "$(RED)⚠️  This will DELETE ALL DATA!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		docker compose up -d postgres redis; \
		sleep 5; \
		make db-migrate; \
		docker compose up -d epr-backend; \
		echo "$(GREEN)✓ Database reset complete$(NC)"; \
	fi

##@ Build & Test

build: ## Build backend Docker image
	@echo "$(GREEN)Building backend...$(NC)"
	@docker compose build epr-backend
	@echo "$(GREEN)✓ Build complete$(NC)"

test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	@cd backend/services/epr-backend && go test ./...

test-verbose: ## Run tests with verbose output
	@cd backend/services/epr-backend && go test -v ./...

##@ Health & Status

health: ## Check health of all services
	@echo "$(GREEN)Checking service health...$(NC)"
	@sleep 2
	@curl -sf http://localhost:8001/health > /dev/null && echo "Backend:      $(GREEN)✓ UP$(NC)" || echo "Backend:      $(RED)✗ DOWN$(NC)"
	@curl -sf http://localhost:8000/health > /dev/null && echo "Chatbot API:  $(GREEN)✓ UP$(NC)" || echo "Chatbot API:  $(RED)✗ DOWN$(NC)"
	@curl -sf http://localhost:8501 > /dev/null && echo "Chatbot UI:   $(GREEN)✓ UP$(NC)" || echo "Chatbot UI:   $(RED)✗ DOWN$(NC)"
	@docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1 && echo "PostgreSQL:   $(GREEN)✓ UP$(NC)" || echo "PostgreSQL:   $(RED)✗ DOWN$(NC)"
	@docker compose exec redis redis-cli ping > /dev/null 2>&1 && echo "Redis:        $(GREEN)✓ UP$(NC)" || echo "Redis:        $(RED)✗ DOWN$(NC)"

status: ## Show status of all services
	@docker compose ps

urls: ## Show service URLs
	@echo "$(GREEN)Service URLs:$(NC)"
	@echo "  Backend:       http://localhost:8001"
	@echo "  Health:        http://localhost:8001/health"
	@echo "  Packages:      http://localhost:8001/api/v1/packages"
	@echo "  Chatbot API:   http://localhost:8000"
	@echo "  Chatbot Docs:  http://localhost:8000/docs"
	@echo "  Streamlit UI:  http://localhost:8501"

##@ API Testing

api-health: ## Test health endpoint
	@curl -s http://localhost:8001/health | jq .

api-packages: ## List all packages
	@curl -s http://localhost:8001/api/v1/packages | jq .

api-register: ## Register test user
	@curl -X POST http://localhost:8001/api/v1/auth/register \
		-H "Content-Type: application/json" \
		-d '{"email":"test@epr.com","password":"Test@123456","full_name":"Test User"}' | jq .

api-login: ## Login test user
	@curl -X POST http://localhost:8001/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email":"test@epr.com","password":"Test@123456"}' | jq .

##@ Cleanup

clean: ## Stop and remove all containers and volumes
	@echo "$(RED)⚠️  This will delete ALL data including database!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		echo "$(GREEN)✓ Cleaned$(NC)"; \
	fi

clean-images: ## Remove Docker images
	@docker compose down --rmi all -v

##@ Environment Management

env-dev: ## Switch to DEVELOPMENT environment
	@echo "$(YELLOW)Switching to DEVELOPMENT environment...$(NC)"
	@rm -f .env
	@ln -sf infrastructure/.env.dev .env
	@echo "$(GREEN)✓ Now using: infrastructure/.env.dev$(NC)"
	@echo "$(YELLOW)Run 'make restart' to apply changes$(NC)"

env-staging: ## Switch to STAGING environment
	@echo "$(YELLOW)Switching to STAGING environment...$(NC)"
	@rm -f .env
	@ln -sf infrastructure/.env.staging .env
	@echo "$(GREEN)✓ Now using: infrastructure/.env.staging$(NC)"
	@echo "$(RED)⚠️  STAGING credentials required!$(NC)"
	@echo "$(YELLOW)Run 'make restart' to apply changes$(NC)"

env-prod: ## Switch to PRODUCTION environment
	@echo "$(RED)⚠️  SWITCHING TO PRODUCTION!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		rm -f .env; \
		ln -sf infrastructure/.env.prod .env; \
		echo "$(GREEN)✓ Now using: infrastructure/.env.prod$(NC)"; \
		echo "$(RED)⚠️  PRODUCTION credentials required!$(NC)"; \
		echo "$(YELLOW)Run 'make restart' to apply changes$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

env-status: ## Show current environment
	@echo "$(GREEN)Current Environment:$(NC)"
	@if [ -L .env ]; then \
		echo "  Symlink: .env -> $$(readlink .env)"; \
		echo ""; \
		echo "$(GREEN)Environment Variables:$(NC)"; \
		grep "^NODE_ENV=" .env || echo "  NODE_ENV: (not set)"; \
		grep "^ENVIRONMENT=" .env || echo "  ENVIRONMENT: (not set)"; \
		grep "^DATABASE_URL=" .env | sed 's/postgres:.*/postgres:***@.../' || echo "  DATABASE_URL: (not set)"; \
	else \
		echo "  $(RED)No symlink found! Run 'make env-dev' to set up.$(NC)"; \
	fi

##@ Quick Start

quick-start: ## First time setup (start + migrate + test)
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)EPR Legal SaaS - Quick Start$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@make env-dev
	@make dev
	@sleep 5
	@make db-migrate
	@sleep 2
	@make health
	@echo ""
	@echo "$(GREEN)✓ System is ready!$(NC)"
	@make urls
