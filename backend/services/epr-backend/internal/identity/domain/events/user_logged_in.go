package events

import (
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
)

type UserLoggedIn struct {
	domain.BaseDomainEvent
	Email string
}

func NewUserLoggedIn(userID uuid.UUID, email string) UserLoggedIn {
	return UserLoggedIn{
		BaseDomainEvent: domain.NewBaseDomainEvent("identity.user.logged_in", userID),
		Email:           email,
	}
}
