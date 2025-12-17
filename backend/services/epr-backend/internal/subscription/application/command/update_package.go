package command

import (
	"context"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
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
	repo packagedomain.Repository
}

func NewUpdatePackageHandler(repo packagedomain.Repository) *UpdatePackageHandler {
	return &UpdatePackageHandler{repo: repo}
}

func (h *UpdatePackageHandler) Handle(ctx context.Context, cmd UpdatePackageCommand) error {
	pkg, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return err
	}

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

	return h.repo.Save(ctx, pkg)
}
