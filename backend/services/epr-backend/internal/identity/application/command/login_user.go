package command

import (
	"context"

	"github.com/epr-legal/epr-backend/internal/identity/domain/user"
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
)

type LoginUserCommand struct {
	Email    string
	Password string
}

type LoginUserResult struct {
	UserID   uuid.UUID
	Email    string
	FullName string
	Role     string
}

type LoginUserHandler struct {
	userRepo user.Repository
}

func NewLoginUserHandler(userRepo user.Repository) *LoginUserHandler {
	return &LoginUserHandler{userRepo: userRepo}
}

func (h *LoginUserHandler) Handle(ctx context.Context, cmd LoginUserCommand) (*LoginUserResult, error) {
	email, err := user.NewEmail(cmd.Email)
	if err != nil {
		return nil, err
	}

	foundUser, err := h.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if err == domain.ErrNotFound {
			return nil, user.ErrInvalidCredentials
		}
		return nil, err
	}

	if err := foundUser.Authenticate(cmd.Password); err != nil {
		return nil, err
	}

	if err := h.userRepo.Save(ctx, foundUser); err != nil {
		return nil, err
	}

	return &LoginUserResult{
		UserID:   foundUser.GetID(),
		Email:    foundUser.GetEmail().String(),
		FullName: foundUser.GetFullName(),
		Role:     string(foundUser.GetRole()),
	}, nil
}
