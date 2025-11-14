package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/package-service/internal/domain"
	"github.com/yourusername/epr-saas/package-service/internal/repository"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// usageQuotaRepository is the PostgreSQL implementation of UsageQuotaRepository
type usageQuotaRepository struct {
	db *gorm.DB
}

// NewUsageQuotaRepository creates a new instance of usageQuotaRepository
func NewUsageQuotaRepository(db *gorm.DB) repository.UsageQuotaRepository {
	return &usageQuotaRepository{
		db: db,
	}
}

// Compile-time check
var _ repository.UsageQuotaRepository = (*usageQuotaRepository)(nil)

// ============================================
// CREATE OR GET OPERATIONS
// ============================================

// GetOrCreateToday gets or creates today's usage quota for a subscription
func (r *usageQuotaRepository) GetOrCreateToday(ctx context.Context, subscriptionID uuid.UUID) (*domain.UsageQuota, error) {
	today := time.Now().Truncate(24 * time.Hour) // Strip time component

	var quota domain.UsageQuota

	// Try to find existing record for today
	// SELECT * FROM usage_quotas
	// WHERE subscription_id = ? AND date = ? LIMIT 1
	result := r.db.WithContext(ctx).
		Where("subscription_id = ? AND date = ?", subscriptionID, today).
		First(&quota)

	// If found, return it
	if result.Error == nil {
		return &quota, nil
	}

	// If not found, create a new one
	if result.Error == gorm.ErrRecordNotFound {
		quota = domain.UsageQuota{
			SubscriptionID: subscriptionID,
			Date:           today,
			QueryCount:     0,
		}

		// INSERT INTO usage_quotas (...)
		// ON CONFLICT (subscription_id, date) DO NOTHING
		// This handles race conditions
		createResult := r.db.WithContext(ctx).
			Clauses(clause.OnConflict{DoNothing: true}).
			Create(&quota)

		if createResult.Error != nil {
			return nil, createResult.Error
		}

		return &quota, nil
	}

	// Other error
	return nil, result.Error
}

// ============================================
// UPDATE OPERATIONS
// ============================================

// IncrementQueryCount increments the query count for today
func (r *usageQuotaRepository) IncrementQueryCount(ctx context.Context, subscriptionID uuid.UUID) error {
	today := time.Now().Truncate(24 * time.Hour)

	// Try to increment existing record
	// UPDATE usage_quotas
	// SET query_count = query_count + 1
	// WHERE subscription_id = ? AND date = ?
	result := r.db.WithContext(ctx).
		Model(&domain.UsageQuota{}).
		Where("subscription_id = ? AND date = ?", subscriptionID, today).
		UpdateColumn("query_count", gorm.Expr("query_count + 1"))

	// If no rows affected, record doesn't exist - create it
	if result.RowsAffected == 0 {
		quota := domain.UsageQuota{
			SubscriptionID: subscriptionID,
			Date:           today,
			QueryCount:     1, // First query of the day
		}

		// INSERT INTO usage_quotas (...)
		createResult := r.db.WithContext(ctx).
			Clauses(clause.OnConflict{
				Columns: []clause.Column{{Name: "subscription_id"}, {Name: "date"}},
				DoUpdates: clause.Assignments(map[string]interface{}{
					"query_count": gorm.Expr("usage_quotas.query_count + 1"),
				}),
			}).
			Create(&quota)

		if createResult.Error != nil {
			return createResult.Error
		}
	}

	return result.Error
}

// ============================================
// READ OPERATIONS
// ============================================

// GetUsageBySubscription gets usage records for a subscription within a date range
func (r *usageQuotaRepository) GetUsageBySubscription(ctx context.Context, subscriptionID uuid.UUID, startDate, endDate time.Time) ([]*domain.UsageQuota, error) {
	var quotas []*domain.UsageQuota

	// SELECT * FROM usage_quotas
	// WHERE subscription_id = ? AND date BETWEEN ? AND ?
	// ORDER BY date DESC
	result := r.db.WithContext(ctx).
		Where("subscription_id = ? AND date BETWEEN ? AND ?", subscriptionID, startDate, endDate).
		Order("date DESC").
		Find(&quotas)

	if result.Error != nil {
		return nil, result.Error
	}

	return quotas, nil
}

// GetTotalUsage gets the total query count for a subscription
func (r *usageQuotaRepository) GetTotalUsage(ctx context.Context, subscriptionID uuid.UUID) (int, error) {
	var totalCount int64

	// SELECT SUM(query_count) FROM usage_quotas
	// WHERE subscription_id = ?
	result := r.db.WithContext(ctx).
		Model(&domain.UsageQuota{}).
		Where("subscription_id = ?", subscriptionID).
		Select("COALESCE(SUM(query_count), 0)").
		Scan(&totalCount)

	if result.Error != nil {
		return 0, result.Error
	}

	return int(totalCount), nil
}

// ============================================
// DELETE OPERATIONS
// ============================================

// DeleteOlderThan deletes usage records older than the specified date
func (r *usageQuotaRepository) DeleteOlderThan(ctx context.Context, date time.Time) error {
	// DELETE FROM usage_quotas WHERE date < ?
	result := r.db.WithContext(ctx).
		Where("date < ?", date).
		Delete(&domain.UsageQuota{})

	return result.Error
}
