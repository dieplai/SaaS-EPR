package events

import (
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
)

type EmailVerified struct {
	domain.BaseDomainEvent
}

func NewEmailVerified(userID uuid.UUID) EmailVerified {
	return EmailVerified{
		BaseDomainEvent: domain.NewBaseDomainEvent("identity.user.email_verified", userID),
	}
}
