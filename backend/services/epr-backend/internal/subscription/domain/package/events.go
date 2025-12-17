package packagedomain

import (
	"time"

	"github.com/google/uuid"
)

type PackageCreatedEvent struct {
	eventID    uuid.UUID
	PackageID  uuid.UUID
	Name       string
	Price      float64
	occurredAt time.Time
}

func NewPackageCreatedEvent(packageID uuid.UUID, name string, price float64) *PackageCreatedEvent {
	return &PackageCreatedEvent{
		eventID:    uuid.New(),
		PackageID:  packageID,
		Name:       name,
		Price:      price,
		occurredAt: time.Now(),
	}
}

func (e *PackageCreatedEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *PackageCreatedEvent) EventName() string {
	return "package.created"
}

func (e *PackageCreatedEvent) AggregateID() uuid.UUID {
	return e.PackageID
}

func (e *PackageCreatedEvent) OccurredAt() time.Time {
	return e.occurredAt
}

type PackageUpdatedEvent struct {
	eventID    uuid.UUID
	PackageID  uuid.UUID
	Name       string
	occurredAt time.Time
}

func NewPackageUpdatedEvent(packageID uuid.UUID, name string) *PackageUpdatedEvent {
	return &PackageUpdatedEvent{
		eventID:    uuid.New(),
		PackageID:  packageID,
		Name:       name,
		occurredAt: time.Now(),
	}
}

func (e *PackageUpdatedEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *PackageUpdatedEvent) EventName() string {
	return "package.updated"
}

func (e *PackageUpdatedEvent) AggregateID() uuid.UUID {
	return e.PackageID
}

func (e *PackageUpdatedEvent) OccurredAt() time.Time {
	return e.occurredAt
}

type PackageActivatedEvent struct {
	eventID    uuid.UUID
	PackageID  uuid.UUID
	occurredAt time.Time
}

func NewPackageActivatedEvent(packageID uuid.UUID) *PackageActivatedEvent {
	return &PackageActivatedEvent{
		eventID:    uuid.New(),
		PackageID:  packageID,
		occurredAt: time.Now(),
	}
}

func (e *PackageActivatedEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *PackageActivatedEvent) EventName() string {
	return "package.activated"
}

func (e *PackageActivatedEvent) AggregateID() uuid.UUID {
	return e.PackageID
}

func (e *PackageActivatedEvent) OccurredAt() time.Time {
	return e.occurredAt
}

type PackageDeactivatedEvent struct {
	eventID    uuid.UUID
	PackageID  uuid.UUID
	occurredAt time.Time
}

func NewPackageDeactivatedEvent(packageID uuid.UUID) *PackageDeactivatedEvent {
	return &PackageDeactivatedEvent{
		eventID:    uuid.New(),
		PackageID:  packageID,
		occurredAt: time.Now(),
	}
}

func (e *PackageDeactivatedEvent) EventID() uuid.UUID {
	return e.eventID
}

func (e *PackageDeactivatedEvent) EventName() string {
	return "package.deactivated"
}

func (e *PackageDeactivatedEvent) AggregateID() uuid.UUID {
	return e.PackageID
}

func (e *PackageDeactivatedEvent) OccurredAt() time.Time {
	return e.occurredAt
}
