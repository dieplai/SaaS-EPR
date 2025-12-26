package postgres

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type PaymentModel struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"`
	PackageID uuid.UUID `gorm:"type:uuid;not null"`

	// Payment details
	OrderCode string          `gorm:"type:varchar(50);uniqueIndex;not null"`
	Amount    decimal.Decimal `gorm:"type:decimal(10,2);not null"`
	Currency  string          `gorm:"type:varchar(10);not null"`
	Period    string          `gorm:"type:varchar(20);not null"`

	// SePay transaction details
	SepayTransactionID   *int64     `gorm:"type:bigint"`
	SepayReferenceCode   *string    `gorm:"type:varchar(255)"`
	SepayGateway         *string    `gorm:"type:varchar(50)"`
	SepayAccountNumber   *string    `gorm:"type:varchar(50)"`
	SepayTransactionDate *time.Time `gorm:"type:timestamp"`
	SepayTransferContent *string    `gorm:"type:text"`

	// Status
	Status string `gorm:"type:varchar(20);not null"`

	// Timestamps
	CreatedAt time.Time  `gorm:"type:timestamp;not null"`
	UpdatedAt time.Time  `gorm:"type:timestamp;not null"`
	PaidAt    *time.Time `gorm:"type:timestamp"`
	ExpiresAt time.Time  `gorm:"type:timestamp;not null"`
}

func (PaymentModel) TableName() string {
	return "payments"
}
