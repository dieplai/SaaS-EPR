package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/package-service/internal/domain"
	"github.com/yourusername/epr-saas/package-service/internal/repository"
	"gorm.io/gorm"
)

// subscriptionRepository is the PostgreSQL implementation of SubscriptionRepository
type subscriptionRepository struct {
	db *gorm.DB
}

// NewSubscriptionRepository creates a new instance of subscriptionRepository
func NewSubscriptionRepository(db *gorm.DB) repository.SubscriptionRepository {
	return &subscriptionRepository{
		db: db,
	}
}

// Compile-time check
var _ repository.SubscriptionRepository = (*subscriptionRepository)(nil)

// ============================================
// CREATE OPERATIONS
// ============================================

// Create inserts a new subscription into the database
func (r *subscriptionRepository) Create(ctx context.Context, sub *domain.Subscription) error {
	// INSERT INTO subscriptions (...)
	result := r.db.WithContext(ctx).Create(sub)

	if result.Error != nil {
		return result.Error
	}

	return nil
}

// ============================================
// READ OPERATIONS
// ============================================

// FindByID finds a subscription by its ID
func (r *subscriptionRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Subscription, error) {
	var sub domain.Subscription

	// SELECT * FROM subscriptions WHERE id = ? AND deleted_at IS NULL LIMIT 1
	// Preload Package details
	result := r.db.WithContext(ctx).
		Preload("Package").
		Where("id = ?", id).
		First(&sub)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, repository.ErrSubscriptionNotFound
		}
		return nil, result.Error
	}

	return &sub, nil
}

// FindByUserID finds all subscriptions for a user
func (r *subscriptionRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Subscription, error) {
	var subscriptions []*domain.Subscription

	// SELECT * FROM subscriptions
	// WHERE user_id = ? AND deleted_at IS NULL
	// ORDER BY created_at DESC
	result := r.db.WithContext(ctx).
		Preload("Package").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&subscriptions)

	if result.Error != nil {
		return nil, result.Error
	}

	return subscriptions, nil
}

// FindActiveByUserID finds the active subscription for a user
func (r *subscriptionRepository) FindActiveByUserID(ctx context.Context, userID uuid.UUID) (*domain.Subscription, error) {
	var sub domain.Subscription

	// SELECT * FROM subscriptions
	// WHERE user_id = ? AND status = 'active' AND deleted_at IS NULL
	// AND CURRENT_TIMESTAMP AT TIME ZONE 'UTC' BETWEEN start_date AND end_date
	// ORDER BY created_at DESC LIMIT 1
	result := r.db.WithContext(ctx).
		Preload("Package").
		Where("user_id = ? AND status = ?", userID, domain.SubscriptionActive).
		Where("CURRENT_TIMESTAMP AT TIME ZONE 'UTC' BETWEEN start_date AND end_date").
		Order("created_at DESC").
		First(&sub)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, repository.ErrSubscriptionNotFound
		}
		return nil, result.Error
	}

	return &sub, nil
}

// FindExpired finds all expired subscriptions that are still marked as active
func (r *subscriptionRepository) FindExpired(ctx context.Context) ([]*domain.Subscription, error) {
	var subscriptions []*domain.Subscription

	// SELECT * FROM subscriptions
	// WHERE status = 'active' AND end_date < CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AND deleted_at IS NULL
	result := r.db.WithContext(ctx).
		Where("status = ? AND end_date < CURRENT_TIMESTAMP AT TIME ZONE 'UTC'", domain.SubscriptionActive).
		Find(&subscriptions)

	if result.Error != nil {
		return nil, result.Error
	}

	return subscriptions, nil
}

// Count returns the total number of subscriptions
func (r *subscriptionRepository) Count(ctx context.Context) (int64, error) {
	var count int64

	// SELECT COUNT(*) FROM subscriptions WHERE deleted_at IS NULL
	result := r.db.WithContext(ctx).
		Model(&domain.Subscription{}).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

// ============================================
// UPDATE OPERATIONS
// ============================================

// Update updates an existing subscription
func (r *subscriptionRepository) Update(ctx context.Context, sub *domain.Subscription) error {
	// UPDATE subscriptions SET ... WHERE id = ?
	result := r.db.WithContext(ctx).
		Model(sub).
		Updates(sub)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrSubscriptionNotFound
	}

	return nil
}

// UpdateStatus updates the status of a subscription
func (r *subscriptionRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.SubscriptionStatus) error {
	// UPDATE subscriptions SET status = ? WHERE id = ?
	result := r.db.WithContext(ctx).
		Model(&domain.Subscription{}).
		Where("id = ?", id).
		Update("status", status)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrSubscriptionNotFound
	}

	return nil
}

// DecrementQueries decrements the remaining queries count
func (r *subscriptionRepository) DecrementQueries(ctx context.Context, id uuid.UUID) error {
	// UPDATE subscriptions
	// SET remaining_queries = remaining_queries - 1
	// WHERE id = ? AND remaining_queries > 0
	result := r.db.WithContext(ctx).
		Model(&domain.Subscription{}).
		Where("id = ? AND remaining_queries > 0", id).
		UpdateColumn("remaining_queries", gorm.Expr("remaining_queries - 1"))

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrNoQueriesRemaining
	}

	return nil
}

// ============================================
// DELETE OPERATIONS
// ============================================

// Delete performs a soft delete on a subscription
func (r *subscriptionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// UPDATE subscriptions SET deleted_at = NOW() WHERE id = ?
	result := r.db.WithContext(ctx).
		Delete(&domain.Subscription{}, id)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrSubscriptionNotFound
	}

	return nil
}

// Cancel cancels a subscription (sets status to canceled)
func (r *subscriptionRepository) Cancel(ctx context.Context, id uuid.UUID) error {
	// UPDATE subscriptions SET status = 'canceled' WHERE id = ?
	return r.UpdateStatus(ctx, id, domain.SubscriptionCanceled)
}
