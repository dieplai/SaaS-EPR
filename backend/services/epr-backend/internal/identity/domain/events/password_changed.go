package events

import (
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
)

type PasswordChanged struct {
	domain.BaseDomainEvent
}

func NewPasswordChanged(userID uuid.UUID) PasswordChanged {
	return PasswordChanged{
		BaseDomainEvent: domain.NewBaseDomainEvent("identity.user.password_changed", userID),
	}
}
