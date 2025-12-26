package command

import (
	"context"
	"fmt"

	"github.com/epr-legal/epr-backend/internal/identity/domain/user"
	subscriptioncommand "github.com/epr-legal/epr-backend/internal/subscription/application/command"
	"github.com/google/uuid"
)

// CreateUserAdminCommand is used by admins to create users with specific roles
type CreateUserAdminCommand struct {
	Email    string
	Password string
	FullName string
	Role     string // "user", "admin", "manager"
}

type CreateUserAdminHandler struct {
	userRepo                  user.Repository
	createSubscriptionHandler *subscriptioncommand.CreateSubscriptionHandler
}

func NewCreateUserAdminHandler(
	userRepo user.Repository,
	createSubscriptionHandler *subscriptioncommand.CreateSubscriptionHandler,
) *CreateUserAdminHandler {
	return &CreateUserAdminHandler{
		userRepo:                  userRepo,
		createSubscriptionHandler: createSubscriptionHandler,
	}
}

func (h *CreateUserAdminHandler) Handle(ctx context.Context, cmd CreateUserAdminCommand) (uuid.UUID, error) {
	email, err := user.NewEmail(cmd.Email)
	if err != nil {
		return uuid.Nil, err
	}

	// Check if user already exists
	exists, err := h.userRepo.Exists(ctx, email)
	if err != nil {
		return uuid.Nil, err
	}
	if exists {
		return uuid.Nil, user.ErrEmailAlreadyExists
	}

	password, err := user.NewPassword(cmd.Password)
	if err != nil {
		return uuid.Nil, err
	}

	// Parse and validate role
	role := user.Role(cmd.Role)
	if !role.IsValid() {
		role = user.RoleUser // Default to user if invalid
	}

	// Create user with specified role
	newUser, err := user.NewUserWithRole(email, password, cmd.FullName, role)
	if err != nil {
		return uuid.Nil, err
	}

	if err := h.userRepo.Save(ctx, newUser); err != nil {
		return uuid.Nil, err
	}

	// Auto-create FREE subscription for new user (same as registration flow)
	subscriptionCmd := subscriptioncommand.CreateSubscriptionCommand{
		UserID:    newUser.GetID(),
		PackageID: nil, // nil = FREE account
	}

	_, err = h.createSubscriptionHandler.Handle(ctx, subscriptionCmd)
	if err != nil {
		// Log error but don't fail user creation
		// User is created, but subscription creation failed
		return uuid.Nil, fmt.Errorf("user created but failed to create subscription: %w", err)
	}

	return newUser.GetID(), nil
}
