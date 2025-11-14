package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/package-service/internal/domain"
	"github.com/yourusername/epr-saas/package-service/internal/repository"
)

// SubscriptionUseCase defines the interface for subscription business logic
type SubscriptionUseCase interface {
	CreateSubscription(ctx context.Context, input *domain.CreateSubscriptionInput) (*domain.Subscription, error)
	GetSubscription(ctx context.Context, id uuid.UUID) (*domain.Subscription, error)
	GetUserSubscriptions(ctx context.Context, userID uuid.UUID) ([]*domain.Subscription, error)
	GetActiveSubscription(ctx context.Context, userID uuid.UUID) (*domain.Subscription, error)
	CancelSubscription(ctx context.Context, id uuid.UUID) error

	// Query validation
	CanUserQuery(ctx context.Context, userID uuid.UUID) (bool, error)
	RecordQuery(ctx context.Context, userID uuid.UUID) error

	// Background jobs
	UpdateExpiredSubscriptions(ctx context.Context) error
}

// subscriptionUseCase implements SubscriptionUseCase interface
type subscriptionUseCase struct {
	subscriptionRepo repository.SubscriptionRepository
	packageRepo      repository.PackageRepository
	usageQuotaRepo   repository.UsageQuotaRepository
}

// NewSubscriptionUseCase creates a new instance of subscriptionUseCase
func NewSubscriptionUseCase(
	subscriptionRepo repository.SubscriptionRepository,
	packageRepo repository.PackageRepository,
	usageQuotaRepo repository.UsageQuotaRepository,
) SubscriptionUseCase {
	return &subscriptionUseCase{
		subscriptionRepo: subscriptionRepo,
		packageRepo:      packageRepo,
		usageQuotaRepo:   usageQuotaRepo,
	}
}

// ============================================
// CREATE SUBSCRIPTION
// ============================================

// CreateSubscription creates a new subscription for a user
func (uc *subscriptionUseCase) CreateSubscription(ctx context.Context, input *domain.CreateSubscriptionInput) (*domain.Subscription, error) {
	// 1. Check if user already has an active subscription
	activeSub, err := uc.subscriptionRepo.FindActiveByUserID(ctx, input.UserID)
	if err == nil && activeSub != nil {
		return nil, repository.ErrActiveSubscriptionExists
	}

	// 2. Get package details
	pkg, err := uc.packageRepo.FindByID(ctx, input.PackageID)
	if err != nil {
		return nil, err
	}

	// 3. Check if package is active
	if !pkg.IsActive {
		return nil, errors.New("package is not active")
	}

	// 4. Calculate subscription dates (ALWAYS use UTC to avoid timezone issues)
	now := time.Now().UTC()
	startDate := now
	endDate := now.AddDate(0, 0, pkg.DurationDays) // Add duration days

	// 5. Create subscription entity
	subscription := &domain.Subscription{
		UserID:           input.UserID,
		PackageID:        input.PackageID,
		StartDate:        startDate,
		EndDate:          endDate,
		Status:           domain.SubscriptionActive,
		RemainingQueries: pkg.QueryLimit,
	}

	// 6. Save to database
	if err := uc.subscriptionRepo.Create(ctx, subscription); err != nil {
		return nil, err
	}

	// 7. Load package details for response
	subscription.Package = pkg

	return subscription, nil
}

// ============================================
// GET SUBSCRIPTION
// ============================================

// GetSubscription retrieves a subscription by ID
func (uc *subscriptionUseCase) GetSubscription(ctx context.Context, id uuid.UUID) (*domain.Subscription, error) {
	return uc.subscriptionRepo.FindByID(ctx, id)
}

// GetUserSubscriptions retrieves all subscriptions for a user
func (uc *subscriptionUseCase) GetUserSubscriptions(ctx context.Context, userID uuid.UUID) ([]*domain.Subscription, error) {
	return uc.subscriptionRepo.FindByUserID(ctx, userID)
}

// GetActiveSubscription retrieves the active subscription for a user
func (uc *subscriptionUseCase) GetActiveSubscription(ctx context.Context, userID uuid.UUID) (*domain.Subscription, error) {
	return uc.subscriptionRepo.FindActiveByUserID(ctx, userID)
}

// ============================================
// CANCEL SUBSCRIPTION
// ============================================

// CancelSubscription cancels a subscription
func (uc *subscriptionUseCase) CancelSubscription(ctx context.Context, id uuid.UUID) error {
	// 1. Find subscription
	sub, err := uc.subscriptionRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	// 2. Check if already canceled or expired
	if sub.Status == domain.SubscriptionCanceled {
		return errors.New("subscription already canceled")
	}

	if sub.Status == domain.SubscriptionExpired {
		return errors.New("subscription already expired")
	}

	// 3. Cancel subscription
	return uc.subscriptionRepo.Cancel(ctx, id)
}

// ============================================
// QUERY VALIDATION
// ============================================

// CanUserQuery checks if a user can make a query
func (uc *subscriptionUseCase) CanUserQuery(ctx context.Context, userID uuid.UUID) (bool, error) {
	// 1. Get active subscription
	sub, err := uc.subscriptionRepo.FindActiveByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrSubscriptionNotFound) {
			return false, errors.New("no active subscription found")
		}
		return false, err
	}

	// 2. Check if subscription can query
	if !sub.CanQuery() {
		if sub.IsExpired() {
			return false, repository.ErrSubscriptionExpired
		}
		if !sub.HasQueriesRemaining() {
			return false, repository.ErrNoQueriesRemaining
		}
		return false, errors.New("subscription is not active")
	}

	return true, nil
}

// RecordQuery records a query usage and decrements quota
func (uc *subscriptionUseCase) RecordQuery(ctx context.Context, userID uuid.UUID) error {
	// 1. Get active subscription
	sub, err := uc.subscriptionRepo.FindActiveByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// 2. Check if user can query
	if !sub.CanQuery() {
		if sub.IsExpired() {
			return repository.ErrSubscriptionExpired
		}
		if !sub.HasQueriesRemaining() {
			return repository.ErrNoQueriesRemaining
		}
		return errors.New("subscription is not active")
	}

	// 3. Decrement remaining queries in subscription
	if err := uc.subscriptionRepo.DecrementQueries(ctx, sub.ID); err != nil {
		return err
	}

	// 4. Increment usage quota for today (for analytics)
	if err := uc.usageQuotaRepo.IncrementQueryCount(ctx, sub.ID); err != nil {
		// Log error but don't fail the request
		// Usage quota is for analytics only
		// In production, use proper logging
		_ = err
	}

	return nil
}

// ============================================
// BACKGROUND JOBS
// ============================================

// UpdateExpiredSubscriptions updates all expired subscriptions
// This should be run as a cron job daily
func (uc *subscriptionUseCase) UpdateExpiredSubscriptions(ctx context.Context) error {
	// 1. Find all expired subscriptions
	expiredSubs, err := uc.subscriptionRepo.FindExpired(ctx)
	if err != nil {
		return err
	}

	// 2. Update status for each
	for _, sub := range expiredSubs {
		if err := uc.subscriptionRepo.UpdateStatus(ctx, sub.ID, domain.SubscriptionExpired); err != nil {
			// Log error but continue processing others
			// In production, use proper logging
			_ = err
		}
	}

	return nil
}
