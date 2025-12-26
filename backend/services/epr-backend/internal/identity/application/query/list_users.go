package query

import (
	"context"

	"github.com/epr-legal/epr-backend/internal/identity/application/dto"
	"github.com/epr-legal/epr-backend/internal/identity/domain/user"
)

type ListUsersQuery struct{}

type ListUsersHandler struct {
	userRepo user.Repository
}

func NewListUsersHandler(userRepo user.Repository) *ListUsersHandler {
	return &ListUsersHandler{userRepo: userRepo}
}

func (h *ListUsersHandler) Handle(ctx context.Context, query ListUsersQuery) ([]dto.UserProfileDTO, error) {
	users, err := h.userRepo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]dto.UserProfileDTO, len(users))
	for i, usr := range users {
		result[i] = dto.UserProfileDTO{
			ID:              usr.GetID().String(),
			Email:           usr.GetEmail().String(),
			FullName:        usr.GetFullName(),
			Phone:           usr.GetPhone(),
			CompanyName:     usr.GetCompanyName(),
			AvatarURL:       usr.GetAvatarURL(),
			Role:            string(usr.GetRole()),
			IsActive:        usr.IsActive(),
			IsVerified:      usr.IsVerified(),
			LastLoginAt:     usr.GetLastLoginAt(),
			EmailVerifiedAt: usr.GetEmailVerifiedAt(),
			CreatedAt:       usr.CreatedAt,
			UpdatedAt:       usr.UpdatedAt,
		}
	}

	return result, nil
}
