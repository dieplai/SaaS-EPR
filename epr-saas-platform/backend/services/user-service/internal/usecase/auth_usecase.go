package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/user-service/internal/config"
	"github.com/yourusername/epr-saas/user-service/internal/domain"
	"github.com/yourusername/epr-saas/user-service/internal/repository"
)

// AuthUseCase defines the interface for authentication business logic
// Interface này định nghĩa các operations liên quan đến authentication
type AuthUseCase interface {
	Register(ctx context.Context, input *domain.CreateUserInput) (*domain.AuthResponse, error)
	Login(ctx context.Context, input *domain.LoginInput) (*domain.AuthResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResponse, error)
	Logout(ctx context.Context, userID uuid.UUID, refreshToken string) error
	LogoutAll(ctx context.Context, userID uuid.UUID) error
}

// authUseCase implements AuthUseCase interface
// Struct này implement business logic
type authUseCase struct {
	userRepo  repository.UserRepository
	tokenRepo repository.RefreshTokenRepository
	cfg       *config.Config
}

// NewAuthUseCase creates a new instance of authUseCase
// Constructor - inject dependencies
func NewAuthUseCase(
	userRepo repository.UserRepository,
	tokenRepo repository.RefreshTokenRepository,
	cfg *config.Config,
) AuthUseCase {
	return &authUseCase{
		userRepo:  userRepo,
		tokenRepo: tokenRepo,
		cfg:       cfg,
	}
}

// ============================================
// REGISTER
// ============================================

// Register creates a new user account
func (uc *authUseCase) Register(ctx context.Context, input *domain.CreateUserInput) (*domain.AuthResponse, error) {
	// 1. Validate: Check if email already exists
	exists, err := uc.userRepo.Exists(ctx, input.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailAlreadyExists
	}

	// 2. Create user entity
	user := &domain.User{
		Email:    input.Email,
		FullName: input.FullName,
		Phone:    input.Phone,
		CompanyName: input.CompanyName,
		IsActive: true,
		IsVerified: false, // Email verification required
	}

	// 3. Hash password
	if err := user.SetPassword(input.Password); err != nil {
		return nil, errors.New("failed to hash password")
	}

	// 4. Save to database
	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	// 5. Generate JWT tokens
	accessToken, err := uc.generateAccessToken(user)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := uc.generateRefreshToken(user)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	// 6. Save refresh token to database
	if err := uc.saveRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, err
	}

	// 7. Return response
	return &domain.AuthResponse{
		User:         user.ToPublicUser(),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(uc.cfg.JWTAccessExpiration.Seconds()),
	}, nil
}

// ============================================
// LOGIN
// ============================================

// Login authenticates a user with email and password
func (uc *authUseCase) Login(ctx context.Context, input *domain.LoginInput) (*domain.AuthResponse, error) {
	// 1. Find user by email
	user, err := uc.userRepo.FindByEmail(ctx, input.Email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	// 2. Check if account is active
	if !user.IsAccountActive() {
		return nil, ErrAccountInactive
	}

	// 3. Verify password
	if !user.CheckPassword(input.Password) {
		return nil, ErrInvalidCredentials
	}

	// 4. Update last login timestamp
	user.UpdateLastLogin()
	if err := uc.userRepo.UpdateLastLogin(ctx, user.ID); err != nil {
		// Log error nhưng không fail login
		// (đây là non-critical operation)
	}

	// 5. Generate JWT tokens
	accessToken, err := uc.generateAccessToken(user)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := uc.generateRefreshToken(user)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	// 6. Save refresh token
	if err := uc.saveRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, err
	}

	// 7. Return response
	return &domain.AuthResponse{
		User:         user.ToPublicUser(),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(uc.cfg.JWTAccessExpiration.Seconds()),
	}, nil
}

// ============================================
// REFRESH TOKEN
// ============================================

