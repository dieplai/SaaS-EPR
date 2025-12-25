package command

import (
	"context"
	"fmt"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/system_settings"
	"github.com/google/uuid"
)

type CreateSubscriptionCommand struct {
	UserID    uuid.UUID
	PackageID *uuid.UUID // Pointer to support nil (FREE accounts without package)
}

type CreateSubscriptionHandler struct {
	subscriptionRepo subscription.Repository
	packageRepo      packagedomain.Repository
	settingsRepo     system_settings.Repository
}

func NewCreateSubscriptionHandler(
	subscriptionRepo subscription.Repository,
	packageRepo packagedomain.Repository,
	settingsRepo system_settings.Repository,
) *CreateSubscriptionHandler {
	return &CreateSubscriptionHandler{
		subscriptionRepo: subscriptionRepo,
		packageRepo:      packageRepo,
		settingsRepo:     settingsRepo,
	}
}

func (h *CreateSubscriptionHandler) Handle(ctx context.Context, cmd CreateSubscriptionCommand) (uuid.UUID, error) {
	existingSub, err := h.subscriptionRepo.FindActiveByUserID(ctx, cmd.UserID)
	if err == nil && existingSub != nil {
		if existingSub.IsActive() {
			return uuid.Nil, ErrActiveSubscriptionExists
		}
	}

	var tokenLimit int
	var durationDays int

	// Handle FREE account (no package) vs PAID package
	if cmd.PackageID == nil {
		// FREE ACCOUNT - Use token limit from system settings
		freeAccountSetting, err := h.settingsRepo.FindByKey(ctx, "free_account_token_limit")
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to get free account token limit: %w", err)
		}
		tokenLimit, err = freeAccountSetting.GetIntValue()
		if err != nil {
			return uuid.Nil, fmt.Errorf("invalid free_account_token_limit setting: %w", err)
		}
		durationDays = 365 // Free accounts never expire (1 year)
	} else {
		// PAID PACKAGE - Get limits from package
		pkg, err := h.packageRepo.FindByID(ctx, *cmd.PackageID)
		if err != nil {
			return uuid.Nil, fmt.Errorf("package not found: %w", err)
		}

		if !pkg.IsActive() {
			return uuid.Nil, ErrPackageNotActive
		}

		tokenLimit = pkg.GetTokenLimit().Value()
		durationDays = pkg.GetDuration().Days()
	}

	sub, err := subscription.NewSubscription(
		cmd.UserID,
		cmd.PackageID,
		durationDays,
		tokenLimit,
	)
	if err != nil {
		return uuid.Nil, err
	}

	// Set next token reset time based on system settings
	cycleSetting, err := h.settingsRepo.FindByKey(ctx, "token_reset_cycle_days")
	if err != nil {
		// If settings not found, use default 7 days
		sub.SetNextTokenResetAt(7)
	} else {
		resetCycleDays, err := cycleSetting.GetIntValue()
		if err != nil {
			return uuid.Nil, fmt.Errorf("invalid token_reset_cycle_days setting: %w", err)
		}
		sub.SetNextTokenResetAt(resetCycleDays)
	}

	if err := h.subscriptionRepo.Save(ctx, sub); err != nil {
		return uuid.Nil, err
	}

	return sub.ID, nil
}

var ErrActiveSubscriptionExists = &ActiveSubscriptionExistsError{}
var ErrPackageNotActive = &PackageNotActiveError{}

type ActiveSubscriptionExistsError struct{}

func (e *ActiveSubscriptionExistsError) Error() string {
	return "user already has an active subscription"
}

type PackageNotActiveError struct{}

func (e *PackageNotActiveError) Error() string {
	return "package is not active"
}
