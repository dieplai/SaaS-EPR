package handler

import (
	"net/http"

	"github.com/epr-legal/epr-backend/internal/identity/application/command"
	"github.com/epr-legal/epr-backend/internal/identity/application/dto"
	"github.com/epr-legal/epr-backend/internal/identity/application/query"
	"github.com/epr-legal/epr-backend/internal/identity/infrastructure/security"
	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	subscriptioncommand "github.com/epr-legal/epr-backend/internal/subscription/application/command"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	registerHandler          *command.RegisterUserHandler
	loginHandler             *command.LoginUserHandler
	getUserProfileHandler    *query.GetUserProfileHandler
	jwtService               *security.JWTService
	cookieHelper             *CookieHelper
	createSubscriptionHandler *subscriptioncommand.CreateSubscriptionHandler
	packageRepo              packagedomain.Repository
}

func NewAuthHandler(
	registerHandler *command.RegisterUserHandler,
	loginHandler *command.LoginUserHandler,
	getUserProfileHandler *query.GetUserProfileHandler,
	jwtService *security.JWTService,
	cookieHelper *CookieHelper,
	createSubscriptionHandler *subscriptioncommand.CreateSubscriptionHandler,
	packageRepo packagedomain.Repository,
) *AuthHandler {
	return &AuthHandler{
		registerHandler:          registerHandler,
		loginHandler:             loginHandler,
		getUserProfileHandler:    getUserProfileHandler,
		jwtService:               jwtService,
		cookieHelper:             cookieHelper,
		createSubscriptionHandler: createSubscriptionHandler,
		packageRepo:              packageRepo,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
			"details": err.Error(),
		})
		return
	}

	cmd := command.RegisterUserCommand{
		Email:    req.Email,
		Password: req.Password,
		FullName: req.FullName,
	}

	userID, err := h.registerHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.Error(err)
		return
	}

	// Auto-assign FREE package to new user
	// Find FREE package (price = 0 or name = "Free")
	freePackage, err := h.packageRepo.FindByPrice(c.Request.Context(), 0)
	if err != nil {
		// Log error but don't fail registration
		c.JSON(http.StatusCreated, gin.H{
			"message": "user registered successfully (free package not assigned)",
			"user_id": userID.String(),
		})
		return
	}

	// Create subscription with FREE package
	subscriptionCmd := subscriptioncommand.CreateSubscriptionCommand{
		UserID:    userID,
		PackageID: freePackage.ID,
	}

	_, err = h.createSubscriptionHandler.Handle(c.Request.Context(), subscriptionCmd)
	if err != nil {
		// Log error but don't fail registration
		c.JSON(http.StatusCreated, gin.H{
			"message": "user registered successfully (subscription not created)",
			"user_id": userID.String(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "user registered successfully with free package",
		"user_id": userID.String(),
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Authenticate user
	cmd := command.LoginUserCommand{
		Email:    req.Email,
		Password: req.Password,
	}

	result, err := h.loginHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.Error(err)
		return
	}

	// Generate tokens
	accessToken, err := h.jwtService.GenerateAccessToken(result.UserID, result.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate access token",
		})
		return
	}

	refreshToken, err := h.jwtService.GenerateRefreshToken(result.UserID, result.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate refresh token",
		})
		return
	}

	// Calculate token durations based on remember me preference
	durations := GetTokenDurations(req.RememberMe)

	// Set secure HTTP-only cookies
	h.cookieHelper.SetAccessTokenCookie(c, accessToken, durations.AccessTokenMaxAge)
	h.cookieHelper.SetRefreshTokenCookie(c, refreshToken, durations.RefreshTokenMaxAge)

	// Fetch full user profile from database
	// This ensures we return accurate, up-to-date user information
	userProfile, err := h.getUserProfileHandler.Handle(c.Request.Context(), query.GetUserProfileQuery{
		UserID: result.UserID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch user profile",
		})
		return
	}

	// Return user profile only (tokens are in HTTP-only cookies)
	c.JSON(http.StatusOK, gin.H{
		"message": "login successful",
		"data": gin.H{
			"user": userProfile,
			// Security: Do NOT include tokens in response body
			// Tokens are securely stored in HTTP-only cookies
			"expires_in": h.jwtService.GetAccessExpiration(),
		},
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Try to get refresh token from cookie first, fallback to request body
	refreshToken, err := c.Cookie("refreshToken")
	if err != nil {
		// Try getting from request body (backward compatibility)
		var req struct {
			RefreshToken string `json:"refresh_token" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "missing refresh token",
			})
			return
		}
		refreshToken = req.RefreshToken
	}

	// Validate refresh token
	claims, err := h.jwtService.ValidateToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid or expired refresh token",
		})
		return
	}

	// Generate new access token
	accessToken, err := h.jwtService.GenerateAccessToken(claims.UserID, claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate access token",
		})
		return
	}

	// Set new access token as HTTP-only cookie
	h.cookieHelper.SetAccessTokenCookie(c, accessToken, 86400) // 1 day

	c.JSON(http.StatusOK, gin.H{
		"message": "token refreshed",
		"data": gin.H{
			"expires_in": h.jwtService.GetAccessExpiration(),
		},
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear authentication cookies using helper
	h.cookieHelper.ClearAuthCookies(c)

	c.JSON(http.StatusOK, gin.H{
		"message": "logged out successfully",
	})
}
