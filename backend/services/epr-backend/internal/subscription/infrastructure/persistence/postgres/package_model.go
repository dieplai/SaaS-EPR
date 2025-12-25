package postgres

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PackageModel struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey"`
	Name         string         `gorm:"type:varchar(100);not null;uniqueIndex"`
	Description  string         `gorm:"type:text"`
	Price        float64        `gorm:"type:decimal(10,2);not null"`
	TokenLimit   int            `gorm:"not null"`
	DurationDays int            `gorm:"not null"`
	Features     FeatureArray   `gorm:"type:jsonb"`
	IsActive     bool           `gorm:"default:true"`
	CreatedAt    time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

func (PackageModel) TableName() string {
	return "packages"
}

type FeatureArray []string

func (f *FeatureArray) Scan(value interface{}) error {
	if value == nil {
		*f = make([]string, 0)
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		*f = make([]string, 0)
		return nil
	}
	return json.Unmarshal(bytes, f)
}

func (f FeatureArray) Value() (driver.Value, error) {
	if f == nil {
		return json.Marshal([]string{})
	}
	return json.Marshal(f)
}

type ModelArray []string

func (m *ModelArray) Scan(value interface{}) error {
	if value == nil {
		*m = make([]string, 0)
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		*m = make([]string, 0)
		return nil
	}
	return json.Unmarshal(bytes, m)
}

func (m ModelArray) Value() (driver.Value, error) {
	if m == nil {
		return json.Marshal([]string{})
	}
	return json.Marshal(m)
}
