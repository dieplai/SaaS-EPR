package command

import (
	"context"
	"fmt"
	"strconv"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/system_settings"
	"github.com/google/uuid"
)

type UpdateTokenResetSettingsCommand struct {
	Enabled    bool
	CycleDays  int
	UpdatedBy  uuid.UUID
}

type UpdateTokenResetSettingsHandler struct {
	settingsRepo     system_settings.Repository
	subscriptionRepo subscription.Repository
}

func NewUpdateTokenResetSettingsHandler(
	settingsRepo system_settings.Repository,
	subscriptionRepo subscription.Repository,
) *UpdateTokenResetSettingsHandler {
	return &UpdateTokenResetSettingsHandler{
		settingsRepo:     settingsRepo,
		subscriptionRepo: subscriptionRepo,
	}
}

func (h *UpdateTokenResetSettingsHandler) Handle(ctx context.Context, cmd UpdateTokenResetSettingsCommand) error {
	// Validate cycle days
	if cmd.CycleDays < 1 || cmd.CycleDays > 365 {
		return fmt.Errorf("cycle_days must be between 1 and 365")
	}

	// Update enabled setting
	enabledSetting, err := h.settingsRepo.FindByKey(ctx, "token_reset_enabled")
	if err != nil {
		return fmt.Errorf("failed to get token_reset_enabled setting: %w", err)
	}

	if err := enabledSetting.UpdateValue(strconv.FormatBool(cmd.Enabled), &cmd.UpdatedBy); err != nil {
		return fmt.Errorf("failed to update enabled setting: %w", err)
	}

	if err := h.settingsRepo.Save(ctx, enabledSetting); err != nil {
		return fmt.Errorf("failed to save enabled setting: %w", err)
	}

	// Update cycle days setting
	cycleSetting, err := h.settingsRepo.FindByKey(ctx, "token_reset_cycle_days")
	if err != nil {
		return fmt.Errorf("failed to get token_reset_cycle_days setting: %w", err)
	}

	if err := cycleSetting.UpdateValue(strconv.Itoa(cmd.CycleDays), &cmd.UpdatedBy); err != nil {
		return fmt.Errorf("failed to update cycle_days setting: %w", err)
	}

	if err := h.settingsRepo.Save(ctx, cycleSetting); err != nil {
		return fmt.Errorf("failed to save cycle_days setting: %w", err)
	}

	// Update next_token_reset_at for all active subscriptions with new cycle
	subscriptions, err := h.subscriptionRepo.FindExpired(ctx) // Reuse to get all active
	if err != nil {
		return fmt.Errorf("failed to get subscriptions: %w", err)
	}

	// Update next reset time for all active subscriptions
	for _, sub := range subscriptions {
		if sub.IsActive() && !sub.IsExpired() {
			sub.SetNextTokenResetAt(cmd.CycleDays)
			if err := h.subscriptionRepo.Save(ctx, sub); err != nil {
				// Log error but continue
				fmt.Printf("Warning: failed to update subscription %s: %v\n", sub.ID, err)
			}
		}
	}

	return nil
}
