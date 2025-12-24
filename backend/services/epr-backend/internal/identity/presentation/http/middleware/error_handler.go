package middleware

import (
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err

			switch {
			case errors.Is(err, domain.ErrNotFound):
				c.JSON(http.StatusNotFound, gin.H{
					"error": err.Error(),
				})
			case errors.Is(err, domain.ErrAlreadyExists):
				c.JSON(http.StatusConflict, gin.H{
					"error": err.Error(),
				})
			case errors.Is(err, domain.ErrInvalidInput):
				c.JSON(http.StatusBadRequest, gin.H{
					"error": err.Error(),
				})
			case errors.Is(err, domain.ErrUnauthorized):
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": err.Error(),
				})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "internal server error",
				})
			}
		}
	}
}

// CORS returns a gin middleware with proper CORS configuration
func CORS() gin.HandlerFunc {
	// Get allowed origins from environment variable
	// Default: localhost:3000, localhost:3001, localhost:8080
	allowedOriginsEnv := os.Getenv("CORS_ALLOWED_ORIGINS")
	if allowedOriginsEnv == "" {
		allowedOriginsEnv = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8080"
	}

	// Parse comma-separated origins
	allowedOrigins := strings.Split(allowedOriginsEnv, ",")
	for i, origin := range allowedOrigins {
		allowedOrigins[i] = strings.TrimSpace(origin)
	}

	config := cors.DefaultConfig()
	config.AllowOrigins = allowedOrigins
	config.AllowCredentials = true
	config.AllowHeaders = append(config.AllowHeaders, "Authorization")
	config.MaxAge = 12 * 3600 // 12 hours

	return cors.New(config)
}
