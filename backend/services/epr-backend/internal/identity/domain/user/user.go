package user

import (
	"errors"
	"time"

	"github.com/epr-legal/epr-backend/internal/identity/domain/events"
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
)

// Role represents user roles in the system
type Role string

const (
	RoleUser    Role = "user"
	RoleAdmin   Role = "admin"
	RoleManager Role = "manager"
)

// IsValid checks if the role is valid
func (r Role) IsValid() bool {
	switch r {
	case RoleUser, RoleAdmin, RoleManager:
		return true
	}
	return false
}

type User struct {
	domain.AggregateRoot

	email           Email
	password        Password
	fullName        string
	phone           string
	companyName     string
	avatarURL       string
	role            Role
	isActive        bool
	isVerified      bool
	lastLoginAt     *time.Time
	emailVerifiedAt *time.Time
}

var (
	ErrUserInactive       = errors.New("user is inactive")
	ErrUserNotVerified    = errors.New("user email not verified")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

func NewUser(email Email, password Password, fullName string) (*User, error) {
	if fullName == "" {
		return nil, errors.New("full name is required")
	}

	user := &User{
		AggregateRoot: domain.AggregateRoot{
			BaseEntity: domain.NewBaseEntity(),
		},
		email:      email,
		password:   password,
		fullName:   fullName,
		role:       RoleUser, // Default role for new users
		isActive:   true,
		isVerified: false,
	}

	user.RaiseDomainEvent(events.NewUserRegistered(user.ID, user.email.String(), user.fullName))

	return user, nil
}

// ReconstructUser creates a User aggregate from persistence data
// This bypasses business rules and is only used by the repository
func ReconstructUser(
	baseEntity domain.BaseEntity,
	email Email,
	password Password,
	fullName string,
	phone string,
	companyName string,
	avatarURL string,
	role Role,
	isActive bool,
	isVerified bool,
	lastLoginAt *time.Time,
	emailVerifiedAt *time.Time,
) *User {
	return &User{
		AggregateRoot: domain.AggregateRoot{
			BaseEntity: baseEntity,
		},
		email:           email,
		password:        password,
		fullName:        fullName,
		phone:           phone,
		companyName:     companyName,
		avatarURL:       avatarURL,
		role:            role,
		isActive:        isActive,
		isVerified:      isVerified,
		lastLoginAt:     lastLoginAt,
		emailVerifiedAt: emailVerifiedAt,
	}
}

func (u *User) GetID() uuid.UUID               { return u.ID }
func (u *User) GetEmail() Email                { return u.email }
func (u *User) GetFullName() string            { return u.fullName }
func (u *User) GetPhone() string               { return u.phone }
func (u *User) GetCompanyName() string         { return u.companyName }
func (u *User) GetAvatarURL() string           { return u.avatarURL }
func (u *User) GetRole() Role                  { return u.role }
func (u *User) IsActive() bool                 { return u.isActive }
func (u *User) IsVerified() bool               { return u.isVerified }
func (u *User) GetLastLoginAt() *time.Time     { return u.lastLoginAt }
func (u *User) GetEmailVerifiedAt() *time.Time { return u.emailVerifiedAt }
func (u *User) GetPasswordHash() string        { return u.password.Hash() }

// IsAdmin checks if the user has admin role
func (u *User) IsAdmin() bool {
	return u.role == RoleAdmin
}

// IsManager checks if the user has manager role
func (u *User) IsManager() bool {
	return u.role == RoleManager
}

// HasRole checks if the user has the specified role
func (u *User) HasRole(role Role) bool {
	return u.role == role
}

func (u *User) VerifyPassword(plainPassword string) error {
	if !u.password.Verify(plainPassword) {
		return ErrInvalidCredentials
	}
	return nil
}

func (u *User) Authenticate(plainPassword string) error {
	if !u.isActive {
		return ErrUserInactive
	}

	if !u.password.Verify(plainPassword) {
		return ErrInvalidCredentials
	}

	now := time.Now()
	u.lastLoginAt = &now
	u.UpdatedAt = now

	u.RaiseDomainEvent(events.NewUserLoggedIn(u.ID, u.email.String()))

	return nil
}

func (u *User) ChangePassword(oldPassword, newPassword string) error {
	if !u.password.Verify(oldPassword) {
		return ErrInvalidPassword
	}

	newPass, err := NewPassword(newPassword)
	if err != nil {
		return err
	}

	u.password = newPass
	u.UpdatedAt = time.Now()

	u.RaiseDomainEvent(events.NewPasswordChanged(u.ID))

	return nil
}

func (u *User) UpdateProfile(fullName, phone, companyName, avatarURL string) error {
	if fullName == "" {
		return errors.New("full name cannot be empty")
	}

	u.fullName = fullName
	u.phone = phone
	u.companyName = companyName
	u.avatarURL = avatarURL
	u.UpdatedAt = time.Now()

	return nil
}

func (u *User) VerifyEmail() {
	if !u.isVerified {
		now := time.Now()
		u.isVerified = true
		u.emailVerifiedAt = &now
		u.UpdatedAt = now

		u.RaiseDomainEvent(events.NewEmailVerified(u.ID))
	}
}

func (u *User) Deactivate() {
	if u.isActive {
		u.isActive = false
		u.UpdatedAt = time.Now()

		u.RaiseDomainEvent(events.NewUserDeactivated(u.ID))
	}
}

func (u *User) Activate() {
	if !u.isActive {
		u.isActive = true
		u.UpdatedAt = time.Now()
	}
}

// ChangeRole updates the user's role (admin operation)
func (u *User) ChangeRole(newRole Role) error {
	if !newRole.IsValid() {
		return errors.New("invalid role")
	}

	if u.role != newRole {
		u.role = newRole
		u.UpdatedAt = time.Now()
	}

	return nil
}
