package subscription

import (
	"fmt"
	"time"

	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
)

type Subscription struct {
	domain.AggregateRoot
	userID             uuid.UUID
	packageID          uuid.UUID
	startDate          time.Time
	endDate            time.Time
	status             Status
	remainingTokens    int
	totalTokens        int       // Total tokens per billing period
	currentPeriodStart time.Time // Start of current billing period
	currentPeriodEnd   time.Time // End of current billing period
	autoRenew          bool      // Whether to auto-renew
	lastTokenResetAt   *time.Time // Last time tokens were reset to totalTokens
	nextTokenResetAt   *time.Time // Next scheduled token reset time
}

func NewSubscription(
	userID uuid.UUID,
	packageID uuid.UUID,
	durationDays int,
	tokenLimit int,
) (*Subscription, error) {
	now := time.Now()
	endDate := now.AddDate(0, 0, durationDays)

	sub := &Subscription{
		AggregateRoot: domain.AggregateRoot{
			BaseEntity: domain.BaseEntity{
				ID: uuid.New(),
			},
		},
		userID:             userID,
		packageID:          packageID,
		startDate:          now,
		endDate:            endDate,
		status:             StatusActive,
		remainingTokens:    tokenLimit,
		totalTokens:        tokenLimit,
		currentPeriodStart: now,
		currentPeriodEnd:   endDate,
		autoRenew:          true, // Default to auto-renew
		lastTokenResetAt:   &now, // Initialize to subscription start
		nextTokenResetAt:   nil,  // Will be calculated based on system settings
	}

	sub.RaiseDomainEvent(NewSubscriptionCreatedEvent(
		sub.ID,
		userID,
		packageID,
		sub.startDate,
		sub.endDate,
	))

	return sub, nil
}

func ReconstructSubscription(
	id uuid.UUID,
	userID uuid.UUID,
	packageID uuid.UUID,
	startDate time.Time,
	endDate time.Time,
	status Status,
	remainingTokens int,
	totalTokens int,
	currentPeriodStart time.Time,
	currentPeriodEnd time.Time,
	autoRenew bool,
	lastTokenResetAt *time.Time,
	nextTokenResetAt *time.Time,
	createdAt time.Time,
	updatedAt time.Time,
) *Subscription {
	sub := &Subscription{
		AggregateRoot: domain.AggregateRoot{
			BaseEntity: domain.BaseEntity{
				ID:        id,
				CreatedAt: createdAt,
				UpdatedAt: updatedAt,
			},
		},
		userID:             userID,
		packageID:          packageID,
		startDate:          startDate,
		endDate:            endDate,
		status:             status,
		remainingTokens:    remainingTokens,
		totalTokens:        totalTokens,
		currentPeriodStart: currentPeriodStart,
		currentPeriodEnd:   currentPeriodEnd,
		autoRenew:          autoRenew,
		lastTokenResetAt:   lastTokenResetAt,
		nextTokenResetAt:   nextTokenResetAt,
	}
	return sub
}

func (s *Subscription) GetUserID() uuid.UUID {
	return s.userID
}

func (s *Subscription) GetPackageID() uuid.UUID {
	return s.packageID
}

func (s *Subscription) GetStartDate() time.Time {
	return s.startDate
}

func (s *Subscription) GetEndDate() time.Time {
	return s.endDate
}

func (s *Subscription) GetStatus() Status {
	return s.status
}

func (s *Subscription) GetRemainingTokens() int {
	return s.remainingTokens
}

func (s *Subscription) GetTotalTokens() int {
	return s.totalTokens
}

func (s *Subscription) GetCurrentPeriodStart() time.Time {
	return s.currentPeriodStart
}

func (s *Subscription) GetCurrentPeriodEnd() time.Time {
	return s.currentPeriodEnd
}

func (s *Subscription) GetAutoRenew() bool {
	return s.autoRenew
}

func (s *Subscription) GetLastTokenResetAt() *time.Time {
	return s.lastTokenResetAt
}

func (s *Subscription) GetNextTokenResetAt() *time.Time {
	return s.nextTokenResetAt
}

// Legacy support - will be removed in future versions
func (s *Subscription) GetRemainingQueries() int {
	return s.remainingTokens
}

func (s *Subscription) IsActive() bool {
	now := time.Now()
	return s.status == StatusActive &&
		now.After(s.startDate) &&
		now.Before(s.endDate)
}

func (s *Subscription) IsExpired() bool {
	return time.Now().After(s.endDate) || s.status == StatusExpired
}

func (s *Subscription) HasTokensRemaining() bool {
	return s.remainingTokens > 0
}

// Legacy support - will be removed in future versions
func (s *Subscription) HasQueriesRemaining() bool {
	return s.HasTokensRemaining()
}

