package http

import (
	"github.com/epr-legal/epr-backend/internal/identity/presentation/http/middleware"
	"github.com/epr-legal/epr-backend/internal/subscription/presentation/http/handler"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(
	router *gin.Engine,
	packageHandler *handler.PackageHandler,
	subscriptionHandler *handler.SubscriptionHandler,
	settingsHandler *handler.SettingsHandler,
	authMiddleware *middleware.AuthMiddleware,
) {
	api := router.Group("/api/v1")
	{
		packages := api.Group("/packages")
		{
			packages.GET("", packageHandler.List)
			packages.GET("/:id", packageHandler.GetByID)
		}

		packagesAdmin := api.Group("/admin/packages")
		packagesAdmin.Use(authMiddleware.RequireAuth())
		{
			packagesAdmin.POST("", packageHandler.Create)
			packagesAdmin.PUT("/:id", packageHandler.Update)
			packagesAdmin.DELETE("/:id", packageHandler.Delete)
		}

		// Admin Settings (requires auth)
		adminSettings := api.Group("/admin/settings")
		adminSettings.Use(authMiddleware.RequireAuth())
		{
			adminSettings.GET("/token-reset", settingsHandler.GetTokenResetSettings)
			adminSettings.PUT("/token-reset", settingsHandler.UpdateTokenResetSettings)
			adminSettings.GET("/free-account", settingsHandler.GetFreeAccountSettings)
			adminSettings.PUT("/free-account", settingsHandler.UpdateFreeAccountSettings)
		}

		subscriptions := api.Group("/subscriptions")
		subscriptions.Use(authMiddleware.RequireAuth())
		{
			subscriptions.POST("", subscriptionHandler.Create)
			subscriptions.GET("/current", subscriptionHandler.GetCurrent)
			subscriptions.POST("/consume-tokens", subscriptionHandler.ConsumeTokens)
			subscriptions.DELETE("/:id", subscriptionHandler.Cancel)
		}
	}
}
