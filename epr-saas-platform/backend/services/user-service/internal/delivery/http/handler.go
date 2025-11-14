package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/user-service/internal/domain"
	"github.com/yourusername/epr-saas/user-service/internal/usecase"
)

// AuthHandler handles HTTP requests for authentication
// Handler này xử lý TẤT CẢ HTTP requests liên quan đến auth
type AuthHandler struct {
	authUseCase usecase.AuthUseCase // Business logic layer
}

// NewAuthHandler creates a new auth handler
// Constructor - inject dependencies
func NewAuthHandler(authUseCase usecase.AuthUseCase) *AuthHandler {
	return &AuthHandler{
		authUseCase: authUseCase,
	}
}

// ============================================
// REGISTER ENDPOINT
// ============================================

// Register handles user registration
// POST /api/v1/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var input domain.CreateUserInput

	// 1. Bind and validate JSON input
	// Gin tự động validate theo struct tags: binding:"required,email"
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"details": err.Error(),
		})
		return
	}

	// 2. Call use case to register user
	authResponse, err := h.authUseCase.Register(c.Request.Context(), &input)
	if err != nil {
		// Map business errors to HTTP status codes
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Return success response
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    authResponse,
	})
}

// ============================================
// LOGIN ENDPOINT
// ============================================

// Login handles user authentication
// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var input domain.LoginInput

	// 1. Bind and validate JSON input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"details": err.Error(),
		})
		return
	}

	// 2. Call use case to login
	authResponse, err := h.authUseCase.Login(c.Request.Context(), &input)
	if err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Return success response with tokens
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    authResponse,
	})
}

// ============================================
// REFRESH TOKEN ENDPOINT
// ============================================

// RefreshToken generates a new access token
// POST /api/v1/auth/refresh
// Body: { "refresh_token": "..." }
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var input struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	// 1. Bind JSON input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Refresh token is required",
		})
		return
	}

	// 2. Call use case to refresh token
	authResponse, err := h.authUseCase.RefreshToken(c.Request.Context(), input.RefreshToken)
	if err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Return new tokens
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    authResponse,
	})
}

// ============================================
// LOGOUT ENDPOINT
// ============================================

// Logout revokes a refresh token
// POST /api/v1/auth/logout
// Header: Authorization: Bearer <access_token>
// Body: { "refresh_token": "..." }
func (h *AuthHandler) Logout(c *gin.Context) {
	// 1. Get user ID from JWT (set by auth middleware)
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// 2. Get refresh token from body
	var input struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Refresh token is required",
		})
		return
	}

	// 3. Call use case to logout
	if err := h.authUseCase.Logout(c.Request.Context(), userID, input.RefreshToken); err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 4. Return success
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})
}

// ============================================
// LOGOUT ALL ENDPOINT
// ============================================

// LogoutAll revokes all refresh tokens (logout from all devices)
// POST /api/v1/auth/logout-all
// Header: Authorization: Bearer <access_token>
func (h *AuthHandler) LogoutAll(c *gin.Context) {
	// 1. Get user ID from JWT
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// 2. Call use case to logout from all devices
	if err := h.authUseCase.LogoutAll(c.Request.Context(), userID); err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Return success
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out from all devices",
	})
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// mapErrorToHTTP maps business errors to HTTP status codes and messages
// Function này convert từ business errors sang HTTP responses
func mapErrorToHTTP(err error) (statusCode int, message string) {
	switch err {
	case usecase.ErrEmailAlreadyExists:
		return http.StatusConflict, "Email already exists"

	case usecase.ErrInvalidCredentials:
		return http.StatusUnauthorized, "Invalid email or password"

	case usecase.ErrAccountInactive:
		return http.StatusForbidden, "Account is inactive or deleted"

	case usecase.ErrInvalidRefreshToken:
		return http.StatusUnauthorized, "Invalid refresh token"

	case usecase.ErrRefreshTokenExpired:
		return http.StatusUnauthorized, "Refresh token has expired"

	default:
		return http.StatusInternalServerError, "Internal server error"
	}
}

// ============================================
// REGISTER ROUTES
// ============================================

// RegisterRoutes registers all auth routes to the router
// Function này đăng ký TẤT CẢ routes cho auth
func (h *AuthHandler) RegisterRoutes(router *gin.RouterGroup, jwtMiddleware *JWTMiddleware) {
	// Public routes (không cần authentication)
	auth := router.Group("/auth")
	{
		auth.POST("/register", h.Register)       // POST /api/v1/auth/register
		auth.POST("/login", h.Login)             // POST /api/v1/auth/login
		auth.POST("/refresh", h.RefreshToken)    // POST /api/v1/auth/refresh
	}

	// Protected routes (cần authentication middleware)
	authProtected := router.Group("/auth")
	authProtected.Use(jwtMiddleware.Authenticate()) // Apply JWT middleware
	{
		authProtected.POST("/logout", h.Logout)         // POST /api/v1/auth/logout
		authProtected.POST("/logout-all", h.LogoutAll)  // POST /api/v1/auth/logout-all
	}
}
