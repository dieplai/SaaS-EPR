package command

import (
	"context"
	"fmt"
	"log"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/system_settings"
)

type ProcessTokenResetsCommand struct{}

type ProcessTokenResetsHandler struct {
	subscriptionRepo subscription.Repository
	settingsRepo     system_settings.Repository
}

func NewProcessTokenResetsHandler(
	subscriptionRepo subscription.Repository,
	settingsRepo system_settings.Repository,
) *ProcessTokenResetsHandler {
	return &ProcessTokenResetsHandler{
		subscriptionRepo: subscriptionRepo,
		settingsRepo:     settingsRepo,
	}
}

func (h *ProcessTokenResetsHandler) Handle(ctx context.Context, cmd ProcessTokenResetsCommand) error {
	// Check if token reset is enabled
	enabledSetting, err := h.settingsRepo.FindByKey(ctx, "token_reset_enabled")
	if err != nil {
		return fmt.Errorf("failed to get token_reset_enabled setting: %w", err)
	}

	enabled, err := enabledSetting.GetBoolValue()
	if err != nil {
		return fmt.Errorf("invalid token_reset_enabled value: %w", err)
	}

	if !enabled {
		log.Println("[Token Reset] Token reset is disabled, skipping")
		return nil
	}

	// Get reset cycle setting
	cycleSetting, err := h.settingsRepo.FindByKey(ctx, "token_reset_cycle_days")
	if err != nil {
		return fmt.Errorf("failed to get reset cycle setting: %w", err)
	}

	resetCycleDays, err := cycleSetting.GetIntValue()
	if err != nil {
		return fmt.Errorf("invalid reset cycle value: %w", err)
	}

	// Find all subscriptions due for reset
	subscriptions, err := h.subscriptionRepo.FindDueForTokenReset(ctx)
	if err != nil {
		return fmt.Errorf("failed to find subscriptions due for reset: %w", err)
	}

	log.Printf("[Token Reset] Found %d subscriptions due for token reset\n", len(subscriptions))

	// Reset tokens for each subscription
	successCount := 0
	errorCount := 0

	for _, sub := range subscriptions {
		if err := sub.ResetTokens(resetCycleDays); err != nil {
			log.Printf("[Token Reset] Failed to reset tokens for subscription %s: %v\n", sub.ID, err)
			errorCount++
			continue
		}

		if err := h.subscriptionRepo.Save(ctx, sub); err != nil {
			log.Printf("[Token Reset] Failed to save subscription %s after reset: %v\n", sub.ID, err)
			errorCount++
			continue
		}

		log.Printf("[Token Reset] Successfully reset tokens for subscription %s (user: %s)\n",
			sub.ID, sub.GetUserID())
		successCount++
	}

	log.Printf("[Token Reset] Completed: %d successful, %d errors\n", successCount, errorCount)

	if errorCount > 0 {
		return fmt.Errorf("token reset completed with %d errors", errorCount)
	}

	return nil
}
