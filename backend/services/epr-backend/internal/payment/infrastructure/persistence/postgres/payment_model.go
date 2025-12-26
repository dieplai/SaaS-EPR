package postgres

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type PaymentModel struct {
	ID        uuid.UUID `db:"id"`
	UserID    uuid.UUID `db:"user_id"`
	PackageID uuid.UUID `db:"package_id"`

	// Payment details
	OrderCode string          `db:"order_code"`
	Amount    decimal.Decimal `db:"amount"`
	Currency  string          `db:"currency"`
	Period    string          `db:"period"`

	// SePay transaction details
	SepayTransactionID   *int64     `db:"sepay_transaction_id"`
	SepayReferenceCode   *string    `db:"sepay_reference_code"`
	SepayGateway         *string    `db:"sepay_gateway"`
	SepayAccountNumber   *string    `db:"sepay_account_number"`
	SepayTransactionDate *time.Time `db:"sepay_transaction_date"`
	SepayTransferContent *string    `db:"sepay_transfer_content"`

	// Status
	Status string `db:"status"`

	// Timestamps
	CreatedAt time.Time  `db:"created_at"`
	UpdatedAt time.Time  `db:"updated_at"`
	PaidAt    *time.Time `db:"paid_at"`
	ExpiresAt time.Time  `db:"expires_at"`
}
