package query

import (
	"context"

	"github.com/epr-legal/epr-backend/internal/identity/application/dto"
	"github.com/epr-legal/epr-backend/internal/identity/domain/user"
	"github.com/google/uuid"
)

type GetUserProfileQuery struct {
	UserID uuid.UUID
}

type GetUserProfileHandler struct {
	userRepo user.Repository
}

func NewGetUserProfileHandler(userRepo user.Repository) *GetUserProfileHandler {
	return &GetUserProfileHandler{userRepo: userRepo}
}

func (h *GetUserProfileHandler) Handle(ctx context.Context, query GetUserProfileQuery) (*dto.UserProfileDTO, error) {
	foundUser, err := h.userRepo.FindByID(ctx, query.UserID)
	if err != nil {
		return nil, err
	}

	return &dto.UserProfileDTO{
		ID:              foundUser.GetID().String(),
		Email:           foundUser.GetEmail().String(),
		FullName:        foundUser.GetFullName(),
		Phone:           foundUser.GetPhone(),
		CompanyName:     foundUser.GetCompanyName(),
		AvatarURL:       foundUser.GetAvatarURL(),
		Role:            string(foundUser.GetRole()),
		IsActive:        foundUser.IsActive(),
		IsVerified:      foundUser.IsVerified(),
		LastLoginAt:     foundUser.GetLastLoginAt(),
		EmailVerifiedAt: foundUser.GetEmailVerifiedAt(),
		CreatedAt:       foundUser.CreatedAt,
		UpdatedAt:       foundUser.UpdatedAt,
	}, nil
}
