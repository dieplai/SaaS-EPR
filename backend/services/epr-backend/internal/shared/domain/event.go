package domain

import (
	"time"

	"github.com/google/uuid"
)

type DomainEvent interface {
	EventID() uuid.UUID
	EventName() string
	OccurredAt() time.Time
	AggregateID() uuid.UUID
}

type BaseDomainEvent struct {
	eventID     uuid.UUID
	eventName   string
	occurredAt  time.Time
	aggregateID uuid.UUID
}

func NewBaseDomainEvent(eventName string, aggregateID uuid.UUID) BaseDomainEvent {
	return BaseDomainEvent{
		eventID:     uuid.New(),
		eventName:   eventName,
		occurredAt:  time.Now(),
		aggregateID: aggregateID,
	}
}

func (e BaseDomainEvent) EventID() uuid.UUID     { return e.eventID }
func (e BaseDomainEvent) EventName() string      { return e.eventName }
func (e BaseDomainEvent) OccurredAt() time.Time  { return e.occurredAt }
func (e BaseDomainEvent) AggregateID() uuid.UUID { return e.aggregateID }

type AggregateRoot struct {
	BaseEntity
	domainEvents []DomainEvent
}

func (a *AggregateRoot) RaiseDomainEvent(event DomainEvent) {
	a.domainEvents = append(a.domainEvents, event)
}

func (a *AggregateRoot) GetDomainEvents() []DomainEvent {
	return a.domainEvents
}

func (a *AggregateRoot) ClearDomainEvents() {
	a.domainEvents = nil
}