// RefreshToken generates a new access token using a refresh token
func (uc *authUseCase) RefreshToken(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, error) {
	// 1. Verify refresh token exists and is valid
	refreshToken, err := uc.tokenRepo.FindByToken(ctx, refreshTokenStr)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	// 2. Check if token is expired or revoked
	if !refreshToken.IsValid() {
		return nil, ErrRefreshTokenExpired
	}

	// 3. Get user
	user, err := uc.userRepo.FindByID(ctx, refreshToken.UserID)
	if err != nil {
		return nil, err
	}

	// 4. Check if account is still active
	if !user.IsAccountActive() {
		return nil, ErrAccountInactive
	}

	// 5. Generate new access token
	accessToken, err := uc.generateAccessToken(user)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	// 6. Optionally rotate refresh token (best practice)
	// For now, reuse the same refresh token

	// 7. Return response
	return &domain.AuthResponse{
		User:         user.ToPublicUser(),
		AccessToken:  accessToken,
		RefreshToken: refreshTokenStr, // Reuse same refresh token
		ExpiresIn:    int64(uc.cfg.JWTAccessExpiration.Seconds()),
	}, nil
}

// ============================================
// LOGOUT
// ============================================

// Logout revokes a specific refresh token
func (uc *authUseCase) Logout(ctx context.Context, userID uuid.UUID, refreshToken string) error {
	// Revoke the specific refresh token
	return uc.tokenRepo.Revoke(ctx, refreshToken)
}

// LogoutAll revokes all refresh tokens for a user (logout from all devices)
func (uc *authUseCase) LogoutAll(ctx context.Context, userID uuid.UUID) error {
	// Revoke all refresh tokens
	return uc.tokenRepo.RevokeAllForUser(ctx, userID)
}

// ============================================
// HELPER FUNCTIONS (JWT)
// ============================================

// JWTClaims represents the JWT claims structure
// Claims = dữ liệu chứa trong JWT token
type JWTClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// generateAccessToken creates a new access token (short-lived: 15 minutes)
func (uc *authUseCase) generateAccessToken(user *domain.User) (string, error) {
	now := time.Now()

	claims := &JWTClaims{
		UserID: user.ID.String(),
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(uc.cfg.JWTAccessExpiration)), // 15 minutes
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "epr-user-service",
			Subject:   user.ID.String(),
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret key
	tokenString, err := token.SignedString([]byte(uc.cfg.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// generateRefreshToken creates a new refresh token (long-lived: 7 days)
func (uc *authUseCase) generateRefreshToken(user *domain.User) (string, error) {
	now := time.Now()

	claims := &JWTClaims{
		UserID: user.ID.String(),
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(uc.cfg.JWTRefreshExpiration)), // 7 days
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "epr-user-service",
			Subject:   user.ID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(uc.cfg.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// saveRefreshToken saves a refresh token to the database
func (uc *authUseCase) saveRefreshToken(ctx context.Context, userID uuid.UUID, tokenString string) error {
	now := time.Now()
	expiresAt := now.Add(uc.cfg.JWTRefreshExpiration).Unix()

	refreshToken := &repository.RefreshToken{
		ID:        uuid.New(),
		UserID:    userID,
		Token:     tokenString,
		ExpiresAt: expiresAt,
	}

	return uc.tokenRepo.Create(ctx, refreshToken)
}

// ============================================
// ERROR DEFINITIONS
// ============================================

var (
	// ErrEmailAlreadyExists is returned when email is already registered
	ErrEmailAlreadyExists = errors.New("email already exists")

	// ErrInvalidCredentials is returned when email or password is incorrect
	ErrInvalidCredentials = errors.New("invalid email or password")

	// ErrAccountInactive is returned when account is not active
	ErrAccountInactive = errors.New("account is inactive or deleted")

	// ErrInvalidRefreshToken is returned when refresh token is invalid
	ErrInvalidRefreshToken = errors.New("invalid refresh token")

	// ErrRefreshTokenExpired is returned when refresh token has expired
	ErrRefreshTokenExpired = errors.New("refresh token has expired")
)
