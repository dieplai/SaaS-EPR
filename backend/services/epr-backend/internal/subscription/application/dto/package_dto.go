package dto

import (
	"time"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/google/uuid"
)

type PackageDTO struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Price        float64   `json:"price"`
	TokenLimit   int       `json:"token_limit"`
	DurationDays int       `json:"duration_days"`
	Features     []string  `json:"features"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreatePackageRequest struct {
	Name         string   `json:"name" binding:"required"`
	Description  string   `json:"description"`
	Price        float64  `json:"price" binding:"required,gte=0"`
	TokenLimit   int      `json:"token_limit" binding:"required,gt=0"`
	DurationDays int      `json:"duration_days" binding:"required,gt=0"`
	Features     []string `json:"features"`
}

type UpdatePackageRequest struct {
	Name         *string   `json:"name"`
	Description  *string   `json:"description"`
	Price        *float64  `json:"price" binding:"omitempty,gte=0"`
	TokenLimit   *int      `json:"token_limit" binding:"omitempty,gt=0"`
	DurationDays *int      `json:"duration_days" binding:"omitempty,gt=0"`
	Features     []string  `json:"features"`
	IsActive     *bool     `json:"is_active"`
}

func PackageToDTO(pkg *packagedomain.Package) *PackageDTO {
	return &PackageDTO{
		ID:           pkg.ID,
		Name:         pkg.GetName(),
		Description:  pkg.GetDescription(),
		Price:        pkg.GetPrice().Amount(),
		TokenLimit:   pkg.GetTokenLimit().Value(),
		DurationDays: pkg.GetDuration().Days(),
		Features:     pkg.GetFeatures(),
		IsActive:     pkg.IsActive(),
		CreatedAt:    pkg.CreatedAt,
		UpdatedAt:    pkg.UpdatedAt,
	}
}
