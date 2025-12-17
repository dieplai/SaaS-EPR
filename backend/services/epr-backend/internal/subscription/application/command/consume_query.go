package command

import (
	"context"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/google/uuid"
)

type ConsumeQueryCommand struct {
	UserID uuid.UUID
}

type ConsumeQueryHandler struct {
	repo subscription.Repository
}

func NewConsumeQueryHandler(repo subscription.Repository) *ConsumeQueryHandler {
	return &ConsumeQueryHandler{repo: repo}
}

func (h *ConsumeQueryHandler) Handle(ctx context.Context, cmd ConsumeQueryCommand) error {
	sub, err := h.repo.FindActiveByUserID(ctx, cmd.UserID)
	if err != nil {
		return err
	}

	if sub == nil {
		return ErrNoActiveSubscription
	}

	sub.CheckAndUpdateStatus()

	if err := sub.ConsumeQuery(); err != nil {
		return err
	}

	return h.repo.Save(ctx, sub)
}

var ErrNoActiveSubscription = &NoActiveSubscriptionError{}

type NoActiveSubscriptionError struct{}

func (e *NoActiveSubscriptionError) Error() string {
	return "no active subscription found"
}
