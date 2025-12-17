.PHONY: help build run dev test clean migrate

help:
	@echo "Available commands:"
	@echo "  make build    - Build the application"
	@echo "  make run      - Run the application"
	@echo "  make dev      - Run in development mode with air"
	@echo "  make test     - Run tests"
	@echo "  make clean    - Clean build artifacts"
	@echo "  make migrate  - Run database migrations"

build:
	go build -o bin/epr-backend cmd/api/main.go

run: build
	./bin/epr-backend

dev:
	air

test:
	go test ./... -v

clean:
	rm -rf bin/
	go clean

migrate:
	@echo "Running migrations..."
	go run cmd/api/main.go migrate

tidy:
	go mod tidy

install-tools:
	go install github.com/cosmtrek/air@latest
