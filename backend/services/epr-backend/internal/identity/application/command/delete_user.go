package command

import (
	"context"

	"github.com/epr-legal/epr-backend/internal/identity/domain/user"
	"github.com/google/uuid"
)

type DeleteUserCommand struct {
	UserID uuid.UUID
}

type DeleteUserHandler struct {
	userRepo user.Repository
}

func NewDeleteUserHandler(userRepo user.Repository) *DeleteUserHandler {
	return &DeleteUserHandler{userRepo: userRepo}
}

func (h *DeleteUserHandler) Handle(ctx context.Context, cmd DeleteUserCommand) error {
	// Verify user exists before deleting
	_, err := h.userRepo.FindByID(ctx, cmd.UserID)
	if err != nil {
		return err
	}

	return h.userRepo.Delete(ctx, cmd.UserID)
}
