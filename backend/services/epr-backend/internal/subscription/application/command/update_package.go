package command

import (
	"context"
	"fmt"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/google/uuid"
)

type UpdatePackageCommand struct {
	ID           uuid.UUID
	Name         *string
	Description  *string
	Price        *float64
	TokenLimit   *int
	DurationDays *int
	Features     []string
	IsActive     *bool
}

type UpdatePackageHandler struct {
	packageRepo      packagedomain.Repository
	subscriptionRepo subscription.Repository
}

func NewUpdatePackageHandler(
	packageRepo packagedomain.Repository,
	subscriptionRepo subscription.Repository,
) *UpdatePackageHandler {
	return &UpdatePackageHandler{
		packageRepo:      packageRepo,
		subscriptionRepo: subscriptionRepo,
	}
}

func (h *UpdatePackageHandler) Handle(ctx context.Context, cmd UpdatePackageCommand) error {
	pkg, err := h.packageRepo.FindByID(ctx, cmd.ID)
	if err != nil {
		return err
	}

	// Track if token limit is being updated
	var tokenLimitUpdated bool
	var newTokenLimit int

	if cmd.Name != nil || cmd.Description != nil {
		name := pkg.GetName()
		desc := pkg.GetDescription()

		if cmd.Name != nil {
			name = *cmd.Name
		}
		if cmd.Description != nil {
			desc = *cmd.Description
		}

		if err := pkg.UpdateDetails(name, desc); err != nil {
			return err
		}
	}

	if cmd.Price != nil || cmd.TokenLimit != nil || cmd.DurationDays != nil {
		price := pkg.GetPrice()
		tokenLimit := pkg.GetTokenLimit()
		duration := pkg.GetDuration()

		if cmd.Price != nil {
			price, err = packagedomain.NewMoney(*cmd.Price)
			if err != nil {
				return err
			}
		}

		if cmd.TokenLimit != nil {
			tokenLimit, err = packagedomain.NewTokenLimit(*cmd.TokenLimit)
			if err != nil {
				return err
			}
			tokenLimitUpdated = true
			newTokenLimit = tokenLimit.Value()
		}

		if cmd.DurationDays != nil {
			duration, err = packagedomain.NewDuration(*cmd.DurationDays)
			if err != nil {
				return err
			}
		}

		pkg.UpdatePricing(price, tokenLimit, duration)
	}

	if len(cmd.Features) > 0 {
		pkg.SetFeatures(cmd.Features)
	}

	if cmd.IsActive != nil {
		if *cmd.IsActive {
			pkg.Activate()
		} else {
			pkg.Deactivate()
		}
	}

	// Save package first
	if err := h.packageRepo.Save(ctx, pkg); err != nil {
		return err
	}

	// If token limit was updated, update all active subscriptions using this package
	if tokenLimitUpdated {
		subscriptions, err := h.subscriptionRepo.FindActiveByPackageID(ctx, cmd.ID)
		if err != nil {
			return fmt.Errorf("failed to find subscriptions for package: %w", err)
		}

		for _, sub := range subscriptions {
			sub.UpdateTotalTokens(newTokenLimit)
			if err := h.subscriptionRepo.Save(ctx, sub); err != nil {
				return fmt.Errorf("failed to update subscription %s: %w", sub.ID, err)
			}
		}
	}

	return nil
}
