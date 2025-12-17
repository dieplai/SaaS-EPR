package middleware

import (
	"net/http"
	"strings"

	"github.com/epr-legal/epr-backend/internal/identity/infrastructure/security"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthMiddleware struct {
	jwtService *security.JWTService
}

func NewAuthMiddleware(jwtService *security.JWTService) *AuthMiddleware {
	return &AuthMiddleware{jwtService: jwtService}
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		var token string

		// Try 1: Get token from Authorization header (Bearer token)
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token = parts[1]
			} else {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "invalid authorization header format",
				})
				c.Abort()
				return
			}
		}

		// Try 2: Get token from HTTP-only cookie if Authorization header not present
		if token == "" {
			var err error
			token, err = c.Cookie("accessToken")
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "authentication required - missing or invalid token",
				})
				c.Abort()
				return
			}
		}

		// Validate the token
		claims, err := m.jwtService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid or expired token",
			})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Next()
	}
}

func GetUserID(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, ErrUnauthorized
	}

	id, ok := userID.(uuid.UUID)
	if !ok {
		return uuid.Nil, ErrUnauthorized
	}

	return id, nil
}

var ErrUnauthorized = &UnauthorizedError{Message: "unauthorized"}

type UnauthorizedError struct {
	Message string
}

func (e *UnauthorizedError) Error() string {
	return e.Message
}
