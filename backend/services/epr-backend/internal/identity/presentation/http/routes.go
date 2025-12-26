package http

import (
	"github.com/epr-legal/epr-backend/internal/identity/presentation/http/handler"
	"github.com/epr-legal/epr-backend/internal/identity/presentation/http/middleware"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(
	router *gin.Engine,
	authHandler *handler.AuthHandler,
	userHandler *handler.UserHandler,
	userManagementHandler *handler.UserManagementHandler,
	authMiddleware *middleware.AuthMiddleware,
	adminMiddleware *middleware.AdminMiddleware,
) {
	api := router.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/logout", authHandler.Logout)
		}

		users := api.Group("/users")
		users.Use(authMiddleware.RequireAuth())
		{
			users.GET("/profile", userHandler.GetProfile)
		}

		// Admin routes - user management
		admin := api.Group("/admin")
		admin.Use(authMiddleware.RequireAuth())
		admin.Use(adminMiddleware.RequireAdmin())
		{
			admin.GET("/users", userManagementHandler.ListUsers)
			admin.POST("/users", userManagementHandler.CreateUser)
			admin.PUT("/users/:id", userManagementHandler.UpdateUser)
			admin.DELETE("/users/:id", userManagementHandler.DeleteUser)
			admin.PATCH("/users/:id/role", userManagementHandler.ChangeUserRole)
		}
	}
}
