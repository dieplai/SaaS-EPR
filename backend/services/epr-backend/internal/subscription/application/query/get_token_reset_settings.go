package query

import (
	"context"
	"fmt"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/system_settings"
)

type GetTokenResetSettingsQuery struct{}

type TokenResetSettingsDTO struct {
	Enabled    bool `json:"enabled"`
	CycleDays  int  `json:"cycle_days"`
	UpdatedAt  string `json:"updated_at,omitempty"`
}

type GetTokenResetSettingsHandler struct {
	settingsRepo system_settings.Repository
}

func NewGetTokenResetSettingsHandler(settingsRepo system_settings.Repository) *GetTokenResetSettingsHandler {
	return &GetTokenResetSettingsHandler{
		settingsRepo: settingsRepo,
	}
}

func (h *GetTokenResetSettingsHandler) Handle(ctx context.Context, query GetTokenResetSettingsQuery) (*TokenResetSettingsDTO, error) {
	// Get enabled setting
	enabledSetting, err := h.settingsRepo.FindByKey(ctx, "token_reset_enabled")
	if err != nil {
		return nil, fmt.Errorf("failed to get token_reset_enabled setting: %w", err)
	}

	enabled, err := enabledSetting.GetBoolValue()
	if err != nil {
		return nil, fmt.Errorf("invalid token_reset_enabled value: %w", err)
	}

	// Get cycle days setting
	cycleSetting, err := h.settingsRepo.FindByKey(ctx, "token_reset_cycle_days")
	if err != nil {
		return nil, fmt.Errorf("failed to get token_reset_cycle_days setting: %w", err)
	}

	cycleDays, err := cycleSetting.GetIntValue()
	if err != nil {
		return nil, fmt.Errorf("invalid token_reset_cycle_days value: %w", err)
	}

	return &TokenResetSettingsDTO{
		Enabled:   enabled,
		CycleDays: cycleDays,
		UpdatedAt: enabledSetting.UpdatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}
