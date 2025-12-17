package dto

import (
	"time"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/google/uuid"
)

type SubscriptionDTO struct {
	ID                 uuid.UUID  `json:"id"`
	UserID             uuid.UUID  `json:"user_id"`
	PackageID          uuid.UUID  `json:"package_id"`
	PackageName        string     `json:"package_name,omitempty"` // Populated by query handler
	StartDate          time.Time  `json:"start_date"`
	EndDate            time.Time  `json:"end_date"`
	Status             string     `json:"status"`
	RemainingTokens    int        `json:"remaining_tokens"`
	TotalTokens        int        `json:"total_tokens"`
	CurrentPeriodStart time.Time  `json:"current_period_start"`
	CurrentPeriodEnd   time.Time  `json:"current_period_end"`
	AutoRenew          bool       `json:"auto_renew"`
	LastTokenResetAt   *time.Time `json:"last_token_reset_at,omitempty"`
	NextTokenResetAt   *time.Time `json:"next_token_reset_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type CreateSubscriptionRequest struct {
	PackageID uuid.UUID `json:"package_id" binding:"required"`
}

type ConsumeTokensRequest struct {
	TokenCount int `json:"token_count" binding:"required,min=1"`
}

func SubscriptionToDTO(sub *subscription.Subscription) *SubscriptionDTO {
	return &SubscriptionDTO{
		ID:                 sub.ID,
		UserID:             sub.GetUserID(),
		PackageID:          sub.GetPackageID(),
		StartDate:          sub.GetStartDate(),
		EndDate:            sub.GetEndDate(),
		Status:             sub.GetStatus().String(),
		RemainingTokens:    sub.GetRemainingTokens(),
		TotalTokens:        sub.GetTotalTokens(),
		CurrentPeriodStart: sub.GetCurrentPeriodStart(),
		CurrentPeriodEnd:   sub.GetCurrentPeriodEnd(),
		AutoRenew:          sub.GetAutoRenew(),
		LastTokenResetAt:   sub.GetLastTokenResetAt(),
		NextTokenResetAt:   sub.GetNextTokenResetAt(),
		CreatedAt:          sub.CreatedAt,
		UpdatedAt:          sub.UpdatedAt,
	}
}
