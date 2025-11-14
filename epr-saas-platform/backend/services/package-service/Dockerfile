# ============================================
# STAGE 1: Build stage
# ============================================
FROM golang:1.23-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/package-service ./cmd/main.go

# ============================================
# STAGE 2: Runtime stage
# ============================================
FROM alpine:latest

# Install CA certificates for HTTPS and wget for healthcheck
RUN apk --no-cache add ca-certificates tzdata wget

# Set timezone
ENV TZ=Asia/Ho_Chi_Minh

# Create non-root user for security
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/package-service .

# Copy .env if exists (optional)
COPY --from=builder /app/.env* ./

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8002/health || exit 1

# Run the application
CMD ["./package-service"]
