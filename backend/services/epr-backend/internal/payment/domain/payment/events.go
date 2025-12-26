package payment

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// PaymentCreatedEvent is raised when a new payment order is created
type PaymentCreatedEvent struct {
	eventID   uuid.UUID
	PaymentID uuid.UUID
	UserID    uuid.UUID
	PackageID uuid.UUID
	OrderCode string
	Amount    decimal.Decimal
	Period    string
	occurredAt time.Time
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
		eventID:   uuid.New(),
		PaymentID: paymentID,
		UserID:    userID,
		PackageID: packageID,
		OrderCode: orderCode,
		Amount:    amount,
		Period:    period,
		occurredAt: time.Now(),
	}
}

func (e *PaymentCreatedEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *PaymentCreatedEvent) EventName() string {
	return "payment.created"
}

func (e *PaymentCreatedEvent) AggregateID() uuid.UUID {
	return e.PaymentID
}

func (e *PaymentCreatedEvent) OccurredAt() time.Time {
	return e.occurredAt
}

// PaymentCompletedEvent is raised when a payment is confirmed
type PaymentCompletedEvent struct {
	eventID            uuid.UUID
	PaymentID          uuid.UUID
	UserID             uuid.UUID
	PackageID          uuid.UUID
	SepayTransactionID int64
	Amount             decimal.Decimal
	occurredAt         time.Time
}

func NewPaymentCompletedEvent(
	paymentID uuid.UUID,
	userID uuid.UUID,
	packageID uuid.UUID,
	sepayTransactionID int64,
	amount decimal.Decimal,
) *PaymentCompletedEvent {
	return &PaymentCompletedEvent{
		eventID:            uuid.New(),
		PaymentID:          paymentID,
		UserID:             userID,
		PackageID:          packageID,
		SepayTransactionID: sepayTransactionID,
		Amount:             amount,
		occurredAt:         time.Now(),
	}
}

func (e *PaymentCompletedEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *PaymentCompletedEvent) EventName() string {
	return "payment.completed"
}

func (e *PaymentCompletedEvent) AggregateID() uuid.UUID {
	return e.PaymentID
}

func (e *PaymentCompletedEvent) OccurredAt() time.Time {
	return e.occurredAt
}

// PaymentFailedEvent is raised when a payment fails
type PaymentFailedEvent struct {
	eventID   uuid.UUID
	PaymentID uuid.UUID
	UserID    uuid.UUID
	Reason    string
	occurredAt time.Time
}

func NewPaymentFailedEvent(paymentID uuid.UUID, userID uuid.UUID, reason string) *PaymentFailedEvent {
	return &PaymentFailedEvent{
		eventID:   uuid.New(),
		PaymentID: paymentID,
		UserID:    userID,
		Reason:    reason,
		occurredAt: time.Now(),
	}
}

func (e *PaymentFailedEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *PaymentFailedEvent) EventName() string {
	return "payment.failed"
}

func (e *PaymentFailedEvent) AggregateID() uuid.UUID {
	return e.PaymentID
}

func (e *PaymentFailedEvent) OccurredAt() time.Time {
	return e.occurredAt
}

// PaymentCancelledEvent is raised when a payment is cancelled
type PaymentCancelledEvent struct {
	eventID   uuid.UUID
	PaymentID uuid.UUID
	UserID    uuid.UUID
	occurredAt time.Time
}

func NewPaymentCancelledEvent(paymentID uuid.UUID, userID uuid.UUID) *PaymentCancelledEvent {
	return &PaymentCancelledEvent{
		eventID:   uuid.New(),
		PaymentID: paymentID,
		UserID:    userID,
		occurredAt: time.Now(),
	}
}

func (e *PaymentCancelledEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *PaymentCancelledEvent) EventName() string {
	return "payment.cancelled"
}

func (e *PaymentCancelledEvent) AggregateID() uuid.UUID {
	return e.PaymentID
}

func (e *PaymentCancelledEvent) OccurredAt() time.Time {
	return e.occurredAt
}
