package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	// Server settings
	Port string
	Env  string // development, production

	// Database
	DatabaseURL string

	// Redis
	RedisURL string

	// JWT (for verifying tokens from User Service)
	JWTSecret string

	// User Service (for service-to-service communication)
	UserServiceURL string
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file (only in development)
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load("../../.env"); err != nil {
			_ = godotenv.Load(".env")
		}
	}

	cfg := &Config{
		// Server
		Port: getEnv("PORT", "8002"), // Port 8002 for package-service
		Env:  getEnv("NODE_ENV", "development"),

		// Database
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/epr_saas"),

		// Redis
		RedisURL: getEnv("REDIS_URL", "redis://localhost:6379"),

		// JWT (same secret as User Service to verify tokens)
		JWTSecret: getEnv("JWT_SECRET", "your-secret-key-change-this"),

		// User Service URL
		UserServiceURL: getEnv("USER_SERVICE_URL", "http://localhost:8001"),
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

// IsDevelopment checks if app is running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Env == "development"
}

// IsProduction checks if app is running in production mode
func (c *Config) IsProduction() bool {
	return c.Env == "production"
}
