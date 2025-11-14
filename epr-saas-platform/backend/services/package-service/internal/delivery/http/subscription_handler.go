package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/package-service/internal/domain"
	"github.com/yourusername/epr-saas/package-service/internal/usecase"
)

// SubscriptionHandler handles HTTP requests for subscriptions
type SubscriptionHandler struct {
	subscriptionUseCase usecase.SubscriptionUseCase
}

// NewSubscriptionHandler creates a new subscription handler
func NewSubscriptionHandler(subscriptionUseCase usecase.SubscriptionUseCase) *SubscriptionHandler {
	return &SubscriptionHandler{
		subscriptionUseCase: subscriptionUseCase,
	}
}

// ============================================
// CREATE SUBSCRIPTION
// ============================================

// CreateSubscription handles subscription creation
// POST /api/v1/subscriptions
func (h *SubscriptionHandler) CreateSubscription(c *gin.Context) {
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

	// 2. Bind JSON input
	var input struct {
		PackageID string `json:"package_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"details": err.Error(),
		})
		return
	}

	packageID, err := uuid.Parse(input.PackageID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID",
		})
		return
	}

	// 3. Create subscription input
	createInput := &domain.CreateSubscriptionInput{
		UserID:    userID,
		PackageID: packageID,
	}

	// 4. Call use case to create subscription
	sub, err := h.subscriptionUseCase.CreateSubscription(c.Request.Context(), createInput)
	if err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 5. Return success response
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    sub.ToResponse(),
	})
}

// ============================================
// GET SUBSCRIPTION
// ============================================

// GetSubscription retrieves a subscription by ID
// GET /api/v1/subscriptions/:id
func (h *SubscriptionHandler) GetSubscription(c *gin.Context) {
	// 1. Parse ID from URL
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID",
		})
		return
	}

	// 2. Get subscription
	sub, err := h.subscriptionUseCase.GetSubscription(c.Request.Context(), id)
	if err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Verify ownership (user can only view their own subscriptions)
	userIDStr, _ := c.Get("userID")
	if sub.UserID.String() != userIDStr.(string) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	// 4. Return response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sub.ToResponse(),
	})
}

// ============================================
// GET MY SUBSCRIPTIONS
// ============================================

// GetMySubscriptions retrieves all subscriptions for the authenticated user
// GET /api/v1/subscriptions/me
func (h *SubscriptionHandler) GetMySubscriptions(c *gin.Context) {
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

	// 2. Get subscriptions
	subscriptions, err := h.subscriptionUseCase.GetUserSubscriptions(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve subscriptions",
		})
		return
	}

	// 3. Convert to response format
	responses := make([]*domain.SubscriptionResponse, len(subscriptions))
	for i, sub := range subscriptions {
		responses[i] = sub.ToResponse()
	}

	// 4. Return response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    responses,
	})
}

// ============================================
// GET ACTIVE SUBSCRIPTION
// ============================================

// GetMyActiveSubscription retrieves the active subscription for the authenticated user
// GET /api/v1/subscriptions/me/active
func (h *SubscriptionHandler) GetMyActiveSubscription(c *gin.Context) {
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

	// 2. Get active subscription
	sub, err := h.subscriptionUseCase.GetActiveSubscription(c.Request.Context(), userID)
	if err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Return response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sub.ToResponse(),
	})
}

// ============================================
// CANCEL SUBSCRIPTION
// ============================================

// CancelSubscription cancels a subscription
// POST /api/v1/subscriptions/:id/cancel
func (h *SubscriptionHandler) CancelSubscription(c *gin.Context) {
	// 1. Parse ID from URL
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID",
		})
		return
	}

	// 2. Get subscription to verify ownership
	sub, err := h.subscriptionUseCase.GetSubscription(c.Request.Context(), id)
	if err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Verify ownership
	userIDStr, _ := c.Get("userID")
	if sub.UserID.String() != userIDStr.(string) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	// 4. Call use case to cancel subscription
	if err := h.subscriptionUseCase.CancelSubscription(c.Request.Context(), id); err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 5. Return success response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Subscription canceled successfully",
	})
}

// ============================================
// CHECK QUOTA
// ============================================

// CheckQuota checks if user can make a query
// GET /api/v1/subscriptions/check-quota
func (h *SubscriptionHandler) CheckQuota(c *gin.Context) {
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

	// 2. Check if user can query
	canQuery, err := h.subscriptionUseCase.CanUserQuery(c.Request.Context(), userID)
	if err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error":     message,
			"can_query": false,
		})
		return
	}

	// 3. Return response
	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"can_query": canQuery,
	})
}

// ============================================
// RECORD QUERY
// ============================================

// RecordQuery records a query usage (called by AI Chatbot service)
// POST /api/v1/subscriptions/record-query
func (h *SubscriptionHandler) RecordQuery(c *gin.Context) {
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

	// 2. Record query
	if err := h.subscriptionUseCase.RecordQuery(c.Request.Context(), userID); err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Return success response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Query recorded successfully",
	})
}
