package http

import (
	"github.com/epr-legal/epr-backend/internal/identity/presentation/http/middleware"
	"github.com/epr-legal/epr-backend/internal/payment/presentation/http/handler"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(
	router *gin.Engine,
	paymentHandler *handler.PaymentHandler,
	webhookHandler *handler.WebhookHandler,
	authMiddleware *middleware.AuthMiddleware,
) {
	api := router.Group("/api/v1")
	{
		// Payment endpoints (require authentication)
		payments := api.Group("/payments")
		payments.Use(authMiddleware.RequireAuth())
		{
			payments.POST("", paymentHandler.CreatePayment)
			payments.GET("/:id", paymentHandler.GetPayment)
		}

		// Webhook endpoints (public, signature verified in handler)
		webhooks := api.Group("/webhooks")
		{
			webhooks.POST("/sepay", webhookHandler.HandleSepayWebhook)
		}
	}
}
