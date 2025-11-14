package domain

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user in the system
// Đây là Entity chính - đại diện cho 1 user trong database
type User struct {
	// Primary key
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`

	// Credentials
	Email        string `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string `gorm:"type:varchar(255);not null" json:"-"` // "-" means không trả về trong JSON response

	// Profile info
	FullName    string  `gorm:"type:varchar(255)" json:"full_name,omitempty"`
	Phone       *string `gorm:"type:varchar(20)" json:"phone,omitempty"`       // Pointer = nullable
	CompanyName *string `gorm:"type:varchar(255)" json:"company_name,omitempty"`
	AvatarURL   *string `gorm:"type:text" json:"avatar_url,omitempty"`

	// Status flags
	IsActive   bool `gorm:"default:true" json:"is_active"`
	IsVerified bool `gorm:"default:false" json:"is_verified"`

	// Timestamps
	EmailVerifiedAt *time.Time     `gorm:"type:timestamp" json:"email_verified_at,omitempty"`
	LastLoginAt     *time.Time     `gorm:"type:timestamp" json:"last_login_at,omitempty"`
	CreatedAt       time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt       time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"` // Soft delete
}

// TableName specifies the table name for GORM
// Override tên table (mặc định GORM sẽ dùng "users")
func (User) TableName() string {
	return "users"
}

// BeforeCreate is a GORM hook that runs before inserting a new user
// Hook này chạy TRƯỚC KHI insert vào database
func (u *User) BeforeCreate(tx *gorm.DB) error {
	// Generate UUID if not set
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// SetPassword hashes and sets the user's password
// Method để hash password trước khi lưu
func (u *User) SetPassword(password string) error {
	// bcrypt.DefaultCost = 10 (cân bằng giữa security và performance)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	u.PasswordHash = string(hashedPassword)
	return nil
}

// CheckPassword verifies if the provided password matches the stored hash
// Method để verify password khi user login
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// IsAccountActive checks if the user account is active and verified
func (u *User) IsAccountActive() bool {
	return u.IsActive && !u.IsDeleted()
}

// IsDeleted checks if the user is soft-deleted
func (u *User) IsDeleted() bool {
	return u.DeletedAt.Valid
}

// UpdateLastLogin updates the last login timestamp
// Cập nhật thời gian login cuối
func (u *User) UpdateLastLogin() {
	now := time.Now()
	u.LastLoginAt = &now
}

// ToPublicUser returns a sanitized user object without sensitive fields
// Trả về user object không có password hash (để response API)
func (u *User) ToPublicUser() *PublicUser {
	return &PublicUser{
		ID:              u.ID,
		Email:           u.Email,
		FullName:        u.FullName,
		Phone:           u.Phone,
		CompanyName:     u.CompanyName,
		AvatarURL:       u.AvatarURL,
		IsActive:        u.IsActive,
		IsVerified:      u.IsVerified,
		EmailVerifiedAt: u.EmailVerifiedAt,
		LastLoginAt:     u.LastLoginAt,
		CreatedAt:       u.CreatedAt,
		UpdatedAt:       u.UpdatedAt,
	}
}

// PublicUser is a user representation without sensitive data
// Struct này để trả về cho client (không có PasswordHash)
type PublicUser struct {
	ID              uuid.UUID  `json:"id"`
	Email           string     `json:"email"`
	FullName        string     `json:"full_name,omitempty"`
	Phone           *string    `json:"phone,omitempty"`
	CompanyName     *string    `json:"company_name,omitempty"`
	AvatarURL       *string    `json:"avatar_url,omitempty"`
	IsActive        bool       `json:"is_active"`
	IsVerified      bool       `json:"is_verified"`
	EmailVerifiedAt *time.Time `json:"email_verified_at,omitempty"`
	LastLoginAt     *time.Time `json:"last_login_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// CreateUserInput represents the data needed to create a new user
// Struct này dùng khi Register (input từ client)
type CreateUserInput struct {
	Email       string  `json:"email" binding:"required,email"`
	Password    string  `json:"password" binding:"required,min=8"`
	FullName    string  `json:"full_name" binding:"required"`
	Phone       *string `json:"phone"`
	CompanyName *string `json:"company_name"`
}

// LoginInput represents login credentials
// Struct này dùng khi Login
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// UpdateUserInput represents data that can be updated
// Struct này dùng khi Update profile
type UpdateUserInput struct {
	FullName    *string `json:"full_name"`
	Phone       *string `json:"phone"`
	CompanyName *string `json:"company_name"`
	AvatarURL   *string `json:"avatar_url"`
}

// AuthResponse represents the response after successful authentication
// Response trả về sau khi login thành công
type AuthResponse struct {
	User         *PublicUser `json:"user"`
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	ExpiresIn    int64       `json:"expires_in"` // seconds
}
