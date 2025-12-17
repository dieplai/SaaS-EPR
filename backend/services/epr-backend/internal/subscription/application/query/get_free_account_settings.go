package query

import (
	"context"
	"fmt"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/system_settings"
)

type GetFreeAccountSettingsQuery struct{}

type FreeAccountSettingsDTO struct {
	TokenLimit int    `json:"token_limit"`
	UpdatedAt  string `json:"updated_at,omitempty"`
}

type GetFreeAccountSettingsHandler struct {
	settingsRepo system_settings.Repository
}

func NewGetFreeAccountSettingsHandler(settingsRepo system_settings.Repository) *GetFreeAccountSettingsHandler {
	return &GetFreeAccountSettingsHandler{
		settingsRepo: settingsRepo,
	}
}

func (h *GetFreeAccountSettingsHandler) Handle(ctx context.Context, query GetFreeAccountSettingsQuery) (*FreeAccountSettingsDTO, error) {
	// Get free account token limit setting
	tokenLimitSetting, err := h.settingsRepo.FindByKey(ctx, "free_account_token_limit")
	if err != nil {
		return nil, fmt.Errorf("failed to get free account token limit: %w", err)
	}

	tokenLimit, err := tokenLimitSetting.GetIntValue()
	if err != nil {
		return nil, fmt.Errorf("invalid free account token limit value: %w", err)
	}

	return &FreeAccountSettingsDTO{
		TokenLimit: tokenLimit,
		UpdatedAt:  tokenLimitSetting.GetUpdatedAt().Format("2006-01-02 15:04:05"),
	}, nil
}
