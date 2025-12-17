package middleware

import (
	"errors"
	"net/http"
	"os"

	"github.com/epr-legal/epr-backend/internal/shared/domain"
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

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get allowed origins from environment variable
		// Default: localhost:3000, localhost:3001, localhost:8080
		allowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
		if allowedOrigins == "" {
			allowedOrigins = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8080"
		}

		// Get the origin from the request
		origin := c.Request.Header.Get("Origin")

		// For HTTP-only cookie support, we need to set a specific origin (not wildcard)
		// Check if the request origin is in our allowed list
		if origin != "" && isOriginAllowed(origin, allowedOrigins) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func isOriginAllowed(origin string, allowedOrigins string) bool {
	allowed := false
	if allowedOrigins == "*" {
		allowed = true
	} else {
		// Parse comma-separated list of allowed origins
		// Format: "http://localhost:3000,http://localhost:3001"
		originList := parseAllowedOrigins(allowedOrigins)
		for _, o := range originList {
			if origin == o {
				allowed = true
				break
			}
		}
	}
	return allowed
}

func parseAllowedOrigins(origins string) []string {
	var result []string
	for i := 0; i < len(origins); i++ {
		var origin string
		j := i
		for j < len(origins) && origins[j] != ',' {
			j++
		}
		origin = origins[i:j]
		// Trim whitespace
		for len(origin) > 0 && origin[0] == ' ' {
			origin = origin[1:]
		}
		for len(origin) > 0 && origin[len(origin)-1] == ' ' {
			origin = origin[:len(origin)-1]
		}
		if origin != "" {
			result = append(result, origin)
		}
		i = j
	}
	return result
}
