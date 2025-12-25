package postgres

import (
	"context"
	"errors"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PackageRepository struct {
	db *gorm.DB
}

func NewPackageRepository(db *gorm.DB) *PackageRepository {
	return &PackageRepository{db: db}
}

func (r *PackageRepository) Save(ctx context.Context, pkg *packagedomain.Package) error {
	model := r.toModel(pkg)
	return r.db.WithContext(ctx).Save(model).Error
}

func (r *PackageRepository) FindByID(ctx context.Context, id uuid.UUID) (*packagedomain.Package, error) {
	var model PackageModel
	result := r.db.WithContext(ctx).Where("id = ?", id).First(&model)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, result.Error
	}

	return r.toDomain(&model)
}

func (r *PackageRepository) FindByName(ctx context.Context, name string) (*packagedomain.Package, error) {
	var model PackageModel
	result := r.db.WithContext(ctx).Where("name = ?", name).First(&model)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, result.Error
	}

	return r.toDomain(&model)
}

func (r *PackageRepository) FindByPrice(ctx context.Context, price float64) (*packagedomain.Package, error) {
	var model PackageModel
	result := r.db.WithContext(ctx).Where("price = ? AND is_active = ?", price, true).First(&model)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, result.Error
	}

	return r.toDomain(&model)
}

func (r *PackageRepository) FindAll(ctx context.Context, limit, offset int) ([]*packagedomain.Package, error) {
	var models []PackageModel
	result := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	packages := make([]*packagedomain.Package, len(models))
	for i, model := range models {
		pkg, err := r.toDomain(&model)
		if err != nil {
			return nil, err
		}
		packages[i] = pkg
	}

	return packages, nil
}

func (r *PackageRepository) FindActive(ctx context.Context) ([]*packagedomain.Package, error) {
	var models []PackageModel
	result := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	packages := make([]*packagedomain.Package, len(models))
	for i, model := range models {
		pkg, err := r.toDomain(&model)
		if err != nil {
			return nil, err
		}
		packages[i] = pkg
	}

	return packages, nil
}

func (r *PackageRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&PackageModel{}, id).Error
}

func (r *PackageRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(&PackageModel{}).Count(&count)
	return count, result.Error
}

func (r *PackageRepository) toModel(pkg *packagedomain.Package) *PackageModel {
	features := FeatureArray(pkg.GetFeatures())

	// Map Duration to BillingPeriod
	billingPeriod := "monthly"
	if pkg.GetDuration().Days() >= 365 {
		billingPeriod = "yearly"
	}

	// Map TokenLimit to QueryLimitDaily and QueryLimitMonthly
	dailyLimit := pkg.GetTokenLimit().Value()
	monthlyLimit := dailyLimit * 30

	return &PackageModel{
		ID:                     pkg.ID,
		Name:                   pkg.GetName(),
		DisplayName:            pkg.GetName(), // Use name as display name for now
		Description:            pkg.GetDescription(),
		Price:                  pkg.GetPrice().Amount(),
		Currency:               "USD",
		BillingPeriod:          billingPeriod,
		QueryLimitDaily:        dailyLimit,
		QueryLimitMonthly:      &monthlyLimit,
		AllowedModels:          ModelArray{"gpt-3.5-turbo"},
		Features:               features,
		ApiAccess:              false,
		PrioritySupport:        false,
		MaxConversationHistory: 20,
		IsActive:               pkg.IsActive(),
		IsFeatured:             false,
		SortOrder:              0,
		CreatedAt:              pkg.CreatedAt,
		UpdatedAt:              pkg.UpdatedAt,
	}
}

func (r *PackageRepository) toDomain(model *PackageModel) (*packagedomain.Package, error) {
	price, err := packagedomain.NewMoney(model.Price)
	if err != nil {
		return nil, err
	}

	// Map QueryLimitDaily to TokenLimit
	tokenLimit, err := packagedomain.NewTokenLimit(model.QueryLimitDaily)
	if err != nil {
		return nil, err
	}

	// Map BillingPeriod to Duration (days)
	durationDays := 30 // default monthly
	if model.BillingPeriod == "yearly" {
		durationDays = 365
	}
	duration, err := packagedomain.NewDuration(durationDays)
	if err != nil {
		return nil, err
	}

	pkg, err := packagedomain.NewPackage(
		model.Name,
		model.Description,
		price,
		tokenLimit,
		duration,
	)
	if err != nil {
		return nil, err
	}

	pkg.ID = model.ID
	pkg.CreatedAt = model.CreatedAt
	pkg.UpdatedAt = model.UpdatedAt

	if len(model.Features) > 0 {
		pkg.SetFeatures(model.Features)
	}

	if !model.IsActive {
		pkg.Deactivate()
	}

	pkg.ClearDomainEvents()

	return pkg, nil
}
