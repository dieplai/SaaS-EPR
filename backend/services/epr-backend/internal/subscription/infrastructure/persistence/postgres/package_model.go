package postgres

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PackageModel struct {
	ID                    uuid.UUID      `gorm:"type:uuid;primaryKey"`
	Name                  string         `gorm:"type:varchar(50);not null;uniqueIndex"`
	DisplayName           string         `gorm:"type:varchar(100);not null"`
	Description           string         `gorm:"type:text"`
	Price                 float64        `gorm:"type:decimal(10,2);not null"`
	Currency              string         `gorm:"type:varchar(3);default:USD"`
	BillingPeriod         string         `gorm:"type:varchar(20);default:monthly"`
	QueryLimitDaily       int            `gorm:"not null"`
	QueryLimitMonthly     *int           `gorm:"type:integer"`
	AllowedModels         ModelArray     `gorm:"type:jsonb"`
	Features              FeatureArray   `gorm:"type:jsonb"`
	ApiAccess             bool           `gorm:"default:false"`
	PrioritySupport       bool           `gorm:"default:false"`
	MaxConversationHistory int           `gorm:"default:20"`
	IsActive              bool           `gorm:"default:true"`
	IsFeatured            bool           `gorm:"default:false"`
	SortOrder             int            `gorm:"default:0"`
	CreatedAt             time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt             time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
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
