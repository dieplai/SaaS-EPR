package command

import (
	"context"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/google/uuid"
)

type CreatePackageCommand struct {
	Name         string
	Description  string
	Price        float64
	TokenLimit   int
	DurationDays int
	Features     []string
}

type CreatePackageHandler struct {
	repo packagedomain.Repository
}

func NewCreatePackageHandler(repo packagedomain.Repository) *CreatePackageHandler {
	return &CreatePackageHandler{repo: repo}
}

func (h *CreatePackageHandler) Handle(ctx context.Context, cmd CreatePackageCommand) (uuid.UUID, error) {
	price, err := packagedomain.NewMoney(cmd.Price)
	if err != nil {
		return uuid.Nil, err
	}

	tokenLimit, err := packagedomain.NewTokenLimit(cmd.TokenLimit)
	if err != nil {
		return uuid.Nil, err
	}

	duration, err := packagedomain.NewDuration(cmd.DurationDays)
	if err != nil {
		return uuid.Nil, err
	}

	pkg, err := packagedomain.NewPackage(
		cmd.Name,
		cmd.Description,
		price,
		tokenLimit,
		duration,
	)
	if err != nil {
		return uuid.Nil, err
	}

	if len(cmd.Features) > 0 {
		pkg.SetFeatures(cmd.Features)
	}

	if err := h.repo.Save(ctx, pkg); err != nil {
		return uuid.Nil, err
	}

	return pkg.ID, nil
}
