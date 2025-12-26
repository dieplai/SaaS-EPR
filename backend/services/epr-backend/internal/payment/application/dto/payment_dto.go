package dto

import (
	"time"

	"github.com/epr-legal/epr-backend/internal/payment/domain/payment"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type PaymentDTO struct {
	ID        uuid.UUID       `json:"id"`
	UserID    uuid.UUID       `json:"user_id"`
	PackageID uuid.UUID       `json:"package_id"`
	OrderCode string          `json:"order_code"`
	Amount    decimal.Decimal `json:"amount"`
	Currency  string          `json:"currency"`
	Period    string          `json:"period"`
	Status    string          `json:"status"`

	// SePay details (optional)
	SepayTransactionID   *int64     `json:"sepay_transaction_id,omitempty"`
	SepayReferenceCode   *string    `json:"sepay_reference_code,omitempty"`
	SepayGateway         *string    `json:"sepay_gateway,omitempty"`
	SepayAccountNumber   *string    `json:"sepay_account_number,omitempty"`
	SepayTransactionDate *time.Time `json:"sepay_transaction_date,omitempty"`
	SepayTransferContent *string    `json:"sepay_transfer_content,omitempty"`

	// Timestamps
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	PaidAt    *time.Time `json:"paid_at,omitempty"`
	ExpiresAt time.Time  `json:"expires_at"`

	// Computed fields
	IsExpired bool `json:"is_expired"`
}

func FromPaymentDomain(p *payment.Payment) *PaymentDTO {
	return &PaymentDTO{
		ID:                   p.ID,
		UserID:               p.UserID(),
		PackageID:            p.PackageID(),
		OrderCode:            p.OrderCode(),
		Amount:               p.Amount(),
		Currency:             p.Currency(),
		Period:               p.Period(),
		Status:               p.Status().String(),
		SepayTransactionID:   p.SepayTransactionID(),
		SepayReferenceCode:   p.SepayReferenceCode(),
		SepayGateway:         p.SepayGateway(),
		SepayAccountNumber:   p.SepayAccountNumber(),
		SepayTransactionDate: p.SepayTransactionDate(),
		SepayTransferContent: p.SepayTransferContent(),
		CreatedAt:            p.CreatedAt,
		UpdatedAt:            p.UpdatedAt,
		PaidAt:               p.PaidAt(),
		ExpiresAt:            p.ExpiresAt(),
		IsExpired:            p.IsExpired(),
	}
}
