package payment

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Save(ctx context.Context, payment *Payment) error
	FindByID(ctx context.Context, id uuid.UUID) (*Payment, error)
	FindByOrderCode(ctx context.Context, orderCode string) (*Payment, error)
	FindBySepayTransactionID(ctx context.Context, transactionID int64) (*Payment, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) ([]*Payment, error)
}
