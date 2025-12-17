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
	return &PackageModel{
		ID:           pkg.ID,
		Name:         pkg.GetName(),
		Description:  pkg.GetDescription(),
		Price:        pkg.GetPrice().Amount(),
		TokenLimit:   pkg.GetTokenLimit().Value(),
		DurationDays: pkg.GetDuration().Days(),
		Features:     features,
		IsActive:     pkg.IsActive(),
		CreatedAt:    pkg.CreatedAt,
		UpdatedAt:    pkg.UpdatedAt,
		DeletedAt:    gorm.DeletedAt{Valid: pkg.DeletedAt != nil},
	}
}

func (r *PackageRepository) toDomain(model *PackageModel) (*packagedomain.Package, error) {
	price, err := packagedomain.NewMoney(model.Price)
	if err != nil {
		return nil, err
	}

	tokenLimit, err := packagedomain.NewTokenLimit(model.TokenLimit)
	if err != nil {
		return nil, err
	}

	duration, err := packagedomain.NewDuration(model.DurationDays)
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
	if model.DeletedAt.Valid {
		t := model.DeletedAt.Time
		pkg.DeletedAt = &t
	}

	if len(model.Features) > 0 {
		pkg.SetFeatures(model.Features)
	}

	if !model.IsActive {
		pkg.Deactivate()
	}

	pkg.ClearDomainEvents()

	return pkg, nil
}
