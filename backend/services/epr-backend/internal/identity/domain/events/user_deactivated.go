package events

import (
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
)

type UserDeactivated struct {
	domain.BaseDomainEvent
}

func NewUserDeactivated(userID uuid.UUID) UserDeactivated {
	return UserDeactivated{
		BaseDomainEvent: domain.NewBaseDomainEvent("identity.user.deactivated", userID),
	}
}
