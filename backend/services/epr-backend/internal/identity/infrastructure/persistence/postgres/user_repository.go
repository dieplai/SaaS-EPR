package postgres

import (
	"context"
	"errors"

	"github.com/epr-legal/epr-backend/internal/identity/domain/user"
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Save(ctx context.Context, usr *user.User) error {
	model := r.toModel(usr)
	return r.db.WithContext(ctx).Save(model).Error
}

func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (*user.User, error) {
	var model UserModel
	result := r.db.WithContext(ctx).Where("id = ?", id).First(&model)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, result.Error
	}

	return r.toDomain(&model)
}

func (r *UserRepository) FindByEmail(ctx context.Context, email user.Email) (*user.User, error) {
	var model UserModel
	result := r.db.WithContext(ctx).Where("email = ?", email.String()).First(&model)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, result.Error
	}

	return r.toDomain(&model)
}

func (r *UserRepository) FindAll(ctx context.Context) ([]*user.User, error) {
	var models []UserModel
	result := r.db.WithContext(ctx).Order("created_at DESC").Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	users := make([]*user.User, len(models))
	for i, model := range models {
		u, err := r.toDomain(&model)
		if err != nil {
			return nil, err
		}
		users[i] = u
	}

	return users, nil
}

func (r *UserRepository) Exists(ctx context.Context, email user.Email) (bool, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(&UserModel{}).
		Where("email = ?", email.String()).
		Count(&count)

	return count > 0, result.Error
}

func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&UserModel{}, id).Error
}

func (r *UserRepository) List(ctx context.Context, offset, limit int) ([]*user.User, error) {
	var models []UserModel
	result := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	users := make([]*user.User, len(models))
	for i, model := range models {
		u, err := r.toDomain(&model)
		if err != nil {
			return nil, err
		}
		users[i] = u
	}

	return users, nil
}

func (r *UserRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(&UserModel{}).Count(&count)
	return count, result.Error
}

func (r *UserRepository) toModel(usr *user.User) *UserModel {
	return &UserModel{
		ID:              usr.GetID(),
		Email:           usr.GetEmail().String(),
		PasswordHash:    usr.GetPasswordHash(),
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
		DeletedAt:       gorm.DeletedAt{Valid: usr.DeletedAt != nil},
	}
}

func (r *UserRepository) toDomain(model *UserModel) (*user.User, error) {
	email, err := user.NewEmail(model.Email)
	if err != nil {
		return nil, err
	}

	password := user.NewPasswordFromHash(model.PasswordHash)

	// Prepare base entity
	baseEntity := domain.BaseEntity{
		ID:        model.ID,
		CreatedAt: model.CreatedAt,
		UpdatedAt: model.UpdatedAt,
		DeletedAt: nil,
	}
	if model.DeletedAt.Valid {
		t := model.DeletedAt.Time
		baseEntity.DeletedAt = &t
	}

	// Parse role (default to RoleUser if empty or invalid)
	role := user.RoleUser
	if model.Role != "" {
		r := user.Role(model.Role)
		if r.IsValid() {
			role = r
		}
	}

	// Reconstruct user from persistence
	// This bypasses business rules and domain events
	usr := user.ReconstructUser(
		baseEntity,
		email,
		password,
		model.FullName,
		model.Phone,
		model.CompanyName,
		model.AvatarURL,
		role,
		model.IsActive,
		model.IsVerified,
		model.LastLoginAt,
		model.EmailVerifiedAt,
	)

	return usr, nil
}
