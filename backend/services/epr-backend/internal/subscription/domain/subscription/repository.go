package subscription

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Save(ctx context.Context, sub *Subscription) error
	FindByID(ctx context.Context, id uuid.UUID) (*Subscription, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) ([]*Subscription, error)
	FindActiveByUserID(ctx context.Context, userID uuid.UUID) (*Subscription, error)
	FindExpired(ctx context.Context) ([]*Subscription, error)
	FindDueForTokenReset(ctx context.Context) ([]*Subscription, error)
	Delete(ctx context.Context, id uuid.UUID) error
	Count(ctx context.Context) (int64, error)
}
