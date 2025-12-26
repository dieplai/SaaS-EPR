package command

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/epr-legal/epr-backend/internal/payment/domain/payment"
	subscriptioncmd "github.com/epr-legal/epr-backend/internal/subscription/application/command"
	"github.com/shopspring/decimal"
)

type ConfirmPaymentCommand struct {
	SepayTransactionID   int64
	SepayReferenceCode   string
	SepayGateway         string
	SepayAccountNumber   string
	SepayTransactionDate time.Time
	SepayTransferContent string
	Amount               decimal.Decimal
}

type ConfirmPaymentHandler struct {
	paymentRepo              payment.Repository
	createSubscriptionHandler *subscriptioncmd.CreateSubscriptionHandler
}

func NewConfirmPaymentHandler(
	paymentRepo payment.Repository,
	createSubscriptionHandler *subscriptioncmd.CreateSubscriptionHandler,
) *ConfirmPaymentHandler {
	return &ConfirmPaymentHandler{
		paymentRepo:              paymentRepo,
		createSubscriptionHandler: createSubscriptionHandler,
	}
}

func (h *ConfirmPaymentHandler) Handle(ctx context.Context, cmd ConfirmPaymentCommand) error {
	// Check if this transaction has already been processed (idempotency)
	existingPayment, err := h.paymentRepo.FindBySepayTransactionID(ctx, cmd.SepayTransactionID)
	if err == nil && existingPayment != nil {
		// Transaction already processed, return success (idempotent)
		return nil
	}

	// Extract order code from transfer content
	orderCode := extractOrderCode(cmd.SepayTransferContent)
	if orderCode == "" {
		return fmt.Errorf("order code not found in transfer content: %s", cmd.SepayTransferContent)
	}

	// Find payment by order code
	pmt, err := h.paymentRepo.FindByOrderCode(ctx, orderCode)
	if err != nil {
		return fmt.Errorf("payment not found for order code %s: %w", orderCode, err)
	}

	// Confirm payment
	if err := pmt.ConfirmPayment(
		cmd.SepayTransactionID,
		cmd.SepayReferenceCode,
		cmd.SepayGateway,
		cmd.SepayAccountNumber,
		cmd.SepayTransactionDate,
		cmd.SepayTransferContent,
		cmd.Amount,
	); err != nil {
		return fmt.Errorf("failed to confirm payment: %w", err)
	}

	// Save payment
	if err := h.paymentRepo.Save(ctx, pmt); err != nil {
		return fmt.Errorf("failed to save payment: %w", err)
	}

	// Create or upgrade subscription
	packageID := pmt.PackageID()
	_, err = h.createSubscriptionHandler.Handle(ctx, subscriptioncmd.CreateSubscriptionCommand{
		UserID:    pmt.UserID(),
		PackageID: &packageID,
	})
	if err != nil {
		// Log error but don't fail payment confirmation
		// Payment is already confirmed, subscription creation can be retried
		return fmt.Errorf("payment confirmed but subscription creation failed: %w", err)
	}

	return nil
}

// extractOrderCode extracts order code from SePay transfer content
// Order code format: EPR20251226XXXX (EPR + YYYYMMDD + 4 random digits = 15 chars)
func extractOrderCode(content string) string {
	// Convert to uppercase for case-insensitive matching
	content = strings.ToUpper(content)

	// Look for EPR followed by 8 digits (date) and 4 more digits (random)
	// Format: EPR + YYYYMMDD + XXXX (total 15 characters)
	words := strings.Fields(content)
	for _, word := range words {
		if strings.HasPrefix(word, "EPR") && len(word) >= 15 {
			// Extract EPR20251226XXXX (15 characters)
			return word[:15]
		}
	}

	// Alternative: scan the entire content for pattern
	if idx := strings.Index(content, "EPR"); idx >= 0 {
		// Extract up to 15 characters starting from EPR
		if idx+15 <= len(content) {
			return content[idx : idx+15]
		}
	}

	return ""
}
