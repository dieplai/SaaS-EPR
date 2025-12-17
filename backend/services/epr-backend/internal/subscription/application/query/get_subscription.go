package query

import (
	"context"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/epr-legal/epr-backend/internal/subscription/application/dto"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/google/uuid"
)

type GetSubscriptionQuery struct {
	UserID uuid.UUID
}

type GetSubscriptionHandler struct {
	repo        subscription.Repository
	packageRepo packagedomain.Repository
}

func NewGetSubscriptionHandler(
	repo subscription.Repository,
	packageRepo packagedomain.Repository,
) *GetSubscriptionHandler {
	return &GetSubscriptionHandler{
		repo:        repo,
		packageRepo: packageRepo,
	}
}

func (h *GetSubscriptionHandler) Handle(ctx context.Context, query GetSubscriptionQuery) (*dto.SubscriptionDTO, error) {
	sub, err := h.repo.FindActiveByUserID(ctx, query.UserID)
	if err != nil {
		return nil, err
	}

	if sub == nil {
		return nil, nil
	}

	sub.CheckAndUpdateStatus()

	// Convert to DTO
	subscriptionDTO := dto.SubscriptionToDTO(sub)

	// Fetch package name
	pkg, err := h.packageRepo.FindByID(ctx, sub.GetPackageID())
	if err == nil && pkg != nil {
		subscriptionDTO.PackageName = pkg.GetName()
	}

	return subscriptionDTO, nil
}
