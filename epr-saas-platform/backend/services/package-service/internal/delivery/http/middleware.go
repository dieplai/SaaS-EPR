package http

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/yourusername/epr-saas/package-service/internal/config"
)

// JWTClaims represents the JWT claims structure (same as User Service)
type JWTClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// JWTMiddleware provides JWT authentication middleware
type JWTMiddleware struct {
	cfg *config.Config
}

// NewJWTMiddleware creates a new JWT middleware
func NewJWTMiddleware(cfg *config.Config) *JWTMiddleware {
	return &JWTMiddleware{
		cfg: cfg,
	}
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

// Authenticate verifies JWT token from User Service
func (m *JWTMiddleware) Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			c.Abort()
			return
		}

		// 2. Parse "Bearer <token>" format
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format. Use: Bearer <token>",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 3. Parse and verify JWT token
		token, err := jwt.ParseWithClaims(
			tokenString,
			&JWTClaims{},
			func(token *jwt.Token) (interface{}, error) {
				// Verify signing method
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(m.cfg.JWTSecret), nil
			},
		)

		// 4. Handle parsing errors
		if err != nil {
			statusCode, message := mapJWTErrorToHTTP(err)
			c.JSON(statusCode, gin.H{
				"error": message,
			})
			c.Abort()
			return
		}

		// 5. Validate token and extract claims
		if !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*JWTClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token claims",
			})
			c.Abort()
			return
		}

		// 6. Set user info in context for handlers to use
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)

		// 7. Continue to next handler
		c.Next()
	}
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// mapJWTErrorToHTTP maps JWT errors to HTTP status codes and messages
func mapJWTErrorToHTTP(err error) (statusCode int, message string) {
	switch {
	case err == jwt.ErrTokenExpired:
		return http.StatusUnauthorized, "Token has expired"

	case err == jwt.ErrTokenNotValidYet:
		return http.StatusUnauthorized, "Token not valid yet"

	case err == jwt.ErrSignatureInvalid:
		return http.StatusUnauthorized, "Invalid token signature"

	case strings.Contains(err.Error(), "token is malformed"):
		return http.StatusUnauthorized, "Malformed token"

	default:
		return http.StatusUnauthorized, "Invalid token"
	}
}

// ============================================
// CORS MIDDLEWARE
// ============================================

// CORS provides Cross-Origin Resource Sharing middleware
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// ============================================
// LOGGING MIDDLEWARE
// ============================================

// Logger logs HTTP requests for debugging
func Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return param.TimeStamp.Format("2006-01-02 15:04:05") +
			" | " + param.Method +
			" | " + param.Path +
			" | " + param.StatusCodeColor() + string(rune(param.StatusCode)) + param.ResetColor() +
			" | " + param.Latency.String() +
			" | " + param.ClientIP +
			"\n"
	})
}
