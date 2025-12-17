package command

import (
	"context"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/google/uuid"
)

type ConsumeTokensCommand struct {
	UserID     uuid.UUID
	TokenCount int
}

type ConsumeTokensHandler struct {
	subscriptionRepo subscription.Repository
	packageRepo      packagedomain.Repository
}

func NewConsumeTokensHandler(
	subscriptionRepo subscription.Repository,
	packageRepo packagedomain.Repository,
) *ConsumeTokensHandler {
	return &ConsumeTokensHandler{
		subscriptionRepo: subscriptionRepo,
		packageRepo:      packageRepo,
	}
}

func (h *ConsumeTokensHandler) Handle(ctx context.Context, cmd ConsumeTokensCommand) error {
	// Find active subscription for user
	sub, err := h.subscriptionRepo.FindActiveByUserID(ctx, cmd.UserID)
	if err != nil {
		return err
	}

	if sub == nil {
		return ErrNoActiveSubscription
	}

	// Check if subscription needs renewal (billing period ended)
	if sub.NeedsRenewal() {
		// Get package details for duration
		pkg, err := h.packageRepo.FindByID(ctx, sub.GetPackageID())
		if err != nil {
			return err
		}

		// Renew subscription period and refill tokens
		if err := sub.RenewPeriod(pkg.GetDuration().Days()); err != nil {
			return err
		}

		// Note: Save will happen after consuming tokens
	}

	// Check and update subscription status (in case it expired without renewal)
	sub.CheckAndUpdateStatus()

	// Consume tokens from subscription
	if err := sub.ConsumeTokens(cmd.TokenCount); err != nil {
		return err
	}

	// Save updated subscription (includes renewal + consumption)
	return h.subscriptionRepo.Save(ctx, sub)
}
