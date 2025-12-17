package command

import (
	"context"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/google/uuid"
)

type DeletePackageCommand struct {
	ID uuid.UUID
}

type DeletePackageHandler struct {
	repo packagedomain.Repository
}

func NewDeletePackageHandler(repo packagedomain.Repository) *DeletePackageHandler {
	return &DeletePackageHandler{repo: repo}
}

func (h *DeletePackageHandler) Handle(ctx context.Context, cmd DeletePackageCommand) error {
	// Soft delete by calling Delete on repository
	return h.repo.Delete(ctx, cmd.ID)
}
