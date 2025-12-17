package query

import (
	"context"

	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/epr-legal/epr-backend/internal/subscription/application/dto"
)

type ListPackagesQuery struct {
	Limit  int
	Offset int
}

type ListPackagesHandler struct {
	repo packagedomain.Repository
}

func NewListPackagesHandler(repo packagedomain.Repository) *ListPackagesHandler {
	return &ListPackagesHandler{repo: repo}
}

func (h *ListPackagesHandler) Handle(ctx context.Context, query ListPackagesQuery) ([]*dto.PackageDTO, error) {
	packages, err := h.repo.FindActive(ctx)
	if err != nil {
		return nil, err
	}

	dtos := make([]*dto.PackageDTO, len(packages))
	for i, pkg := range packages {
		dtos[i] = dto.PackageToDTO(pkg)
	}

	return dtos, nil
}
