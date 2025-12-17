package packagedomain

import (
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
)

type Package struct {
	domain.AggregateRoot
	name        string
	description string
	price       Money
	tokenLimit  TokenLimit
	duration    Duration
	features    []string
	isActive    bool
}

func NewPackage(
	name string,
	description string,
	price Money,
	tokenLimit TokenLimit,
	duration Duration,
) (*Package, error) {
	if name == "" {
		return nil, domain.ErrInvalidInput
	}

	pkg := &Package{
		AggregateRoot: domain.AggregateRoot{
			BaseEntity: domain.BaseEntity{
				ID: uuid.New(),
			},
		},
		name:        name,
		description: description,
		price:       price,
		tokenLimit:  tokenLimit,
		duration:    duration,
		features:    make([]string, 0),
		isActive:    true,
	}

	pkg.RaiseDomainEvent(NewPackageCreatedEvent(pkg.ID, name, price.Amount()))

	return pkg, nil
}

func (p *Package) GetName() string {
	return p.name
}

func (p *Package) GetDescription() string {
	return p.description
}

func (p *Package) GetPrice() Money {
	return p.price
}

func (p *Package) GetTokenLimit() TokenLimit {
	return p.tokenLimit
}

// Legacy support - will be removed in future versions
func (p *Package) GetQueryLimit() TokenLimit {
	return p.tokenLimit
}

func (p *Package) GetDuration() Duration {
	return p.duration
}

func (p *Package) GetFeatures() []string {
	return p.features
}

func (p *Package) IsActive() bool {
	return p.isActive
}

func (p *Package) UpdateDetails(name, description string) error {
	if name == "" {
		return domain.ErrInvalidInput
	}

	p.name = name
	p.description = description

	p.RaiseDomainEvent(NewPackageUpdatedEvent(p.ID, name))

	return nil
}

func (p *Package) UpdatePricing(price Money, tokenLimit TokenLimit, duration Duration) {
	p.price = price
	p.tokenLimit = tokenLimit
	p.duration = duration
}

func (p *Package) SetFeatures(features []string) {
	p.features = features
}

func (p *Package) Activate() {
	if !p.isActive {
		p.isActive = true
		p.RaiseDomainEvent(NewPackageActivatedEvent(p.ID))
	}
}

func (p *Package) Deactivate() {
	if p.isActive {
		p.isActive = false
		p.RaiseDomainEvent(NewPackageDeactivatedEvent(p.ID))
	}
}
