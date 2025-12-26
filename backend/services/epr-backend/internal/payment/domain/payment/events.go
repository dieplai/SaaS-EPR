package payment

import (
	"time"

	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// PaymentCreatedEvent is raised when a new payment order is created
type PaymentCreatedEvent struct {
	domain.DomainEvent
	PaymentID uuid.UUID
	UserID    uuid.UUID
	PackageID uuid.UUID
	OrderCode string
	Amount    decimal.Decimal
	Period    string
}

func NewPaymentCreatedEvent(
	paymentID uuid.UUID,
	userID uuid.UUID,
	packageID uuid.UUID,
	orderCode string,
	amount decimal.Decimal,
	period string,
) *PaymentCreatedEvent {
	return &PaymentCreatedEvent{
		DomainEvent: domain.DomainEvent{
			EventID:     uuid.New(),
			EventType:   "payment.created",
			AggregateID: paymentID,
			OccurredAt:  time.Now(),
		},
		PaymentID: paymentID,
		UserID:    userID,
		PackageID: packageID,
		OrderCode: orderCode,
		Amount:    amount,
		Period:    period,
	}
}

// PaymentCompletedEvent is raised when a payment is confirmed
type PaymentCompletedEvent struct {
	domain.DomainEvent
	PaymentID          uuid.UUID
	UserID             uuid.UUID
	PackageID          uuid.UUID
	SepayTransactionID int64
	Amount             decimal.Decimal
}

func NewPaymentCompletedEvent(
	paymentID uuid.UUID,
	userID uuid.UUID,
	packageID uuid.UUID,
	sepayTransactionID int64,
	amount decimal.Decimal,
) *PaymentCompletedEvent {
	return &PaymentCompletedEvent{
		DomainEvent: domain.DomainEvent{
			EventID:     uuid.New(),
			EventType:   "payment.completed",
			AggregateID: paymentID,
			OccurredAt:  time.Now(),
		},
		PaymentID:          paymentID,
		UserID:             userID,
		PackageID:          packageID,
		SepayTransactionID: sepayTransactionID,
		Amount:             amount,
	}
}

// PaymentFailedEvent is raised when a payment fails
type PaymentFailedEvent struct {
	domain.DomainEvent
	PaymentID uuid.UUID
	UserID    uuid.UUID
	Reason    string
}

func NewPaymentFailedEvent(paymentID uuid.UUID, userID uuid.UUID, reason string) *PaymentFailedEvent {
	return &PaymentFailedEvent{
		DomainEvent: domain.DomainEvent{
			EventID:     uuid.New(),
			EventType:   "payment.failed",
			AggregateID: paymentID,
			OccurredAt:  time.Now(),
		},
		PaymentID: paymentID,
		UserID:    userID,
		Reason:    reason,
	}
}

// PaymentCancelledEvent is raised when a payment is cancelled
type PaymentCancelledEvent struct {
	domain.DomainEvent
	PaymentID uuid.UUID
	UserID    uuid.UUID
}

func NewPaymentCancelledEvent(paymentID uuid.UUID, userID uuid.UUID) *PaymentCancelledEvent {
	return &PaymentCancelledEvent{
		DomainEvent: domain.DomainEvent{
			EventID:     uuid.New(),
			EventType:   "payment.cancelled",
			AggregateID: paymentID,
			OccurredAt:  time.Now(),
		},
		PaymentID: paymentID,
		UserID:    userID,
	}
}
