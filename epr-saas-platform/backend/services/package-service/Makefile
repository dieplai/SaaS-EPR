.PHONY: help build run test clean docker-build docker-up docker-down docker-logs

# ============================================
# Variables
# ============================================
SERVICE_NAME=package-service
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

docker-run: ## Run service in Docker (standalone)
	docker run -p 8002:8002 --env-file .env $(DOCKER_IMAGE)

docker-logs: ## View logs
	docker logs -f $(SERVICE_NAME)

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

# ============================================
# Seed Data (for testing)
# ============================================
seed-packages: ## Seed sample packages
	@echo "Seeding sample packages..."
	@curl -X POST http://localhost:8002/api/v1/packages \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer YOUR_TOKEN" \
		-d '{"name":"Basic","description":"Basic plan for individuals","price":9.99,"query_limit":1000,"duration_days":30,"features":"[\"1000 queries/month\",\"Email support\"]"}'
	@curl -X POST http://localhost:8002/api/v1/packages \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer YOUR_TOKEN" \
		-d '{"name":"Pro","description":"Professional plan for teams","price":29.99,"query_limit":5000,"duration_days":30,"features":"[\"5000 queries/month\",\"Priority support\",\"API access\"]"}'
	@curl -X POST http://localhost:8002/api/v1/packages \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer YOUR_TOKEN" \
		-d '{"name":"Enterprise","description":"Enterprise plan for large organizations","price":99.99,"query_limit":50000,"duration_days":30,"features":"[\"50000 queries/month\",\"24/7 support\",\"Custom integration\"]"}'
