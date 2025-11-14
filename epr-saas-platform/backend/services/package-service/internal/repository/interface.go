package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/package-service/internal/domain"
)

// ============================================
// ERROR DEFINITIONS
// ============================================

var (
	// ErrPackageNotFound is returned when a package is not found
	ErrPackageNotFound = errors.New("package not found")

	// ErrPackageNameExists is returned when package name already exists
	ErrPackageNameExists = errors.New("package name already exists")

	// ErrSubscriptionNotFound is returned when a subscription is not found
	ErrSubscriptionNotFound = errors.New("subscription not found")

	// ErrActiveSubscriptionExists is returned when user already has an active subscription
	ErrActiveSubscriptionExists = errors.New("user already has an active subscription")

	// ErrNoQueriesRemaining is returned when subscription has no queries left
	ErrNoQueriesRemaining = errors.New("no queries remaining")

	// ErrSubscriptionExpired is returned when subscription has expired
	ErrSubscriptionExpired = errors.New("subscription has expired")
)

// ============================================
// PACKAGE REPOSITORY
// ============================================

// PackageRepository defines the interface for package data access
type PackageRepository interface {
	// Create operations
	Create(ctx context.Context, pkg *domain.Package) error

	// Read operations
	FindByID(ctx context.Context, id uuid.UUID) (*domain.Package, error)
	FindByName(ctx context.Context, name string) (*domain.Package, error)
	FindAll(ctx context.Context, limit, offset int) ([]*domain.Package, error)
	FindActive(ctx context.Context) ([]*domain.Package, error)
	Count(ctx context.Context) (int64, error)

	// Update operations
	Update(ctx context.Context, pkg *domain.Package) error

	// Delete operations
	Delete(ctx context.Context, id uuid.UUID) error      // Soft delete
	HardDelete(ctx context.Context, id uuid.UUID) error  // Permanent delete
}

// ============================================
// SUBSCRIPTION REPOSITORY
// ============================================

// SubscriptionRepository defines the interface for subscription data access
type SubscriptionRepository interface {
	// Create operations
	Create(ctx context.Context, sub *domain.Subscription) error

	// Read operations
	FindByID(ctx context.Context, id uuid.UUID) (*domain.Subscription, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Subscription, error)
	FindActiveByUserID(ctx context.Context, userID uuid.UUID) (*domain.Subscription, error)
	FindExpired(ctx context.Context) ([]*domain.Subscription, error)
	Count(ctx context.Context) (int64, error)

	// Update operations
	Update(ctx context.Context, sub *domain.Subscription) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status domain.SubscriptionStatus) error
	DecrementQueries(ctx context.Context, id uuid.UUID) error

	// Delete operations
	Delete(ctx context.Context, id uuid.UUID) error
	Cancel(ctx context.Context, id uuid.UUID) error // Cancel subscription
}

// ============================================
// USAGE QUOTA REPOSITORY
// ============================================

// UsageQuotaRepository defines the interface for usage quota tracking
type UsageQuotaRepository interface {
	// Create or get today's quota
	GetOrCreateToday(ctx context.Context, subscriptionID uuid.UUID) (*domain.UsageQuota, error)

	// Increment query count
	IncrementQueryCount(ctx context.Context, subscriptionID uuid.UUID) error

	// Get usage statistics
	GetUsageBySubscription(ctx context.Context, subscriptionID uuid.UUID, startDate, endDate time.Time) ([]*domain.UsageQuota, error)
	GetTotalUsage(ctx context.Context, subscriptionID uuid.UUID) (int, error)

	// Cleanup old records
	DeleteOlderThan(ctx context.Context, date time.Time) error
}
