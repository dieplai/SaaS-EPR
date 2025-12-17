package packagedomain

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Save(ctx context.Context, pkg *Package) error
	FindByID(ctx context.Context, id uuid.UUID) (*Package, error)
	FindByName(ctx context.Context, name string) (*Package, error)
	FindByPrice(ctx context.Context, price float64) (*Package, error)
	FindAll(ctx context.Context, limit, offset int) ([]*Package, error)
	FindActive(ctx context.Context) ([]*Package, error)
	Delete(ctx context.Context, id uuid.UUID) error
	Count(ctx context.Context) (int64, error)
}
