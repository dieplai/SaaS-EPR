package payment

import (
	"fmt"
	"time"

	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Payment struct {
	domain.AggregateRoot
	userID    uuid.UUID
	packageID uuid.UUID

	// Payment details
	orderCode string
	amount    decimal.Decimal
	currency  string
	period    string // "monthly" or "yearly"

	// SePay transaction details
	sepayTransactionID *int64
	sepayReferenceCode *string
	sepayGateway       *string
	sepayAccountNumber *string
	sepayTransactionDate *time.Time
	sepayTransferContent *string

	// Status
	status Status

	// Timestamps
	paidAt    *time.Time
	expiresAt time.Time
}

// NewPayment creates a new payment order
func NewPayment(
	userID uuid.UUID,
	packageID uuid.UUID,
	orderCode string,
	amount decimal.Decimal,
	period string,
) (*Payment, error) {
	if userID == uuid.Nil {
		return nil, fmt.Errorf("user ID is required")
	}
	if packageID == uuid.Nil {
		return nil, fmt.Errorf("package ID is required")
	}
	if orderCode == "" {
		return nil, fmt.Errorf("order code is required")
	}
	if amount.LessThanOrEqual(decimal.Zero) {
		return nil, fmt.Errorf("amount must be greater than zero")
	}
	if period != "monthly" && period != "yearly" {
		return nil, fmt.Errorf("period must be 'monthly' or 'yearly'")
	}

	now := time.Now()
	payment := &Payment{
		AggregateRoot: domain.AggregateRoot{
			BaseEntity: domain.BaseEntity{
				ID:        uuid.New(),
				CreatedAt: now,
				UpdatedAt: now,
			},
		},
		userID:    userID,
		packageID: packageID,
		orderCode: orderCode,
		amount:    amount,
		currency:  "VND",
		period:    period,
		status:    StatusPending,
		expiresAt: now.Add(15 * time.Minute), // Payment expires after 15 minutes
	}

	payment.RaiseDomainEvent(NewPaymentCreatedEvent(
		payment.ID,
		userID,
		packageID,
		orderCode,
		amount,
		period,
	))

	return payment, nil
}

// ConfirmPayment confirms the payment with SePay transaction details
func (p *Payment) ConfirmPayment(
	transactionID int64,
	referenceCode string,
	gateway string,
	accountNumber string,
	transactionDate time.Time,
	transferContent string,
	amount decimal.Decimal,
) error {
	if p.status.IsFinal() {
		return fmt.Errorf("payment already finalized with status: %s", p.status)
	}

	// Verify amount matches
	if !p.amount.Equal(amount) {
		return fmt.Errorf("payment amount mismatch: expected %s, got %s", p.amount.String(), amount.String())
	}

	now := time.Now()
	p.sepayTransactionID = &transactionID
	p.sepayReferenceCode = &referenceCode
	p.sepayGateway = &gateway
	p.sepayAccountNumber = &accountNumber
	p.sepayTransactionDate = &transactionDate
	p.sepayTransferContent = &transferContent
	p.status = StatusCompleted
	p.paidAt = &now
	p.UpdatedAt = now

	p.RaiseDomainEvent(NewPaymentCompletedEvent(
		p.ID,
		p.userID,
		p.packageID,
		transactionID,
		p.amount,
	))

	return nil
}

// MarkAsFailed marks the payment as failed
func (p *Payment) MarkAsFailed(reason string) error {
	if p.status.IsFinal() {
		return fmt.Errorf("payment already finalized with status: %s", p.status)
	}

	p.status = StatusFailed
	p.UpdatedAt = time.Now()

	p.RaiseDomainEvent(NewPaymentFailedEvent(p.ID, p.userID, reason))

	return nil
}

// Cancel cancels the payment order
func (p *Payment) Cancel() error {
	if p.status != StatusPending {
		return fmt.Errorf("can only cancel pending payments")
	}

	p.status = StatusCancelled
	p.UpdatedAt = time.Now()

	p.RaiseDomainEvent(NewPaymentCancelledEvent(p.ID, p.userID))

	return nil
}

// IsExpired checks if the payment order has expired
func (p *Payment) IsExpired() bool {
	return time.Now().After(p.expiresAt) && p.status == StatusPending
}

// ReconstructPayment reconstructs a payment from persistence
func ReconstructPayment(
	id uuid.UUID,
	userID uuid.UUID,
	packageID uuid.UUID,
	orderCode string,
	amount decimal.Decimal,
	currency string,
	period string,
	status Status,
	sepayTransactionID *int64,
	sepayReferenceCode *string,
	sepayGateway *string,
	sepayAccountNumber *string,
	sepayTransactionDate *time.Time,
	sepayTransferContent *string,
	createdAt time.Time,
	updatedAt time.Time,
	paidAt *time.Time,
	expiresAt time.Time,
) *Payment {
	return &Payment{
		AggregateRoot: domain.AggregateRoot{
			BaseEntity: domain.BaseEntity{
				ID:        id,
				CreatedAt: createdAt,
				UpdatedAt: updatedAt,
			},
		},
		userID:               userID,
		packageID:            packageID,
		orderCode:            orderCode,
		amount:               amount,
		currency:             currency,
		period:               period,
		status:               status,
		sepayTransactionID:   sepayTransactionID,
		sepayReferenceCode:   sepayReferenceCode,
		sepayGateway:         sepayGateway,
		sepayAccountNumber:   sepayAccountNumber,
		sepayTransactionDate: sepayTransactionDate,
		sepayTransferContent: sepayTransferContent,
		paidAt:               paidAt,
		expiresAt:            expiresAt,
	}
}

// Getters
func (p *Payment) UserID() uuid.UUID                 { return p.userID }
func (p *Payment) PackageID() uuid.UUID              { return p.packageID }
func (p *Payment) OrderCode() string                 { return p.orderCode }
func (p *Payment) Amount() decimal.Decimal           { return p.amount }
func (p *Payment) Currency() string                  { return p.currency }
func (p *Payment) Period() string                    { return p.period }
func (p *Payment) Status() Status                    { return p.status }
func (p *Payment) SepayTransactionID() *int64        { return p.sepayTransactionID }
func (p *Payment) SepayReferenceCode() *string       { return p.sepayReferenceCode }
func (p *Payment) SepayGateway() *string             { return p.sepayGateway }
func (p *Payment) SepayAccountNumber() *string       { return p.sepayAccountNumber }
func (p *Payment) SepayTransactionDate() *time.Time  { return p.sepayTransactionDate }
func (p *Payment) SepayTransferContent() *string     { return p.sepayTransferContent }
func (p *Payment) PaidAt() *time.Time                { return p.paidAt }
func (p *Payment) ExpiresAt() time.Time              { return p.expiresAt }
