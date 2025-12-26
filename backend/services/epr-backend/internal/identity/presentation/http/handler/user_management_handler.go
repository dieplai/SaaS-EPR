package handler

import (
	"net/http"

	"github.com/epr-legal/epr-backend/internal/identity/application/command"
	"github.com/epr-legal/epr-backend/internal/identity/application/query"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserManagementHandler struct {
	listUsersHandler      *query.ListUsersHandler
	createUserHandler     *command.CreateUserAdminHandler
	updateUserHandler     *command.UpdateUserHandler
	deleteUserHandler     *command.DeleteUserHandler
	changeUserRoleHandler *command.ChangeUserRoleHandler
}

func NewUserManagementHandler(
	listUsersHandler *query.ListUsersHandler,
	createUserHandler *command.CreateUserAdminHandler,
	updateUserHandler *command.UpdateUserHandler,
	deleteUserHandler *command.DeleteUserHandler,
	changeUserRoleHandler *command.ChangeUserRoleHandler,
) *UserManagementHandler {
	return &UserManagementHandler{
		listUsersHandler:      listUsersHandler,
		createUserHandler:     createUserHandler,
		updateUserHandler:     updateUserHandler,
		deleteUserHandler:     deleteUserHandler,
		changeUserRoleHandler: changeUserRoleHandler,
	}
}

func (h *UserManagementHandler) ListUsers(c *gin.Context) {
	users, err := h.listUsersHandler.Handle(c.Request.Context(), query.ListUsersQuery{})
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": users,
	})
}

func (h *UserManagementHandler) CreateUser(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		FullName string `json:"full_name" binding:"required"`
		Role     string `json:"role"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request",
			"details": err.Error(),
		})
		return
	}

	// Default to "user" if role not specified
	if req.Role == "" {
		req.Role = "user"
	}

	cmd := command.CreateUserAdminCommand{
		Email:    req.Email,
		Password: req.Password,
		FullName: req.FullName,
		Role:     req.Role,
	}

	userID, err := h.createUserHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "user created successfully",
		"user_id": userID.String(),
	})
}

func (h *UserManagementHandler) UpdateUser(c *gin.Context) {
	userIDParam := c.Param("id")
	userID, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid user ID",
		})
		return
	}

	var req struct {
		FullName *string `json:"full_name"`
		Phone    *string `json:"phone"`
		Company  *string `json:"company"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request",
			"details": err.Error(),
		})
		return
	}

	cmd := command.UpdateUserCommand{
		UserID:   userID,
		FullName: req.FullName,
		Phone:    req.Phone,
		Company:  req.Company,
	}

	if err := h.updateUserHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user updated successfully",
	})
}

func (h *UserManagementHandler) DeleteUser(c *gin.Context) {
	userIDParam := c.Param("id")
	userID, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid user ID",
		})
		return
	}

	cmd := command.DeleteUserCommand{
		UserID: userID,
	}

	if err := h.deleteUserHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user deleted successfully",
	})
}

func (h *UserManagementHandler) ChangeUserRole(c *gin.Context) {
	userIDParam := c.Param("id")
	userID, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid user ID",
		})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request",
			"details": err.Error(),
		})
		return
	}

	cmd := command.ChangeUserRoleCommand{
		UserID:  userID,
		NewRole: req.Role,
	}

	if err := h.changeUserRoleHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user role changed successfully",
	})
}
