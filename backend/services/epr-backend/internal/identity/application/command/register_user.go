package command

import (
	"context"
	"errors"

	"github.com/epr-legal/epr-backend/internal/identity/domain/user"
	"github.com/google/uuid"
)

type RegisterUserCommand struct {
	Email    string
	Password string
	FullName string
	Phone    string
	CompanyName string
}

type RegisterUserHandler struct {
	userRepo user.Repository
}

func NewRegisterUserHandler(userRepo user.Repository) *RegisterUserHandler {
	return &RegisterUserHandler{userRepo: userRepo}
}

func (h *RegisterUserHandler) Handle(ctx context.Context, cmd RegisterUserCommand) (uuid.UUID, error) {
	email, err := user.NewEmail(cmd.Email)
	if err != nil {
		return uuid.Nil, err
	}

	password, err := user.NewPassword(cmd.Password)
	if err != nil {
		return uuid.Nil, err
	}

	exists, err := h.userRepo.Exists(ctx, email)
	if err != nil {
		return uuid.Nil, err
	}
	if exists {
		return uuid.Nil, errors.New("user with this email already exists")
	}

	newUser, err := user.NewUser(email, password, cmd.FullName)
	if err != nil {
		return uuid.Nil, err
	}

	if cmd.Phone != "" || cmd.CompanyName != "" {
		newUser.UpdateProfile(cmd.FullName, cmd.Phone, cmd.CompanyName, "")
	}

	if err := h.userRepo.Save(ctx, newUser); err != nil {
		return uuid.Nil, err
	}

	return newUser.GetID(), nil
}
