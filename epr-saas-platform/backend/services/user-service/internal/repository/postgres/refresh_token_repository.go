package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/user-service/internal/repository"
	"gorm.io/gorm"
)

// refreshTokenRepository is the PostgreSQL implementation of RefreshTokenRepository
type refreshTokenRepository struct {
	db *gorm.DB
}

// NewRefreshTokenRepository creates a new instance of refreshTokenRepository
func NewRefreshTokenRepository(db *gorm.DB) repository.RefreshTokenRepository {
	return &refreshTokenRepository{
		db: db,
	}
}

// Compile-time check
var _ repository.RefreshTokenRepository = (*refreshTokenRepository)(nil)

// ============================================
// CREATE OPERATIONS
// ============================================

// Create inserts a new refresh token into the database
func (r *refreshTokenRepository) Create(ctx context.Context, token *repository.RefreshToken) error {
	// INSERT INTO refresh_tokens (...)
	result := r.db.WithContext(ctx).Create(token)

	if result.Error != nil {
		return result.Error
	}

	return nil
}

// ============================================
// READ OPERATIONS
// ============================================

// FindByToken finds a refresh token by token string
func (r *refreshTokenRepository) FindByToken(ctx context.Context, token string) (*repository.RefreshToken, error) {
	var refreshToken repository.RefreshToken

	// SELECT * FROM refresh_tokens WHERE token = ? LIMIT 1
	result := r.db.WithContext(ctx).
		Where("token = ?", token).
		First(&refreshToken)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, repository.ErrTokenNotFound
		}
		return nil, result.Error
	}

	return &refreshToken, nil
}

// FindByUserID finds all active tokens for a user
func (r *refreshTokenRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*repository.RefreshToken, error) {
	var tokens []*repository.RefreshToken

	// SELECT * FROM refresh_tokens
	// WHERE user_id = ? AND revoked_at IS NULL
	// ORDER BY created_at DESC
	result := r.db.WithContext(ctx).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Order("created_at DESC").
		Find(&tokens)

	if result.Error != nil {
		return nil, result.Error
	}

	return tokens, nil
}

// ============================================
// UPDATE OPERATIONS
// ============================================

// Revoke revokes a specific refresh token
func (r *refreshTokenRepository) Revoke(ctx context.Context, token string) error {
	now := time.Now().Unix()

	// UPDATE refresh_tokens
	// SET revoked_at = NOW()
	// WHERE token = ?
	result := r.db.WithContext(ctx).
		Model(&repository.RefreshToken{}).
		Where("token = ?", token).
		Update("revoked_at", now)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return repository.ErrTokenNotFound
	}

	return nil
}

// RevokeAllForUser revokes all tokens for a user (logout from all devices)
func (r *refreshTokenRepository) RevokeAllForUser(ctx context.Context, userID uuid.UUID) error {
	now := time.Now().Unix()

	// UPDATE refresh_tokens
	// SET revoked_at = NOW()
	// WHERE user_id = ? AND revoked_at IS NULL
	result := r.db.WithContext(ctx).
		Model(&repository.RefreshToken{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", now)

	if result.Error != nil {
		return result.Error
	}

	return nil
}

// ============================================
// DELETE OPERATIONS
// ============================================

// DeleteExpired deletes expired tokens (cleanup job)
func (r *refreshTokenRepository) DeleteExpired(ctx context.Context) error {
	now := time.Now().Unix()

	// DELETE FROM refresh_tokens
	// WHERE expires_at < NOW()
	result := r.db.WithContext(ctx).
		Where("expires_at < ?", now).
		Delete(&repository.RefreshToken{})

	if result.Error != nil {
		return result.Error
	}

	return nil
}

// Errors are now defined in repository/interface.go
