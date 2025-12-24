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
	PackageID uuid.UUID
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

	pkg, err := h.packageRepo.FindByID(ctx, cmd.PackageID)
	if err != nil {
		return uuid.Nil, err
	}

	// Only check IsActive for paid packages (Free package is always allowed)
	isFreePackage := pkg.GetPrice().Amount() == 0
	if !isFreePackage && !pkg.IsActive() {
		return uuid.Nil, ErrPackageNotActive
	}

	// For free packages, use token limit from system settings
	tokenLimit := pkg.GetTokenLimit().Value()
	if isFreePackage {
		freeAccountSetting, err := h.settingsRepo.FindByKey(ctx, "free_account_token_limit")
		if err == nil {
			settingTokenLimit, err := freeAccountSetting.GetIntValue()
			if err == nil {
				tokenLimit = settingTokenLimit
			}
		}
	}

	sub, err := subscription.NewSubscription(
		cmd.UserID,
		cmd.PackageID,
		pkg.GetDuration().Days(),
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
