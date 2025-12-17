package command

import (
	"context"
	"fmt"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/system_settings"
	"github.com/google/uuid"
)

type ResetSubscriptionTokensCommand struct {
	SubscriptionID uuid.UUID
}

type ResetSubscriptionTokensHandler struct {
	subscriptionRepo subscription.Repository
	settingsRepo     system_settings.Repository
}

func NewResetSubscriptionTokensHandler(
	subscriptionRepo subscription.Repository,
	settingsRepo system_settings.Repository,
) *ResetSubscriptionTokensHandler {
	return &ResetSubscriptionTokensHandler{
		subscriptionRepo: subscriptionRepo,
		settingsRepo:     settingsRepo,
	}
}

func (h *ResetSubscriptionTokensHandler) Handle(ctx context.Context, cmd ResetSubscriptionTokensCommand) error {
	// Get reset cycle setting
	cycleSetting, err := h.settingsRepo.FindByKey(ctx, "token_reset_cycle_days")
	if err != nil {
		return fmt.Errorf("failed to get reset cycle setting: %w", err)
	}

	resetCycleDays, err := cycleSetting.GetIntValue()
	if err != nil {
		return fmt.Errorf("invalid reset cycle value: %w", err)
	}

	// Find subscription
	sub, err := h.subscriptionRepo.FindByID(ctx, cmd.SubscriptionID)
	if err != nil {
		return fmt.Errorf("failed to find subscription: %w", err)
	}

	// Reset tokens
	if err := sub.ResetTokens(resetCycleDays); err != nil {
		return fmt.Errorf("failed to reset tokens: %w", err)
	}

	// Save updated subscription
	if err := h.subscriptionRepo.Save(ctx, sub); err != nil {
		return fmt.Errorf("failed to save subscription: %w", err)
	}

	return nil
}
