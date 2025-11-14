package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/user-service/internal/domain"
)

// ============================================
// ERROR DEFINITIONS
// ============================================

var (
	// ErrUserNotFound is returned when a user is not found
	ErrUserNotFound = errors.New("user not found")

	// ErrEmailAlreadyExists is returned when trying to create a user with duplicate email
	ErrEmailAlreadyExists = errors.New("email already exists")

	// ErrTokenNotFound is returned when a refresh token is not found
	ErrTokenNotFound = errors.New("refresh token not found")
)

// UserRepository defines the interface for user data access
// Interface này định nghĩa TẤT CẢ operations liên quan đến User trong database
// WHY Interface? → Dễ test, dễ thay đổi database implementation sau này
type UserRepository interface {
	// Create operations
	Create(ctx context.Context, user *domain.User) error

	// Read operations
	FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindAll(ctx context.Context, limit, offset int) ([]*domain.User, error)
	Count(ctx context.Context) (int64, error)

	// Update operations
	Update(ctx context.Context, user *domain.User) error
	UpdateLastLogin(ctx context.Context, userID uuid.UUID) error

	// Delete operations
	Delete(ctx context.Context, id uuid.UUID) error // Soft delete
	HardDelete(ctx context.Context, id uuid.UUID) error // Permanent delete

	// Verification operations
	MarkAsVerified(ctx context.Context, userID uuid.UUID) error

	// Query operations
	Exists(ctx context.Context, email string) (bool, error)
	IsActive(ctx context.Context, userID uuid.UUID) (bool, error)
}

// RefreshTokenRepository defines the interface for refresh token management
// Interface này quản lý refresh tokens (JWT refresh)
type RefreshTokenRepository interface {
	// Create a new refresh token
	Create(ctx context.Context, token *RefreshToken) error

	// Find refresh token by token string
	FindByToken(ctx context.Context, token string) (*RefreshToken, error)

	// Find all active tokens for a user
	FindByUserID(ctx context.Context, userID uuid.UUID) ([]*RefreshToken, error)

	// Revoke a refresh token
	Revoke(ctx context.Context, token string) error

	// Revoke all tokens for a user (logout from all devices)
	RevokeAllForUser(ctx context.Context, userID uuid.UUID) error

	// Delete expired tokens (cleanup job)
	DeleteExpired(ctx context.Context) error
}

// RefreshToken represents a refresh token in the database
// Entity cho refresh token (để user có thể refresh access token)
type RefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	Token     string    `gorm:"type:varchar(500);uniqueIndex;not null"`
	ExpiresAt int64     `gorm:"not null"` // Unix timestamp
	RevokedAt *int64    `gorm:"type:bigint"` // NULL nếu chưa revoke
	CreatedAt int64     `gorm:"autoCreateTime"`
}

// TableName specifies the table name
func (RefreshToken) TableName() string {
	return "refresh_tokens"
}

// IsExpired checks if the token has expired
func (rt *RefreshToken) IsExpired() bool {
	return rt.ExpiresAt < getCurrentTimestamp()
}

// IsRevoked checks if the token has been revoked
func (rt *RefreshToken) IsRevoked() bool {
	return rt.RevokedAt != nil
}

// IsValid checks if the token is valid (not expired and not revoked)
func (rt *RefreshToken) IsValid() bool {
	return !rt.IsExpired() && !rt.IsRevoked()
}

// getCurrentTimestamp returns current Unix timestamp
func getCurrentTimestamp() int64 {
	// time.Now().Unix() trả về số giây từ 1970-01-01
	// Sử dụng để so sánh với ExpiresAt
	return time.Now().Unix()
}
