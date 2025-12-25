package subscription

import (
	"time"

	"github.com/google/uuid"
)

type SubscriptionCreatedEvent struct {
	eventID        uuid.UUID
	SubscriptionID uuid.UUID
	UserID         uuid.UUID
	PackageID      *uuid.UUID // Pointer to support nil (FREE accounts)
	StartDate      time.Time
	EndDate        time.Time
	occurredAt     time.Time
}

func NewSubscriptionCreatedEvent(subscriptionID, userID uuid.UUID, packageID *uuid.UUID, startDate, endDate time.Time) *SubscriptionCreatedEvent {
	return &SubscriptionCreatedEvent{
		eventID:        uuid.New(),
		SubscriptionID: subscriptionID,
		UserID:         userID,
		PackageID:      packageID,
		StartDate:      startDate,
		EndDate:        endDate,
		occurredAt:     time.Now(),
	}
}

func (e *SubscriptionCreatedEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *SubscriptionCreatedEvent) EventName() string {
	return "subscription.created"
}

func (e *SubscriptionCreatedEvent) AggregateID() uuid.UUID {
	return e.SubscriptionID
}

func (e *SubscriptionCreatedEvent) OccurredAt() time.Time {
	return e.occurredAt
}

type SubscriptionExpiredEvent struct {
	eventID        uuid.UUID
	SubscriptionID uuid.UUID
	UserID         uuid.UUID
	occurredAt     time.Time
}

func NewSubscriptionExpiredEvent(subscriptionID, userID uuid.UUID) *SubscriptionExpiredEvent {
	return &SubscriptionExpiredEvent{
		eventID:        uuid.New(),
		SubscriptionID: subscriptionID,
		UserID:         userID,
		occurredAt:     time.Now(),
	}
}

func (e *SubscriptionExpiredEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *SubscriptionExpiredEvent) EventName() string {
	return "subscription.expired"
}

func (e *SubscriptionExpiredEvent) AggregateID() uuid.UUID {
	return e.SubscriptionID
}

func (e *SubscriptionExpiredEvent) OccurredAt() time.Time {
	return e.occurredAt
}

type SubscriptionCanceledEvent struct {
	eventID        uuid.UUID
	SubscriptionID uuid.UUID
	UserID         uuid.UUID
	occurredAt     time.Time
}

func NewSubscriptionCanceledEvent(subscriptionID, userID uuid.UUID) *SubscriptionCanceledEvent {
	return &SubscriptionCanceledEvent{
		eventID:        uuid.New(),
		SubscriptionID: subscriptionID,
		UserID:         userID,
		occurredAt:     time.Now(),
	}
}

func (e *SubscriptionCanceledEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *SubscriptionCanceledEvent) EventName() string {
	return "subscription.canceled"
}

func (e *SubscriptionCanceledEvent) AggregateID() uuid.UUID {
	return e.SubscriptionID
}

func (e *SubscriptionCanceledEvent) OccurredAt() time.Time {
	return e.occurredAt
}

type TokensConsumedEvent struct {
	eventID         uuid.UUID
	SubscriptionID  uuid.UUID
	UserID          uuid.UUID
	TokensConsumed  int
	RemainingTokens int
	occurredAt      time.Time
}

func NewTokensConsumedEvent(subscriptionID, userID uuid.UUID, tokensConsumed, remainingTokens int) *TokensConsumedEvent {
	return &TokensConsumedEvent{
		eventID:         uuid.New(),
		SubscriptionID:  subscriptionID,
		UserID:          userID,
		TokensConsumed:  tokensConsumed,
		RemainingTokens: remainingTokens,
		occurredAt:      time.Now(),
	}
}

func (e *TokensConsumedEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *TokensConsumedEvent) EventName() string {
	return "subscription.tokens_consumed"
}

func (e *TokensConsumedEvent) AggregateID() uuid.UUID {
	return e.SubscriptionID
}

func (e *TokensConsumedEvent) OccurredAt() time.Time {
	return e.occurredAt
}

// SubscriptionRenewedEvent is raised when a subscription period is renewed
type SubscriptionRenewedEvent struct {
	eventID        uuid.UUID
	SubscriptionID uuid.UUID
	UserID         uuid.UUID
	NewPeriodStart time.Time
	NewPeriodEnd   time.Time
	TokensRefilled int
	occurredAt     time.Time
}

func NewSubscriptionRenewedEvent(subscriptionID, userID uuid.UUID, newPeriodStart, newPeriodEnd time.Time, tokensRefilled int) *SubscriptionRenewedEvent {
	return &SubscriptionRenewedEvent{
		eventID:        uuid.New(),
		SubscriptionID: subscriptionID,
		UserID:         userID,
		NewPeriodStart: newPeriodStart,
		NewPeriodEnd:   newPeriodEnd,
		TokensRefilled: tokensRefilled,
		occurredAt:     time.Now(),
	}
}

func (e *SubscriptionRenewedEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *SubscriptionRenewedEvent) EventName() string {
	return "subscription.renewed"
}

func (e *SubscriptionRenewedEvent) AggregateID() uuid.UUID {
	return e.SubscriptionID
}

func (e *SubscriptionRenewedEvent) OccurredAt() time.Time {
	return e.occurredAt
}

// Legacy event - will be removed in future versions
type QueryConsumedEvent = TokensConsumedEvent

func NewQueryConsumedEvent(subscriptionID, userID uuid.UUID, remainingQueries int) *QueryConsumedEvent {
	return NewTokensConsumedEvent(subscriptionID, userID, 1, remainingQueries)
}

// TokensResetEvent is raised when tokens are reset to the package limit
type TokensResetEvent struct {
	eventID         uuid.UUID
	SubscriptionID  uuid.UUID
	UserID          uuid.UUID
	TokensReset     int       // Number of tokens reset to
	NextResetAt     time.Time // Next scheduled reset time
	occurredAt      time.Time
}

func NewTokensResetEvent(subscriptionID, userID uuid.UUID, tokensReset int, nextResetAt time.Time) *TokensResetEvent {
	return &TokensResetEvent{
		eventID:        uuid.New(),
		SubscriptionID: subscriptionID,
		UserID:         userID,
		TokensReset:    tokensReset,
		NextResetAt:    nextResetAt,
		occurredAt:     time.Now(),
	}
}

func (e *TokensResetEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *TokensResetEvent) EventName() string {
	return "subscription.tokens_reset"
}

func (e *TokensResetEvent) AggregateID() uuid.UUID {
	return e.SubscriptionID
}

func (e *TokensResetEvent) OccurredAt() time.Time {
	return e.occurredAt
}
