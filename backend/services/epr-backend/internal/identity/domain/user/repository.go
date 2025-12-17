package user

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Save(ctx context.Context, user *User) error
	FindByID(ctx context.Context, id uuid.UUID) (*User, error)
	FindByEmail(ctx context.Context, email Email) (*User, error)
	Exists(ctx context.Context, email Email) (bool, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, offset, limit int) ([]*User, error)
	Count(ctx context.Context) (int64, error)
}
