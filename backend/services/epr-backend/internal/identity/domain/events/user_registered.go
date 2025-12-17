package events

import (
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
)

type UserRegistered struct {
	domain.BaseDomainEvent
	Email    string
	FullName string
}

func NewUserRegistered(userID uuid.UUID, email, fullName string) UserRegistered {
	return UserRegistered{
		BaseDomainEvent: domain.NewBaseDomainEvent("identity.user.registered", userID),
		Email:           email,
		FullName:        fullName,
	}
}
