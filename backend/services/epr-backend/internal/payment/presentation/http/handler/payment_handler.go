package handler

import (
	"net/http"

	"github.com/epr-legal/epr-backend/internal/payment/application/command"
	"github.com/epr-legal/epr-backend/internal/payment/application/query"
	"github.com/epr-legal/epr-backend/internal/payment/infrastructure/sepay"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentHandler struct {
	createPaymentHandler *command.CreatePaymentHandler
	getPaymentHandler    *query.GetPaymentHandler
	sepayClient          *sepay.Client
}

func NewPaymentHandler(
	createPaymentHandler *command.CreatePaymentHandler,
	getPaymentHandler *query.GetPaymentHandler,
	sepayClient *sepay.Client,
) *PaymentHandler {
	return &PaymentHandler{
		createPaymentHandler: createPaymentHandler,
		getPaymentHandler:    getPaymentHandler,
		sepayClient:          sepayClient,
	}
}

type CreatePaymentRequest struct {
	PackageID string `json:"package_id" binding:"required"`
	Period    string `json:"period" binding:"required,oneof=monthly yearly"`
}

type CreatePaymentResponse struct {
	PaymentID   string            `json:"payment_id"`
	OrderCode   string            `json:"order_code"`
	Amount      string            `json:"amount"`
	Currency    string            `json:"currency"`
	Period      string            `json:"period"`
	QRCodeURL   string            `json:"qr_code_url"`
	BankInfo    map[string]string `json:"bank_info"`
	ExpiresAt   string            `json:"expires_at"`
	Status      string            `json:"status"`
}

// CreatePayment creates a new payment order
func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	var req CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(err)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	packageID, err := uuid.Parse(req.PackageID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid package_id"})
		return
	}

	// Create payment
	cmd := command.CreatePaymentCommand{
		UserID:    userID.(uuid.UUID),
		PackageID: packageID,
		Period:    req.Period,
	}

	paymentID, err := h.createPaymentHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.Error(err)
		return
	}

	// Get payment details
	payment, err := h.getPaymentHandler.Handle(c.Request.Context(), query.GetPaymentQuery{
		PaymentID: paymentID,
	})
	if err != nil {
		c.Error(err)
		return
	}

	// Generate QR code
	qrCodeURL := h.sepayClient.GenerateQRCode(payment.OrderCode, payment.Amount)

	c.JSON(http.StatusCreated, CreatePaymentResponse{
		PaymentID: payment.ID.String(),
		OrderCode: payment.OrderCode,
		Amount:    payment.Amount.String(),
		Currency:  payment.Currency,
		Period:    payment.Period,
		QRCodeURL: qrCodeURL,
		BankInfo:  h.sepayClient.GetBankInfo(),
		ExpiresAt: payment.ExpiresAt.Format("2006-01-02T15:04:05Z07:00"),
		Status:    payment.Status,
	})
}

// GetPayment retrieves payment details
func (h *PaymentHandler) GetPayment(c *gin.Context) {
	paymentIDStr := c.Param("id")
	paymentID, err := uuid.Parse(paymentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Get payment
	payment, err := h.getPaymentHandler.Handle(c.Request.Context(), query.GetPaymentQuery{
		PaymentID: paymentID,
	})
	if err != nil {
		c.Error(err)
		return
	}

	// Verify user owns this payment
	if payment.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": payment})
}
