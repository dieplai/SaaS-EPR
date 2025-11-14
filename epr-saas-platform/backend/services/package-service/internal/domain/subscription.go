package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SubscriptionStatus represents the status of a subscription
type SubscriptionStatus string

const (
	SubscriptionActive   SubscriptionStatus = "active"
	SubscriptionExpired  SubscriptionStatus = "expired"
	SubscriptionCanceled SubscriptionStatus = "canceled"
)

// Subscription represents a user's subscription to a package
// Entity này đại diện cho việc user mua 1 package
type Subscription struct {
	// Primary key
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`

	// Foreign keys
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	PackageID uuid.UUID `gorm:"type:uuid;not null;index" json:"package_id"`

	// Subscription period
	StartDate time.Time `gorm:"type:timestamp;not null" json:"start_date"`
	EndDate   time.Time `gorm:"type:timestamp;not null" json:"end_date"`

	// Status
	Status SubscriptionStatus `gorm:"type:varchar(20);not null;index" json:"status"`

	// Remaining queries (cached value, updated daily)
	RemainingQueries int `gorm:"not null" json:"remaining_queries"`

	// Timestamps
	CreatedAt time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time      `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"` // Soft delete

	// Relations (loaded when needed)
	Package *Package `gorm:"foreignKey:PackageID" json:"package,omitempty"`
}

// TableName specifies the table name
func (Subscription) TableName() string {
	return "subscriptions"
}

// BeforeCreate is a GORM hook
func (s *Subscription) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// IsActive checks if subscription is currently active
func (s *Subscription) IsActive() bool {
	now := time.Now()
	return s.Status == SubscriptionActive &&
		now.After(s.StartDate) &&
		now.Before(s.EndDate)
}

// IsExpired checks if subscription has expired
func (s *Subscription) IsExpired() bool {
	return time.Now().After(s.EndDate) || s.Status == SubscriptionExpired
}

// HasQueriesRemaining checks if user has queries left
func (s *Subscription) HasQueriesRemaining() bool {
	return s.RemainingQueries > 0
}

// CanQuery checks if user can make a query (active + has queries)
func (s *Subscription) CanQuery() bool {
	return s.IsActive() && s.HasQueriesRemaining()
}

// UpdateStatus updates subscription status based on current time
func (s *Subscription) UpdateStatus() {
	if s.IsExpired() && s.Status == SubscriptionActive {
		s.Status = SubscriptionExpired
	}
}

// ============================================
// INPUT/OUTPUT STRUCTS
// ============================================

// CreateSubscriptionInput represents the data needed to create a subscription
type CreateSubscriptionInput struct {
	UserID    uuid.UUID `json:"user_id" binding:"required"`
	PackageID uuid.UUID `json:"package_id" binding:"required"`
}

// SubscriptionResponse is the public representation of a subscription
type SubscriptionResponse struct {
	ID               uuid.UUID           `json:"id"`
	UserID           uuid.UUID           `json:"user_id"`
	PackageID        uuid.UUID           `json:"package_id"`
	Package          *PackageResponse    `json:"package,omitempty"`
	StartDate        time.Time           `json:"start_date"`
	EndDate          time.Time           `json:"end_date"`
	Status           SubscriptionStatus  `json:"status"`
	RemainingQueries int                 `json:"remaining_queries"`
	CreatedAt        time.Time           `json:"created_at"`
	UpdatedAt        time.Time           `json:"updated_at"`
}

// ToResponse converts Subscription to SubscriptionResponse
func (s *Subscription) ToResponse() *SubscriptionResponse {
	resp := &SubscriptionResponse{
		ID:               s.ID,
		UserID:           s.UserID,
		PackageID:        s.PackageID,
		StartDate:        s.StartDate,
		EndDate:          s.EndDate,
		Status:           s.Status,
		RemainingQueries: s.RemainingQueries,
		CreatedAt:        s.CreatedAt,
		UpdatedAt:        s.UpdatedAt,
	}

	// Include package details if loaded
	if s.Package != nil {
		resp.Package = s.Package.ToResponse()
	}

	return resp
}

// ============================================
// USAGE QUOTA
// ============================================

// UsageQuota tracks daily query usage for a subscription
// Entity này track số queries user đã dùng mỗi ngày
type UsageQuota struct {
	// Primary key
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`

	// Foreign key
	SubscriptionID uuid.UUID `gorm:"type:uuid;not null;index" json:"subscription_id"`

	// Date tracking
	Date time.Time `gorm:"type:date;not null;index" json:"date"`

	// Usage tracking
	QueryCount int `gorm:"not null;default:0" json:"query_count"`

	// Timestamps
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Unique constraint: one record per subscription per date
	// Will be handled in migration
}

// TableName specifies the table name
func (UsageQuota) TableName() string {
	return "usage_quotas"
}

// BeforeCreate is a GORM hook
func (uq *UsageQuota) BeforeCreate(tx *gorm.DB) error {
	if uq.ID == uuid.Nil {
		uq.ID = uuid.New()
	}
	return nil
}
