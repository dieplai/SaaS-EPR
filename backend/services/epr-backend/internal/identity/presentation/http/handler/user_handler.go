package handler

import (
	"net/http"

	"github.com/epr-legal/epr-backend/internal/identity/application/query"
	"github.com/epr-legal/epr-backend/internal/identity/presentation/http/middleware"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	getUserProfileHandler *query.GetUserProfileHandler
}

func NewUserHandler(getUserProfileHandler *query.GetUserProfileHandler) *UserHandler {
	return &UserHandler{
		getUserProfileHandler: getUserProfileHandler,
	}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})
		return
	}

	q := query.GetUserProfileQuery{
		UserID: userID,
	}

	profile, err := h.getUserProfileHandler.Handle(c.Request.Context(), q)
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": profile,
	})
}
