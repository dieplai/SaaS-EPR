.PHONY: help build run dev stop logs test clean docker-build docker-run docker-stop

SERVICE_NAME=epr-chatbot-service
DOCKER_IMAGE=epr-chatbot-service:latest
DOCKER_CONTAINER=epr-chatbot-service
PORT=8002

help:
	@echo "🚀 EPR Chatbot Service - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Run in development mode (with auto-reload)"
	@echo "  make install      - Install dependencies"
	@echo "  make run          - Run the service"
	@echo "  make stop         - Stop the running service"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo "  make docker-stop  - Stop Docker container"
	@echo ""
	@echo "Utility:"
	@echo "  make logs         - View service logs"
	@echo "  make test         - Run tests"
	@echo "  make clean        - Clean up Python cache"
	@echo "  make help         - Show this help message"

install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt

dev:
	@echo "🔄 Starting service in development mode..."
	uvicorn fastapi_server:app --reload --host 0.0.0.0 --port $(PORT)

run:
	@echo "🚀 Starting service..."
	uvicorn fastapi_server:app --host 0.0.0.0 --port $(PORT)

stop:
	@echo "🛑 Stopping service..."
	pkill -f "uvicorn fastapi_server"

logs:
	@echo "📋 Service logs:"
	tail -f logs/app.log 2>/dev/null || echo "No log file found"

test:
	@echo "🧪 Running tests..."
	pytest tests/ -v || echo "No tests found"

clean:
	@echo "🧹 Cleaning Python cache..."
	find . -type f -name '*.pyc' -delete
	find . -type d -name '__pycache__' -delete
	find . -type d -name '.pytest_cache' -delete
	find . -type d -name '.egg-info' -delete

docker-build:
	@echo "🐳 Building Docker image: $(DOCKER_IMAGE)"
	docker build -t $(DOCKER_IMAGE) .

docker-run:
	@echo "🐳 Running Docker container: $(DOCKER_CONTAINER)"
	docker run -d \
		--name $(DOCKER_CONTAINER) \
		-p $(PORT):8002 \
		--env-file .env \
		-v $(PWD)/logs:/app/logs \
		-v $(PWD)/data:/app/data \
		$(DOCKER_IMAGE)
	@echo "✅ Container started. API at http://localhost:$(PORT)/api/v1/health"

docker-stop:
	@echo "🛑 Stopping Docker container: $(DOCKER_CONTAINER)"
	docker stop $(DOCKER_CONTAINER) 2>/dev/null || true
	docker rm $(DOCKER_CONTAINER) 2>/dev/null || true
	@echo "✅ Container stopped"

docker-logs:
	@echo "📋 Docker container logs:"
	docker logs -f $(DOCKER_CONTAINER)

.DEFAULT_GOAL := help
