package command

import (
	"context"

	"github.com/epr-legal/epr-backend/internal/identity/domain/user"
	"github.com/google/uuid"
)

type UpdateUserCommand struct {
	UserID   uuid.UUID
	FullName *string
	Phone    *string
	Company  *string
}

type UpdateUserHandler struct {
	userRepo user.Repository
}

func NewUpdateUserHandler(userRepo user.Repository) *UpdateUserHandler {
	return &UpdateUserHandler{userRepo: userRepo}
}

func (h *UpdateUserHandler) Handle(ctx context.Context, cmd UpdateUserCommand) error {
	usr, err := h.userRepo.FindByID(ctx, cmd.UserID)
	if err != nil {
		return err
	}

	// Get current values
	fullName := usr.GetFullName()
	phone := usr.GetPhone()
	company := usr.GetCompanyName()
	avatar := usr.GetAvatarURL()

	// Update with new values if provided
	if cmd.FullName != nil {
		fullName = *cmd.FullName
	}
	if cmd.Phone != nil {
		phone = *cmd.Phone
	}
	if cmd.Company != nil {
		company = *cmd.Company
	}

	// Apply all updates at once
	if err := usr.UpdateProfile(fullName, phone, company, avatar); err != nil {
		return err
	}

	return h.userRepo.Save(ctx, usr)
}
