package dto

import "time"

type UserProfileDTO struct {
	ID              string     `json:"id"`
	Email           string     `json:"email"`
	FullName        string     `json:"full_name"`
	Phone           string     `json:"phone,omitempty"`
	CompanyName     string     `json:"company_name,omitempty"`
	AvatarURL       string     `json:"avatar_url,omitempty"`
	Role            string     `json:"role"`
	IsActive        bool       `json:"is_active"`
	IsVerified      bool       `json:"is_verified"`
	LastLoginAt     *time.Time `json:"last_login_at,omitempty"`
	EmailVerifiedAt *time.Time `json:"email_verified_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type RegisterUserRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=8"`
	FullName    string `json:"full_name" binding:"required"`
	Phone       string `json:"phone"`
	CompanyName string `json:"company_name"`
}

type LoginUserRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required"`
	RememberMe bool   `json:"remember_me"`
}

type LoginResponse struct {
	AccessToken  string         `json:"access_token"`
	RefreshToken string         `json:"refresh_token"`
	ExpiresIn    int64          `json:"expires_in"`
	User         UserProfileDTO `json:"user"`
}
