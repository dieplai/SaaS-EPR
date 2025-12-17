package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
}

type ServerConfig struct {
	Port string
	Env  string
}

type DatabaseConfig struct {
	URL string
}

type RedisConfig struct {
	URL string
}

type JWTConfig struct {
	Secret            string
	AccessExpiration  int
	RefreshExpiration int
}

func Load() (*Config, error) {
	godotenv.Load()

	accessExp, _ := strconv.Atoi(getEnv("JWT_ACCESS_EXPIRATION_MINUTES", "15"))
	refreshExp, _ := strconv.Atoi(getEnv("JWT_REFRESH_EXPIRATION_HOURS", "168"))

	config := &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8001"),
			Env:  getEnv("NODE_ENV", "development"),
		},
		Database: DatabaseConfig{
			URL: getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/epr_saas?sslmode=disable"),
		},
		Redis: RedisConfig{
			URL: getEnv("REDIS_URL", "redis://localhost:6379"),
		},
		JWT: JWTConfig{
			Secret:            getEnv("JWT_SECRET", "dev_secret_key_change_in_production"),
			AccessExpiration:  accessExp,
			RefreshExpiration: refreshExp,
		},
	}

	if err := config.Validate(); err != nil {
		return nil, err
	}

	return config, nil
}

func (c *Config) Validate() error {
	if c.Database.URL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.JWT.Secret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
