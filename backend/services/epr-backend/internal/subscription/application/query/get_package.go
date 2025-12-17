package query

import (
	"context"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/epr-legal/epr-backend/internal/subscription/application/dto"
	"github.com/google/uuid"
)

type GetPackageQuery struct {
	PackageID uuid.UUID
}

type GetPackageHandler struct {
	repo packagedomain.Repository
}

func NewGetPackageHandler(repo packagedomain.Repository) *GetPackageHandler {
	return &GetPackageHandler{repo: repo}
}

func (h *GetPackageHandler) Handle(ctx context.Context, query GetPackageQuery) (*dto.PackageDTO, error) {
	pkg, err := h.repo.FindByID(ctx, query.PackageID)
	if err != nil {
		return nil, err
	}

	return dto.PackageToDTO(pkg), nil
}
