package command

import (
	"context"
	"fmt"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/system_settings"
	"github.com/google/uuid"
)

type UpdateFreeAccountSettingsCommand struct {
	TokenLimit int
	UpdatedBy  uuid.UUID
}

type UpdateFreeAccountSettingsHandler struct {
	settingsRepo system_settings.Repository
}

func NewUpdateFreeAccountSettingsHandler(settingsRepo system_settings.Repository) *UpdateFreeAccountSettingsHandler {
	return &UpdateFreeAccountSettingsHandler{
		settingsRepo: settingsRepo,
	}
}

func (h *UpdateFreeAccountSettingsHandler) Handle(ctx context.Context, cmd UpdateFreeAccountSettingsCommand) error {
	// Validate token limit
	if cmd.TokenLimit < 100 || cmd.TokenLimit > 100000 {
		return fmt.Errorf("token limit must be between 100 and 100000")
	}

	// Update free account token limit
	tokenLimitSetting, err := h.settingsRepo.FindByKey(ctx, "free_account_token_limit")
	if err != nil {
		return fmt.Errorf("failed to get free account token limit setting: %w", err)
	}

	tokenLimitSetting.UpdateValue(fmt.Sprintf("%d", cmd.TokenLimit), &cmd.UpdatedBy)

	if err := h.settingsRepo.Save(ctx, tokenLimitSetting); err != nil {
		return fmt.Errorf("failed to save free account token limit: %w", err)
	}

	return nil
}
