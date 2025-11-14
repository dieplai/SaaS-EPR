package usecase

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/package-service/internal/domain"
	"github.com/yourusername/epr-saas/package-service/internal/repository"
)

// PackageUseCase defines the interface for package business logic
type PackageUseCase interface {
	CreatePackage(ctx context.Context, input *domain.CreatePackageInput) (*domain.Package, error)
	GetPackage(ctx context.Context, id uuid.UUID) (*domain.Package, error)
	GetPackageByName(ctx context.Context, name string) (*domain.Package, error)
	GetAllPackages(ctx context.Context, limit, offset int) ([]*domain.Package, error)
	GetActivePackages(ctx context.Context) ([]*domain.Package, error)
	UpdatePackage(ctx context.Context, id uuid.UUID, input *domain.UpdatePackageInput) (*domain.Package, error)
	DeletePackage(ctx context.Context, id uuid.UUID) error
}

// packageUseCase implements PackageUseCase interface
type packageUseCase struct {
	packageRepo repository.PackageRepository
}

// NewPackageUseCase creates a new instance of packageUseCase
func NewPackageUseCase(packageRepo repository.PackageRepository) PackageUseCase {
	return &packageUseCase{
		packageRepo: packageRepo,
	}
}

// ============================================
// CREATE PACKAGE
// ============================================

// CreatePackage creates a new package
func (uc *packageUseCase) CreatePackage(ctx context.Context, input *domain.CreatePackageInput) (*domain.Package, error) {
	// 1. Validate input
	if input.Price < 0 {
		return nil, errors.New("price must be non-negative")
	}

	if input.QueryLimit <= 0 {
		return nil, errors.New("query limit must be positive")
	}

	if input.DurationDays <= 0 {
		return nil, errors.New("duration days must be positive")
	}

	// 2. Check if package name already exists
	existingPkg, err := uc.packageRepo.FindByName(ctx, input.Name)
	if err == nil && existingPkg != nil {
		return nil, repository.ErrPackageNameExists
	}

	// 3. Create package entity
	pkg := &domain.Package{
		Name:         input.Name,
		Description:  input.Description,
		Price:        input.Price,
		QueryLimit:   input.QueryLimit,
		DurationDays: input.DurationDays,
		Features:     input.Features,
		IsActive:     true,
	}

	// 4. Save to database
	if err := uc.packageRepo.Create(ctx, pkg); err != nil {
		return nil, err
	}

	return pkg, nil
}

// ============================================
// GET PACKAGE
// ============================================

// GetPackage retrieves a package by ID
func (uc *packageUseCase) GetPackage(ctx context.Context, id uuid.UUID) (*domain.Package, error) {
	return uc.packageRepo.FindByID(ctx, id)
}

// GetPackageByName retrieves a package by name
func (uc *packageUseCase) GetPackageByName(ctx context.Context, name string) (*domain.Package, error) {
	return uc.packageRepo.FindByName(ctx, name)
}

// GetAllPackages retrieves all packages with pagination
func (uc *packageUseCase) GetAllPackages(ctx context.Context, limit, offset int) ([]*domain.Package, error) {
	return uc.packageRepo.FindAll(ctx, limit, offset)
}

// GetActivePackages retrieves all active packages
func (uc *packageUseCase) GetActivePackages(ctx context.Context) ([]*domain.Package, error) {
	return uc.packageRepo.FindActive(ctx)
}

// ============================================
// UPDATE PACKAGE
// ============================================

// UpdatePackage updates an existing package
func (uc *packageUseCase) UpdatePackage(ctx context.Context, id uuid.UUID, input *domain.UpdatePackageInput) (*domain.Package, error) {
	// 1. Find existing package
	pkg, err := uc.packageRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// 2. Update fields if provided
	if input.Name != nil {
		pkg.Name = *input.Name
	}

	if input.Description != nil {
		pkg.Description = *input.Description
	}

	if input.Price != nil {
		if *input.Price < 0 {
			return nil, errors.New("price must be non-negative")
		}
		pkg.Price = *input.Price
	}

	if input.QueryLimit != nil {
		if *input.QueryLimit <= 0 {
			return nil, errors.New("query limit must be positive")
		}
		pkg.QueryLimit = *input.QueryLimit
	}

	if input.DurationDays != nil {
		if *input.DurationDays <= 0 {
			return nil, errors.New("duration days must be positive")
		}
		pkg.DurationDays = *input.DurationDays
	}

	if input.Features != nil {
		pkg.Features = *input.Features
	}

	if input.IsActive != nil {
		pkg.IsActive = *input.IsActive
	}

	// 3. Save changes
	if err := uc.packageRepo.Update(ctx, pkg); err != nil {
		return nil, err
	}

	return pkg, nil
}

// ============================================
// DELETE PACKAGE
// ============================================

// DeletePackage soft-deletes a package
func (uc *packageUseCase) DeletePackage(ctx context.Context, id uuid.UUID) error {
	// Note: We use soft delete to preserve historical data
	// Active subscriptions can still reference deleted packages
	return uc.packageRepo.Delete(ctx, id)
}
