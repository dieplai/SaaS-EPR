package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/epr-legal/epr-backend/internal/payment/application/command"
	"github.com/epr-legal/epr-backend/internal/payment/infrastructure/sepay"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type WebhookHandler struct {
	confirmPaymentHandler *command.ConfirmPaymentHandler
	sepayClient           *sepay.Client
}

func NewWebhookHandler(
	confirmPaymentHandler *command.ConfirmPaymentHandler,
	sepayClient *sepay.Client,
) *WebhookHandler {
	return &WebhookHandler{
		confirmPaymentHandler: confirmPaymentHandler,
		sepayClient:           sepayClient,
	}
}

// SepayWebhookPayload represents the webhook payload from SePay
// Documentation: https://docs.sepay.vn/tich-hop-webhooks.html
type SepayWebhookPayload struct {
	ID              int64   `json:"id"`
	Gateway         string  `json:"gateway"`
	TransactionDate string  `json:"transactionDate"` // Format: "2024-07-25 14:02:37"
	AccountNumber   string  `json:"accountNumber"`
	Code            *string `json:"code"`
	Content         string  `json:"content"`
	TransferType    string  `json:"transferType"` // "in" or "out"
	TransferAmount  float64 `json:"transferAmount"`
	Accumulated     float64 `json:"accumulated"`
	ReferenceCode   string  `json:"referenceCode"`
	Description     string  `json:"description"`
}

// HandleSepayWebhook handles incoming SePay webhook notifications
func (h *WebhookHandler) HandleSepayWebhook(c *gin.Context) {
	// Read request body for signature verification
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read request body"})
		return
	}

	// Verify webhook signature (if configured)
	signature := c.GetHeader("X-Sepay-Signature")
	if signature != "" && !h.sepayClient.VerifyWebhookSignature(signature, body) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
		return
	}

	// Parse webhook payload
	var payload SepayWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Only process incoming transfers
	if payload.TransferType != "in" {
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "ignored outgoing transfer"})
		return
	}

	// Parse transaction date
	transactionDate, err := time.Parse("2006-01-02 15:04:05", payload.TransactionDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid transaction date format"})
		return
	}

	// Convert amount to decimal
	amount := decimal.NewFromFloat(payload.TransferAmount)

	// Confirm payment
	cmd := command.ConfirmPaymentCommand{
		SepayTransactionID:   payload.ID,
		SepayReferenceCode:   payload.ReferenceCode,
		SepayGateway:         payload.Gateway,
		SepayAccountNumber:   payload.AccountNumber,
		SepayTransactionDate: transactionDate,
		SepayTransferContent: payload.Content,
		Amount:               amount,
	}

	if err := h.confirmPaymentHandler.Handle(c.Request.Context(), cmd); err != nil {
		// Log error but still return success to SePay to prevent retries
		// We'll handle failed payments manually
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "payment confirmation failed, will be handled manually",
		})
		return
	}

	// IMPORTANT: Return success response for SePay
	// Must include "success": true and HTTP 200/201
	c.JSON(http.StatusOK, gin.H{"success": true})
}
