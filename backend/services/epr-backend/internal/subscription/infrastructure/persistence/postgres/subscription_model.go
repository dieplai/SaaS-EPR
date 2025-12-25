package postgres

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubscriptionModel struct {
	ID                 uuid.UUID      `gorm:"type:uuid;primaryKey"`
	UserID             uuid.UUID      `gorm:"type:uuid;not null;index"`
	PackageID          *uuid.UUID     `gorm:"type:uuid;index"` // Nullable for FREE accounts
	StartDate          time.Time      `gorm:"type:timestamp;not null"`
	EndDate            time.Time      `gorm:"type:timestamp;not null"`
	Status             string         `gorm:"type:varchar(20);not null;index"`
	RemainingTokens    int            `gorm:"not null"`
	TotalTokens        int            `gorm:"not null;default:0"`
	CurrentPeriodStart time.Time      `gorm:"type:timestamp;not null;default:CURRENT_TIMESTAMP"`
	CurrentPeriodEnd   time.Time      `gorm:"type:timestamp;not null;default:CURRENT_TIMESTAMP"`
	AutoRenew          bool           `gorm:"not null;default:true"`
	LastTokenResetAt   *time.Time     `gorm:"type:timestamp"`
	NextTokenResetAt   *time.Time     `gorm:"type:timestamp;index:idx_subscriptions_next_reset"`
	CreatedAt          time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt          time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	DeletedAt          gorm.DeletedAt `gorm:"index"`
}

func (SubscriptionModel) TableName() string {
	return "subscriptions"
}
