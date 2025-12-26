package command

import (
	"context"

	"github.com/epr-legal/epr-backend/internal/identity/domain/user"
	"github.com/google/uuid"
)

type ChangeUserRoleCommand struct {
	UserID  uuid.UUID
	NewRole string // "user", "admin", "manager"
}

type ChangeUserRoleHandler struct {
	userRepo user.Repository
}

func NewChangeUserRoleHandler(userRepo user.Repository) *ChangeUserRoleHandler {
	return &ChangeUserRoleHandler{userRepo: userRepo}
}

func (h *ChangeUserRoleHandler) Handle(ctx context.Context, cmd ChangeUserRoleCommand) error {
	usr, err := h.userRepo.FindByID(ctx, cmd.UserID)
	if err != nil {
		return err
	}

	role := user.Role(cmd.NewRole)
	if err := usr.ChangeRole(role); err != nil {
		return err
	}

	return h.userRepo.Save(ctx, usr)
}
