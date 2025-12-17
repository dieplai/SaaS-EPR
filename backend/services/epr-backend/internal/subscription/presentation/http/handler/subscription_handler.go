package handler

import (
	"net/http"

	"github.com/epr-legal/epr-backend/internal/identity/presentation/http/middleware"
	"github.com/epr-legal/epr-backend/internal/subscription/application/command"
	"github.com/epr-legal/epr-backend/internal/subscription/application/dto"
	"github.com/epr-legal/epr-backend/internal/subscription/application/query"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SubscriptionHandler struct {
	createHandler       *command.CreateSubscriptionHandler
	cancelHandler       *command.CancelSubscriptionHandler
	consumeTokensHandler *command.ConsumeTokensHandler
	getHandler          *query.GetSubscriptionHandler
}

func NewSubscriptionHandler(
	createHandler *command.CreateSubscriptionHandler,
	cancelHandler *command.CancelSubscriptionHandler,
	consumeTokensHandler *command.ConsumeTokensHandler,
	getHandler *query.GetSubscriptionHandler,
) *SubscriptionHandler {
	return &SubscriptionHandler{
		createHandler:       createHandler,
		cancelHandler:       cancelHandler,
		consumeTokensHandler: consumeTokensHandler,
		getHandler:          getHandler,
	}
}

func (h *SubscriptionHandler) Create(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})
		return
	}

	var req dto.CreateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": err.Error(),
		})
		return
	}

	cmd := command.CreateSubscriptionCommand{
		UserID:    userID,
		PackageID: req.PackageID,
	}

	subscriptionID, err := h.createHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":         "subscription created successfully",
		"subscription_id": subscriptionID.String(),
	})
}

func (h *SubscriptionHandler) Cancel(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})
		return
	}

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid subscription ID",
		})
		return
	}

	cmd := command.CancelSubscriptionCommand{
		SubscriptionID: subscriptionID,
		UserID:         userID,
	}

	if err := h.cancelHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "subscription canceled successfully",
	})
}

func (h *SubscriptionHandler) GetCurrent(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})
		return
	}

	q := query.GetSubscriptionQuery{
		UserID: userID,
	}

	sub, err := h.getHandler.Handle(c.Request.Context(), q)
	if err != nil {
		c.Error(err)
		return
	}

	if sub == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "no active subscription found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": sub,
	})
}

func (h *SubscriptionHandler) ConsumeTokens(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})
		return
	}

	var req dto.ConsumeTokensRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": err.Error(),
		})
		return
	}

	cmd := command.ConsumeTokensCommand{
		UserID:     userID,
		TokenCount: req.TokenCount,
	}

	if err := h.consumeTokensHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "tokens consumed successfully",
	})
}
