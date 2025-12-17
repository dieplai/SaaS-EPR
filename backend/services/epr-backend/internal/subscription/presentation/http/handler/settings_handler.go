package handler

import (
	"net/http"

	"github.com/epr-legal/epr-backend/internal/identity/presentation/http/middleware"
	"github.com/epr-legal/epr-backend/internal/subscription/application/command"
	"github.com/epr-legal/epr-backend/internal/subscription/application/query"
	"github.com/gin-gonic/gin"
)

type SettingsHandler struct {
	getSettingsHandler           *query.GetTokenResetSettingsHandler
	updateSettingsHandler        *command.UpdateTokenResetSettingsHandler
	getFreeAccountSettingsHandler *query.GetFreeAccountSettingsHandler
	updateFreeAccountSettingsHandler *command.UpdateFreeAccountSettingsHandler
}

func NewSettingsHandler(
	getSettingsHandler *query.GetTokenResetSettingsHandler,
	updateSettingsHandler *command.UpdateTokenResetSettingsHandler,
	getFreeAccountSettingsHandler *query.GetFreeAccountSettingsHandler,
	updateFreeAccountSettingsHandler *command.UpdateFreeAccountSettingsHandler,
) *SettingsHandler {
	return &SettingsHandler{
		getSettingsHandler:           getSettingsHandler,
		updateSettingsHandler:        updateSettingsHandler,
		getFreeAccountSettingsHandler: getFreeAccountSettingsHandler,
		updateFreeAccountSettingsHandler: updateFreeAccountSettingsHandler,
	}
}

type UpdateTokenResetSettingsRequest struct {
	Enabled   bool `json:"enabled"`
	CycleDays int  `json:"cycle_days" binding:"required,min=1,max=365"`
}

func (h *SettingsHandler) GetTokenResetSettings(c *gin.Context) {
	settings, err := h.getSettingsHandler.Handle(c.Request.Context(), query.GetTokenResetSettingsQuery{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get token reset settings",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": settings,
	})
}

func (h *SettingsHandler) UpdateTokenResetSettings(c *gin.Context) {
	var req UpdateTokenResetSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userUUID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	cmd := command.UpdateTokenResetSettingsCommand{
		Enabled:   req.Enabled,
		CycleDays: req.CycleDays,
		UpdatedBy: userUUID,
	}

	if err := h.updateSettingsHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token reset settings updated successfully",
	})
}

type UpdateFreeAccountSettingsRequest struct {
	TokenLimit int `json:"token_limit" binding:"required,min=100,max=100000"`
}

func (h *SettingsHandler) GetFreeAccountSettings(c *gin.Context) {
	settings, err := h.getFreeAccountSettingsHandler.Handle(c.Request.Context(), query.GetFreeAccountSettingsQuery{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get free account settings",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": settings,
	})
}

func (h *SettingsHandler) UpdateFreeAccountSettings(c *gin.Context) {
	var req UpdateFreeAccountSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userUUID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	cmd := command.UpdateFreeAccountSettingsCommand{
		TokenLimit: req.TokenLimit,
		UpdatedBy:  userUUID,
	}

	if err := h.updateFreeAccountSettingsHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Free account settings updated successfully",
	})
}
