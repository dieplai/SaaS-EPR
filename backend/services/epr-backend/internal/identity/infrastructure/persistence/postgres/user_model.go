package postgres

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserModel struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey"`
	Email           string         `gorm:"uniqueIndex;not null"`
	PasswordHash    string         `gorm:"not null"`
	FullName        string         `gorm:"not null"`
	Phone           string         `gorm:""`
	CompanyName     string         `gorm:""`
	AvatarURL       string         `gorm:""`
	Role            string         `gorm:"type:varchar(20);not null;default:'user'"`
	IsActive        bool           `gorm:"default:true"`
	IsVerified      bool           `gorm:"default:false"`
	LastLoginAt     *time.Time     `gorm:"type:timestamp"`
	EmailVerifiedAt *time.Time     `gorm:"type:timestamp"`
	CreatedAt       time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt       time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	DeletedAt       gorm.DeletedAt `gorm:"index"`
}

func (UserModel) TableName() string {
	return "users"
}
