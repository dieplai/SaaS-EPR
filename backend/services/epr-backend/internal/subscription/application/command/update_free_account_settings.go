package command

import (
	"context"
	"fmt"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/system_settings"
	"github.com/google/uuid"
)

type UpdateFreeAccountSettingsCommand struct {
	TokenLimit int
	UpdatedBy  uuid.UUID
}

type UpdateFreeAccountSettingsHandler struct {
	settingsRepo     system_settings.Repository
	subscriptionRepo subscription.Repository
}

func NewUpdateFreeAccountSettingsHandler(
	settingsRepo system_settings.Repository,
	subscriptionRepo subscription.Repository,
) *UpdateFreeAccountSettingsHandler {
	return &UpdateFreeAccountSettingsHandler{
		settingsRepo:     settingsRepo,
		subscriptionRepo: subscriptionRepo,
	}
}

func (h *UpdateFreeAccountSettingsHandler) Handle(ctx context.Context, cmd UpdateFreeAccountSettingsCommand) error {
	// Validate token limit
	if cmd.TokenLimit < 100 || cmd.TokenLimit > 100000 {
		return fmt.Errorf("token limit must be between 100 and 100000")
	}

	// Update free account token limit setting
	tokenLimitSetting, err := h.settingsRepo.FindByKey(ctx, "free_account_token_limit")
	if err != nil {
		return fmt.Errorf("failed to get free account token limit setting: %w", err)
	}

	tokenLimitSetting.UpdateValue(fmt.Sprintf("%d", cmd.TokenLimit), &cmd.UpdatedBy)

	if err := h.settingsRepo.Save(ctx, tokenLimitSetting); err != nil {
		return fmt.Errorf("failed to save free account token limit: %w", err)
	}

	// Update all existing active free accounts with new token limit
	freeAccounts, err := h.subscriptionRepo.FindActiveFreeAccounts(ctx)
	if err != nil {
		return fmt.Errorf("failed to find active free accounts: %w", err)
	}

	// Update total_tokens for each free account
	for _, sub := range freeAccounts {
		sub.UpdateTotalTokens(cmd.TokenLimit)
		if err := h.subscriptionRepo.Save(ctx, sub); err != nil {
			return fmt.Errorf("failed to update free account subscription %s: %w", sub.ID, err)
		}
	}

	return nil
}
