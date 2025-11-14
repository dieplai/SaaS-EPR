package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/package-service/internal/domain"
	"github.com/yourusername/epr-saas/package-service/internal/repository"
	"gorm.io/gorm"
)

// packageRepository is the PostgreSQL implementation of PackageRepository
type packageRepository struct {
	db *gorm.DB
}

// NewPackageRepository creates a new instance of packageRepository
func NewPackageRepository(db *gorm.DB) repository.PackageRepository {
	return &packageRepository{
		db: db,
	}
}

// Compile-time check
var _ repository.PackageRepository = (*packageRepository)(nil)

// ============================================
// CREATE OPERATIONS
// ============================================

// Create inserts a new package into the database
func (r *packageRepository) Create(ctx context.Context, pkg *domain.Package) error {
	// INSERT INTO packages (...)
	result := r.db.WithContext(ctx).Create(pkg)

	if result.Error != nil {
		// Check if error is duplicate name
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return repository.ErrPackageNameExists
		}
		return result.Error
	}

	return nil
}

// ============================================
// READ OPERATIONS
// ============================================

// FindByID finds a package by its ID
func (r *packageRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Package, error) {
	var pkg domain.Package

	// SELECT * FROM packages WHERE id = ? AND deleted_at IS NULL LIMIT 1
	result := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(&pkg)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, repository.ErrPackageNotFound
		}
		return nil, result.Error
	}

	return &pkg, nil
}

// FindByName finds a package by its name
func (r *packageRepository) FindByName(ctx context.Context, name string) (*domain.Package, error) {
	var pkg domain.Package

	// SELECT * FROM packages WHERE name = ? AND deleted_at IS NULL LIMIT 1
	result := r.db.WithContext(ctx).
		Where("name = ?", name).
		First(&pkg)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, repository.ErrPackageNotFound
		}
		return nil, result.Error
	}

	return &pkg, nil
}

// FindAll retrieves all packages with pagination
func (r *packageRepository) FindAll(ctx context.Context, limit, offset int) ([]*domain.Package, error) {
	var packages []*domain.Package

	// SELECT * FROM packages
	// WHERE deleted_at IS NULL
	// ORDER BY created_at DESC
	// LIMIT ? OFFSET ?
	result := r.db.WithContext(ctx).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&packages)

	if result.Error != nil {
		return nil, result.Error
	}

	return packages, nil
}

// FindActive retrieves all active packages
func (r *packageRepository) FindActive(ctx context.Context) ([]*domain.Package, error) {
	var packages []*domain.Package

	// SELECT * FROM packages
	// WHERE is_active = true AND deleted_at IS NULL
	// ORDER BY price ASC
	result := r.db.WithContext(ctx).
		Where("is_active = ?", true).
		Order("price ASC").
		Find(&packages)

	if result.Error != nil {
		return nil, result.Error
	}

	return packages, nil
}

// Count returns the total number of packages
func (r *packageRepository) Count(ctx context.Context) (int64, error) {
	var count int64

	// SELECT COUNT(*) FROM packages WHERE deleted_at IS NULL
	result := r.db.WithContext(ctx).
		Model(&domain.Package{}).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

// ============================================
// UPDATE OPERATIONS
// ============================================

// Update updates an existing package
func (r *packageRepository) Update(ctx context.Context, pkg *domain.Package) error {
	// UPDATE packages SET ... WHERE id = ?
	result := r.db.WithContext(ctx).
		Model(pkg).
		Updates(pkg)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrPackageNotFound
	}

	return nil
}

// ============================================
// DELETE OPERATIONS
// ============================================

// Delete performs a soft delete on a package
func (r *packageRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// UPDATE packages SET deleted_at = NOW() WHERE id = ?
	result := r.db.WithContext(ctx).
		Delete(&domain.Package{}, id)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrPackageNotFound
	}

	return nil
}

// HardDelete permanently deletes a package from the database
func (r *packageRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	// DELETE FROM packages WHERE id = ?
	result := r.db.WithContext(ctx).
		Unscoped().
		Delete(&domain.Package{}, id)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrPackageNotFound
	}

	return nil
}
