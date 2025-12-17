package domain

import (
	"time"

	"github.com/google/uuid"
)

type BaseEntity struct {
	ID        uuid.UUID
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time
}

func NewBaseEntity() BaseEntity {
	now := time.Now()
	return BaseEntity{
		ID:        uuid.New(),
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func (e BaseEntity) IsDeleted() bool {
	return e.DeletedAt != nil
}

func (e *BaseEntity) MarkDeleted() {
	now := time.Now()
	e.DeletedAt = &now
	e.UpdatedAt = now
}
