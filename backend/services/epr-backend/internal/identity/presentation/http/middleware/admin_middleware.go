package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AdminMiddleware struct {
	authMiddleware *AuthMiddleware
}

func NewAdminMiddleware(authMiddleware *AuthMiddleware) *AdminMiddleware {
	return &AdminMiddleware{
		authMiddleware: authMiddleware,
	}
}

func (m *AdminMiddleware) RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get role from context (set by AuthMiddleware)
		role, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "unauthorized - no role information",
			})
			c.Abort()
			return
		}

		// Check if user has admin role
		roleStr, ok := role.(string)
		if !ok || roleStr != "admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "forbidden - admin access required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
