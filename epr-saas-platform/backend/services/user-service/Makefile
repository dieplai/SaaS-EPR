.PHONY: help build run test clean docker-build docker-up docker-down docker-logs

# ============================================
# Variables
# ============================================
SERVICE_NAME=user-service
DOCKER_IMAGE=epr-saas/$(SERVICE_NAME):latest

# ============================================
# Help
# ============================================
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================
# Local Development
# ============================================
install: ## Install Go dependencies
	go mod download
	go mod tidy

build: ## Build the Go binary
	CGO_ENABLED=0 go build -o bin/$(SERVICE_NAME) ./cmd/main.go

run: ## Run the service locally
	go run cmd/main.go

test: ## Run tests
	go test -v ./...

test-coverage: ## Run tests with coverage
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

clean: ## Clean build artifacts
	rm -rf bin/
	rm -f coverage.out

# ============================================
# Docker Commands
# ============================================
docker-build: ## Build Docker image
	docker build -t $(DOCKER_IMAGE) .

docker-up: ## Start all services with Docker Compose
	docker compose up -d

docker-down: ## Stop all services
	docker compose down

docker-restart: ## Restart all services
	docker compose restart

docker-logs: ## View logs
	docker compose logs -f $(SERVICE_NAME)

docker-logs-all: ## View all logs
	docker compose logs -f

docker-ps: ## List running containers
	docker compose ps

docker-exec: ## Execute bash in user-service container
	docker compose exec $(SERVICE_NAME) sh

docker-rebuild: ## Rebuild and restart user-service
	docker compose build $(SERVICE_NAME)
	docker compose up -d $(SERVICE_NAME)

# ============================================
# Database Commands
# ============================================
db-migrate: ## Run database migrations (manual)
	@echo "Migrations run automatically on startup"

db-shell: ## Connect to PostgreSQL
	docker compose exec postgres psql -U postgres -d epr_saas

db-reset: ## Reset database (WARNING: Deletes all data)
	docker compose down -v
	docker compose up -d postgres
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 5
	docker compose up -d $(SERVICE_NAME)

# ============================================
# Testing API
# ============================================
api-health: ## Test health endpoint
	curl http://localhost:8001/health

api-register: ## Register a test user
	curl -X POST http://localhost:8001/api/v1/auth/register \
		-H "Content-Type: application/json" \
		-d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

api-login: ## Login with test user
	curl -X POST http://localhost:8001/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email":"test@example.com","password":"password123"}'

# ============================================
# Production Commands
# ============================================
prod-build: ## Build optimized production image
	docker build --target=runtime -t $(DOCKER_IMAGE) .

prod-push: ## Push image to registry
	docker push $(DOCKER_IMAGE)

# ============================================
# Development Helpers
# ============================================
fmt: ## Format Go code
	go fmt ./...

lint: ## Run linter
	golangci-lint run

mod-update: ## Update dependencies
	go get -u ./...
	go mod tidy
