# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install golang-migrate CLI
RUN apk add --no-cache curl && \
    curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar xvz && \
    mv migrate /usr/local/bin/migrate && \
    chmod +x /usr/local/bin/migrate

# Copy service code (context is now ./backend)
COPY services/epr-backend/go.mod services/epr-backend/go.sum ./
RUN go mod download

COPY services/epr-backend/ ./

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o epr-backend cmd/api/main.go

# Run stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates postgresql-client

WORKDIR /root/

# Copy migrate binary
COPY --from=builder /usr/local/bin/migrate /usr/local/bin/migrate

# Copy application
COPY --from=builder /app/epr-backend .

# Copy migrations into image (CRITICAL for golang-migrate)
# Source is from build context (./backend), not from /app in builder
COPY database/migrations /migrations

# Copy seeds
COPY database/seeds /seeds

EXPOSE 8001

CMD ["./epr-backend"]
