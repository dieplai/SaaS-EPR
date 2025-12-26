package command

import (
	"context"
	"fmt"
	"time"

	"github.com/epr-legal/epr-backend/internal/payment/domain/payment"
	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type CreatePaymentCommand struct {
	UserID    uuid.UUID
	PackageID uuid.UUID
	Period    string // "monthly" or "yearly"
}

type CreatePaymentHandler struct {
	paymentRepo payment.Repository
	packageRepo packagedomain.Repository
}

func NewCreatePaymentHandler(
	paymentRepo payment.Repository,
	packageRepo packagedomain.Repository,
) *CreatePaymentHandler {
	return &CreatePaymentHandler{
		paymentRepo: paymentRepo,
		packageRepo: packageRepo,
	}
}

func (h *CreatePaymentHandler) Handle(ctx context.Context, cmd CreatePaymentCommand) (uuid.UUID, error) {
	// Validate package exists
	pkg, err := h.packageRepo.FindByID(ctx, cmd.PackageID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("package not found: %w", err)
	}

	if !pkg.IsActive() {
		return uuid.Nil, fmt.Errorf("package is not active")
	}

	// Calculate amount based on period
	// Package price is in USD, convert to VND for payment (1 USD = 26,312.40 VND)
	// Must match frontend exchange rate in web/src/lib/currency.ts
	const USD_TO_VND = 26312.40
	priceUSD := decimal.NewFromFloat(pkg.GetPrice().Amount())
	amountVND := priceUSD.Mul(decimal.NewFromFloat(USD_TO_VND))

	if cmd.Period == "yearly" {
		// Yearly = 12 months with 20% discount
		amountVND = amountVND.Mul(decimal.NewFromInt(12)).Mul(decimal.NewFromFloat(0.8))
	}

	amount := amountVND

	// Generate unique order code: EPR + YYYYMMDD + random 4 digits
	orderCode := fmt.Sprintf("EPR%s%04d",
		time.Now().Format("20060102"),
		time.Now().UnixNano()%10000,
	)

	// Create payment
	pmt, err := payment.NewPayment(
		cmd.UserID,
		cmd.PackageID,
		orderCode,
		amount,
		cmd.Period,
	)
	if err != nil {
		return uuid.Nil, err
	}

	// Save payment
	if err := h.paymentRepo.Save(ctx, pmt); err != nil {
		return uuid.Nil, err
	}

	return pmt.ID, nil
}
