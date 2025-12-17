package postgres

import (
	"context"
	"errors"

	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubscriptionRepository struct {
	db *gorm.DB
}

func NewSubscriptionRepository(db *gorm.DB) *SubscriptionRepository {
	return &SubscriptionRepository{db: db}
}

func (r *SubscriptionRepository) Save(ctx context.Context, sub *subscription.Subscription) error {
	model := r.toModel(sub)
	return r.db.WithContext(ctx).Save(model).Error
}

func (r *SubscriptionRepository) FindByID(ctx context.Context, id uuid.UUID) (*subscription.Subscription, error) {
	var model SubscriptionModel
	result := r.db.WithContext(ctx).Where("id = ?", id).First(&model)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, result.Error
	}

	return r.toDomain(&model)
}

func (r *SubscriptionRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*subscription.Subscription, error) {
	var models []SubscriptionModel
	result := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	subscriptions := make([]*subscription.Subscription, len(models))
	for i, model := range models {
		sub, err := r.toDomain(&model)
		if err != nil {
			return nil, err
		}
		subscriptions[i] = sub
	}

	return subscriptions, nil
}

func (r *SubscriptionRepository) FindActiveByUserID(ctx context.Context, userID uuid.UUID) (*subscription.Subscription, error) {
	var model SubscriptionModel
	result := r.db.WithContext(ctx).
		Where("user_id = ? AND status = ?", userID, "active").
		Order("created_at DESC").
		First(&model)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}

	return r.toDomain(&model)
}

func (r *SubscriptionRepository) FindExpired(ctx context.Context) ([]*subscription.Subscription, error) {
	var models []SubscriptionModel
	result := r.db.WithContext(ctx).
		Where("status = ? AND end_date < ?", "active", gorm.Expr("NOW()")).
		Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	subscriptions := make([]*subscription.Subscription, len(models))
	for i, model := range models {
		sub, err := r.toDomain(&model)
		if err != nil {
			return nil, err
		}
		subscriptions[i] = sub
	}

	return subscriptions, nil
}

func (r *SubscriptionRepository) FindDueForTokenReset(ctx context.Context) ([]*subscription.Subscription, error) {
	var models []SubscriptionModel

	// Find active subscriptions where next_token_reset_at is in the past
	result := r.db.WithContext(ctx).
		Where("status = ?", "active").
		Where("end_date > NOW()").
		Where("next_token_reset_at IS NOT NULL").
		Where("next_token_reset_at <= NOW()").
		Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	subscriptions := make([]*subscription.Subscription, len(models))
	for i, model := range models {
		sub, err := r.toDomain(&model)
		if err != nil {
			return nil, err
		}
		subscriptions[i] = sub
	}

	return subscriptions, nil
}

func (r *SubscriptionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&SubscriptionModel{}, id).Error
}

func (r *SubscriptionRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(&SubscriptionModel{}).Count(&count)
	return count, result.Error
}

func (r *SubscriptionRepository) toModel(sub *subscription.Subscription) *SubscriptionModel {
	return &SubscriptionModel{
		ID:                 sub.ID,
		UserID:             sub.GetUserID(),
		PackageID:          sub.GetPackageID(),
		StartDate:          sub.GetStartDate(),
		EndDate:            sub.GetEndDate(),
		Status:             sub.GetStatus().String(),
		RemainingTokens:    sub.GetRemainingTokens(),
		TotalTokens:        sub.GetTotalTokens(),
		CurrentPeriodStart: sub.GetCurrentPeriodStart(),
		CurrentPeriodEnd:   sub.GetCurrentPeriodEnd(),
		AutoRenew:          sub.GetAutoRenew(),
		LastTokenResetAt:   sub.GetLastTokenResetAt(),
		NextTokenResetAt:   sub.GetNextTokenResetAt(),
		CreatedAt:          sub.CreatedAt,
		UpdatedAt:          sub.UpdatedAt,
		DeletedAt:          gorm.DeletedAt{Valid: sub.DeletedAt != nil},
	}
}

func (r *SubscriptionRepository) toDomain(model *SubscriptionModel) (*subscription.Subscription, error) {
	status, err := subscription.NewStatus(model.Status)
	if err != nil {
		return nil, err
	}

	sub := subscription.ReconstructSubscription(
		model.ID,
		model.UserID,
		model.PackageID,
		model.StartDate,
		model.EndDate,
		status,
		model.RemainingTokens,
		model.TotalTokens,
		model.CurrentPeriodStart,
		model.CurrentPeriodEnd,
		model.AutoRenew,
		model.LastTokenResetAt,
		model.NextTokenResetAt,
		model.CreatedAt,
		model.UpdatedAt,
	)

	if model.DeletedAt.Valid {
		t := model.DeletedAt.Time
		sub.DeletedAt = &t
	}

	sub.ClearDomainEvents()

	return sub, nil
}
