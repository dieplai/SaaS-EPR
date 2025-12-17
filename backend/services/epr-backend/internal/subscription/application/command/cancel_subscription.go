package command

import (
	"context"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/google/uuid"
)

type CancelSubscriptionCommand struct {
	SubscriptionID uuid.UUID
	UserID         uuid.UUID
}

type CancelSubscriptionHandler struct {
	repo subscription.Repository
}

func NewCancelSubscriptionHandler(repo subscription.Repository) *CancelSubscriptionHandler {
	return &CancelSubscriptionHandler{repo: repo}
}

func (h *CancelSubscriptionHandler) Handle(ctx context.Context, cmd CancelSubscriptionCommand) error {
	sub, err := h.repo.FindByID(ctx, cmd.SubscriptionID)
	if err != nil {
		return err
	}

	if sub.GetUserID() != cmd.UserID {
		return ErrUnauthorized
	}

	if err := sub.Cancel(); err != nil {
		return err
	}

	return h.repo.Save(ctx, sub)
}

var ErrUnauthorized = &UnauthorizedError{}

type UnauthorizedError struct{}

func (e *UnauthorizedError) Error() string {
	return "unauthorized to cancel this subscription"
}
