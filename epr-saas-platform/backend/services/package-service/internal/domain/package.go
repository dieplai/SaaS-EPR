package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Package represents a subscription package (e.g., Basic, Pro, Enterprise)
// Entity này đại diện cho 1 gói đăng ký mà user có thể mua
type Package struct {
	// Primary key
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`

	// Package details
	Name        string  `gorm:"type:varchar(100);not null;uniqueIndex" json:"name"`
	Description string  `gorm:"type:text" json:"description,omitempty"`
	Price       float64 `gorm:"type:decimal(10,2);not null" json:"price"`

	// Limits
	QueryLimit   int `gorm:"not null" json:"query_limit"`   // Số queries/tháng
	DurationDays int `gorm:"not null" json:"duration_days"` // Số ngày sử dụng (30, 90, 365)

	// Features (JSON array)
	Features string `gorm:"type:jsonb" json:"features,omitempty"`

	// Status
	IsActive bool `gorm:"default:true" json:"is_active"`

	// Timestamps
	CreatedAt time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"` // Soft delete
}

// TableName specifies the table name
func (Package) TableName() string {
	return "packages"
}

// BeforeCreate is a GORM hook
func (p *Package) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// IsDeleted checks if the package is soft-deleted
func (p *Package) IsDeleted() bool {
	return p.DeletedAt.Valid
}

// ============================================
// INPUT/OUTPUT STRUCTS
// ============================================

// CreatePackageInput represents the data needed to create a package
type CreatePackageInput struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description"`
	Price        float64 `json:"price" binding:"required,gte=0"`
	QueryLimit   int     `json:"query_limit" binding:"required,gt=0"`
	DurationDays int     `json:"duration_days" binding:"required,gt=0"`
	Features     string  `json:"features"`
}

// UpdatePackageInput represents data that can be updated
type UpdatePackageInput struct {
	Name         *string  `json:"name"`
	Description  *string  `json:"description"`
	Price        *float64 `json:"price" binding:"omitempty,gte=0"`
	QueryLimit   *int     `json:"query_limit" binding:"omitempty,gt=0"`
	DurationDays *int     `json:"duration_days" binding:"omitempty,gt=0"`
	Features     *string  `json:"features"`
	IsActive     *bool    `json:"is_active"`
}

// PackageResponse is the public representation of a package
type PackageResponse struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description,omitempty"`
	Price        float64   `json:"price"`
	QueryLimit   int       `json:"query_limit"`
	DurationDays int       `json:"duration_days"`
	Features     string    `json:"features,omitempty"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ToResponse converts Package to PackageResponse
func (p *Package) ToResponse() *PackageResponse {
	return &PackageResponse{
		ID:           p.ID,
		Name:         p.Name,
		Description:  p.Description,
		Price:        p.Price,
		QueryLimit:   p.QueryLimit,
		DurationDays: p.DurationDays,
		Features:     p.Features,
		IsActive:     p.IsActive,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}
}
