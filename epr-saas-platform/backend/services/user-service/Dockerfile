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
# CGO_ENABLED=0: Static binary (no C dependencies)
# -ldflags="-w -s": Strip debug info to reduce binary size
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/user-service ./cmd/main.go

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
COPY --from=builder /app/user-service .

# Copy .env if exists (optional, prefer env vars in production)
COPY --from=builder /app/.env* ./

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8001/health || exit 1

# Run the application
CMD ["./user-service"]
