package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/user-service/internal/domain"
	"github.com/yourusername/epr-saas/user-service/internal/repository"
	"gorm.io/gorm"
)

// userRepository is the PostgreSQL implementation of UserRepository
// Struct này implement interface UserRepository
type userRepository struct {
	db *gorm.DB // GORM database connection
}

// NewUserRepository creates a new instance of userRepository
// Constructor function - tạo instance mới
func NewUserRepository(db *gorm.DB) repository.UserRepository {
	return &userRepository{
		db: db,
	}
}

// Compile-time check to ensure userRepository implements UserRepository interface
// Dòng này check lúc compile xem có implement đủ methods không
var _ repository.UserRepository = (*userRepository)(nil)

// ============================================
// CREATE OPERATIONS
// ============================================

// Create inserts a new user into the database
func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	// GORM Create() - INSERT INTO users (...)
	result := r.db.WithContext(ctx).Create(user)

	if result.Error != nil {
		// Check if error is duplicate email
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return repository.ErrEmailAlreadyExists
		}
		return result.Error
	}

	return nil
}

// ============================================
// READ OPERATIONS
// ============================================

// FindByID finds a user by their ID
func (r *userRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	var user domain.User

	// GORM First() - SELECT * FROM users WHERE id = ? LIMIT 1
	result := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, repository.ErrUserNotFound
		}
		return nil, result.Error
	}

	return &user, nil
}

// FindByEmail finds a user by their email address
func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User

	// SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1
	// GORM tự động thêm deleted_at IS NULL (soft delete)
	result := r.db.WithContext(ctx).
		Where("email = ?", email).
		First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, repository.ErrUserNotFound
		}
		return nil, result.Error
	}

	return &user, nil
}

// FindAll retrieves all users with pagination
func (r *userRepository) FindAll(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	var users []*domain.User

	// SELECT * FROM users
	// WHERE deleted_at IS NULL
	// ORDER BY created_at DESC
	// LIMIT ? OFFSET ?
	result := r.db.WithContext(ctx).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&users)

	if result.Error != nil {
		return nil, result.Error
	}

	return users, nil
}

// Count returns the total number of users
func (r *userRepository) Count(ctx context.Context) (int64, error) {
	var count int64

	// SELECT COUNT(*) FROM users WHERE deleted_at IS NULL
	result := r.db.WithContext(ctx).
		Model(&domain.User{}).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

// ============================================
// UPDATE OPERATIONS
// ============================================

// Update updates an existing user
func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	// UPDATE users SET ... WHERE id = ?
	// GORM tự động update updated_at timestamp
	result := r.db.WithContext(ctx).
		Model(user).
		Updates(user)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrUserNotFound
	}

	return nil
}

// UpdateLastLogin updates the last login timestamp for a user
func (r *userRepository) UpdateLastLogin(ctx context.Context, userID uuid.UUID) error {
	now := time.Now()

	// UPDATE users SET last_login_at = NOW() WHERE id = ?
	// Chỉ update 1 field (optimize hơn Update toàn bộ)
	result := r.db.WithContext(ctx).
		Model(&domain.User{}).
		Where("id = ?", userID).
		Update("last_login_at", now)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrUserNotFound
	}

	return nil
}

// ============================================
// DELETE OPERATIONS
// ============================================

// Delete performs a soft delete on a user
func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// UPDATE users SET deleted_at = NOW() WHERE id = ?
	// GORM soft delete - set deleted_at timestamp
	result := r.db.WithContext(ctx).
		Delete(&domain.User{}, id)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrUserNotFound
	}

	return nil
}

// HardDelete permanently deletes a user from the database
func (r *userRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	// DELETE FROM users WHERE id = ?
	// Unscoped() bỏ qua soft delete, xóa thật sự
	result := r.db.WithContext(ctx).
		Unscoped().
		Delete(&domain.User{}, id)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrUserNotFound
	}

	return nil
}

// ============================================
// VERIFICATION OPERATIONS
// ============================================

// MarkAsVerified marks a user as verified
func (r *userRepository) MarkAsVerified(ctx context.Context, userID uuid.UUID) error {
	now := time.Now()

	// UPDATE users
	// SET is_verified = true, email_verified_at = NOW()
	// WHERE id = ?
	result := r.db.WithContext(ctx).
		Model(&domain.User{}).
		Where("id = ?", userID).
		Updates(map[string]interface{}{
			"is_verified":       true,
			"email_verified_at": now,
		})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrUserNotFound
	}

	return nil
}

// ============================================
// QUERY OPERATIONS
// ============================================

// Exists checks if a user with the given email exists
func (r *userRepository) Exists(ctx context.Context, email string) (bool, error) {
	var count int64

	// SELECT COUNT(*) FROM users WHERE email = ? AND deleted_at IS NULL
	result := r.db.WithContext(ctx).
		Model(&domain.User{}).
		Where("email = ?", email).
		Count(&count)

	if result.Error != nil {
		return false, result.Error
	}

	return count > 0, nil
}

// IsActive checks if a user is active
func (r *userRepository) IsActive(ctx context.Context, userID uuid.UUID) (bool, error) {
	var user domain.User

	// SELECT is_active FROM users WHERE id = ? LIMIT 1
	result := r.db.WithContext(ctx).
		Select("is_active").
		Where("id = ?", userID).
		First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return false, repository.ErrUserNotFound
		}
		return false, result.Error
	}

	return user.IsActive, nil
}

// Errors are now defined in repository/interface.go
