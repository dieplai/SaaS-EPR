package postgres

import (
	"time"

	"github.com/google/uuid"
)

type SystemSettingModel struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SettingKey   string     `gorm:"type:varchar(100);uniqueIndex;not null"`
	SettingValue string     `gorm:"type:text;not null"`
	Description  string     `gorm:"type:text"`
	ValueType    string     `gorm:"type:varchar(20);not null;default:'string'"`
	UpdatedBy    *uuid.UUID `gorm:"type:uuid"`
	CreatedAt    time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
}

func (SystemSettingModel) TableName() string {
	return "system_settings"
}