func (s *Subscription) CanConsumeTokens(tokenCount int) bool {
	return s.IsActive() && s.remainingTokens >= tokenCount
}

// Legacy support - will be removed in future versions
func (s *Subscription) CanConsumeQuery() bool {
	return s.IsActive() && s.HasTokensRemaining()
}

func (s *Subscription) ConsumeTokens(tokenCount int) error {
	if !s.IsActive() {
		return domain.ErrInvalidOperation
	}

	if s.remainingTokens < tokenCount {
		return &InsufficientTokensError{
			Required:  tokenCount,
			Remaining: s.remainingTokens,
		}
	}

	s.remainingTokens -= tokenCount

	s.RaiseDomainEvent(NewTokensConsumedEvent(
		s.ID,
		s.userID,
		tokenCount,
		s.remainingTokens,
	))

	return nil
}

// Legacy support - will be removed in future versions
func (s *Subscription) ConsumeQuery() error {
	return s.ConsumeTokens(1)
}

type InsufficientTokensError struct {
	Required  int
	Remaining int
}

func (e *InsufficientTokensError) Error() string {
	return fmt.Sprintf("insufficient tokens: required %d, remaining %d", e.Required, e.Remaining)
}

func (s *Subscription) CheckAndUpdateStatus() {
	if s.IsExpired() && s.status == StatusActive {
		s.status = StatusExpired
		s.RaiseDomainEvent(NewSubscriptionExpiredEvent(s.ID, s.userID))
	}
}

// NeedsRenewal checks if the current billing period has ended
func (s *Subscription) NeedsRenewal() bool {
	return s.autoRenew &&
		s.status == StatusActive &&
		time.Now().After(s.currentPeriodEnd)
}

// RenewPeriod starts a new billing period and refills tokens
// This implements the rolling monthly window model
func (s *Subscription) RenewPeriod(durationDays int) error {
	if !s.autoRenew {
		return fmt.Errorf("subscription auto-renew is disabled")
	}

	if s.status != StatusActive {
		return fmt.Errorf("subscription is not active")
	}

	// New period starts where the last one ended (rolling window)
	newPeriodStart := s.currentPeriodEnd
	newPeriodEnd := newPeriodStart.AddDate(0, 0, durationDays)

	// Refill tokens to full amount
	s.currentPeriodStart = newPeriodStart
	s.currentPeriodEnd = newPeriodEnd
	s.remainingTokens = s.totalTokens

	// Update overall subscription dates
	s.endDate = newPeriodEnd

	s.RaiseDomainEvent(NewSubscriptionRenewedEvent(
		s.ID,
		s.userID,
		newPeriodStart,
		newPeriodEnd,
		s.totalTokens,
	))

	return nil
}

// SetAutoRenew enables or disables auto-renewal
func (s *Subscription) SetAutoRenew(autoRenew bool) {
	if s.autoRenew != autoRenew {
		s.autoRenew = autoRenew
		s.UpdatedAt = time.Now()
	}
}

// SetNextTokenResetAt sets the next scheduled token reset time
func (s *Subscription) SetNextTokenResetAt(resetCycleDays int) {
	if s.lastTokenResetAt != nil {
		nextReset := s.lastTokenResetAt.AddDate(0, 0, resetCycleDays)
		s.nextTokenResetAt = &nextReset
	}
}

// NeedsTokenReset checks if tokens should be reset now
func (s *Subscription) NeedsTokenReset() bool {
	// Only reset if subscription is active and not expired
	if s.status != StatusActive || s.IsExpired() {
		return false
	}

	// Check if it's time to reset
	if s.nextTokenResetAt == nil {
		return false
	}

	return time.Now().After(*s.nextTokenResetAt)
}

// ResetTokens resets tokens to the package limit
func (s *Subscription) ResetTokens(resetCycleDays int) error {
	if !s.IsActive() || s.IsExpired() {
		return fmt.Errorf("cannot reset tokens for inactive or expired subscription")
	}

	now := time.Now()

	// Reset tokens to total
	s.remainingTokens = s.totalTokens

	// Update reset timestamps
	s.lastTokenResetAt = &now
	nextReset := now.AddDate(0, 0, resetCycleDays)
	s.nextTokenResetAt = &nextReset

	s.UpdatedAt = now

	// Raise domain event
	s.RaiseDomainEvent(NewTokensResetEvent(
		s.ID,
		s.userID,
		s.totalTokens,
		nextReset,
	))

	return nil
}

func (s *Subscription) Cancel() error {
	if s.status == StatusCanceled {
		return domain.ErrInvalidOperation
	}

	s.status = StatusCanceled

	s.RaiseDomainEvent(NewSubscriptionCanceledEvent(s.ID, s.userID))

	return nil
}
