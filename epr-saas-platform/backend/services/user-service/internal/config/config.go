package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
// Struct này chứa TẤT CẢ config của app
type Config struct {
	// Server settings
	Port string
	Env  string // development, production

	// Database
	DatabaseURL string

	// Redis
	RedisURL string

	// JWT
	JWTSecret           string
	JWTAccessExpiration time.Duration // 15 minutes
	JWTRefreshExpiration time.Duration // 7 days

	// CORS
	CORSOrigins []string
}

// Load reads configuration from environment variables
// Function này đọc config từ .env file và environment variables
func Load() (*Config, error) {
	// Load .env file (chỉ trong development)
	// Trong production (VPS), dùng environment variables thật
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load("../../.env"); err != nil {
			// Không tìm thấy .env, thử path khác
			_ = godotenv.Load(".env")
		}
	}

	cfg := &Config{
		// Server
		Port: getEnv("PORT", "8001"), // Default port 8001
		Env:  getEnv("NODE_ENV", "development"),

		// Database
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/epr_saas"),

		// Redis
		RedisURL: getEnv("REDIS_URL", "redis://localhost:6379"),

		// JWT
		JWTSecret:            getEnv("JWT_SECRET", "your-secret-key-change-this"),
		JWTAccessExpiration:  parseDuration(getEnv("JWT_ACCESS_EXPIRATION", "15m"), 15*time.Minute),
		JWTRefreshExpiration: parseDuration(getEnv("JWT_REFRESH_EXPIRATION", "168h"), 168*time.Hour), // 7 days

		// CORS
		CORSOrigins: []string{
			"http://localhost:3000", // React dev server
			"http://localhost:8000", // API Gateway
		},
	}

	// Validate required fields
	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// Validate checks if all required configuration is present
func (c *Config) Validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}

	if c.JWTSecret == "" || c.JWTSecret == "your-secret-key-change-this" {
		return fmt.Errorf("JWT_SECRET must be set and changed from default")
	}

	return nil
}

// Helper functions

// getEnv reads an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvAsInt reads an environment variable as integer
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}

	return value
}

// parseDuration parses a duration string (e.g., "15m", "24h")
func parseDuration(value string, defaultValue time.Duration) time.Duration {
	duration, err := time.ParseDuration(value)
	if err != nil {
		return defaultValue
	}
	return duration
}

// IsDevelopment checks if app is running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Env == "development"
}

// IsProduction checks if app is running in production mode
func (c *Config) IsProduction() bool {
	return c.Env == "production"
}
