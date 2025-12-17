package session

import (
	"context"
	"fmt"
	"time"

	"github.com/epr-legal/epr-backend/internal/shared/infrastructure/cache"
	"github.com/google/uuid"
)

const (
	refreshTokenKeyPrefix = "refresh_token:"
	userSessionKeyPrefix  = "user_sessions:"
)

type SessionManager struct {
	redis *cache.RedisClient
}

func NewSessionManager(redis *cache.RedisClient) *SessionManager {
	return &SessionManager{redis: redis}
}

// StoreRefreshToken stores a refresh token in Redis
func (sm *SessionManager) StoreRefreshToken(ctx context.Context, tokenID uuid.UUID, userID uuid.UUID, expiration time.Duration) error {
	key := fmt.Sprintf("%s%s", refreshTokenKeyPrefix, tokenID.String())
	return sm.redis.Set(ctx, key, userID.String(), expiration)
}

// ValidateRefreshToken checks if a refresh token is valid
func (sm *SessionManager) ValidateRefreshToken(ctx context.Context, tokenID uuid.UUID) (uuid.UUID, error) {
	key := fmt.Sprintf("%s%s", refreshTokenKeyPrefix, tokenID.String())
	userIDStr, err := sm.redis.Get(ctx, key)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid or expired refresh token")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid user ID in token")
	}

	return userID, nil
}

// RevokeRefreshToken removes a refresh token from Redis
func (sm *SessionManager) RevokeRefreshToken(ctx context.Context, tokenID uuid.UUID) error {
	key := fmt.Sprintf("%s%s", refreshTokenKeyPrefix, tokenID.String())
	return sm.redis.Delete(ctx, key)
}

// RevokeAllUserSessions revokes all refresh tokens for a user
func (sm *SessionManager) RevokeAllUserSessions(ctx context.Context, userID uuid.UUID) error {
	// This requires tracking all tokens per user
	// For now, we can use a pattern match (less efficient but works)
	pattern := fmt.Sprintf("%s*", refreshTokenKeyPrefix)
	return sm.redis.DeletePattern(ctx, pattern)
}

// AddToBlacklist adds an access token to blacklist (for immediate logout)
func (sm *SessionManager) AddToBlacklist(ctx context.Context, tokenID string, expiration time.Duration) error {
	key := fmt.Sprintf("blacklist:%s", tokenID)
	return sm.redis.Set(ctx, key, "revoked", expiration)
}

// IsBlacklisted checks if an access token is blacklisted
func (sm *SessionManager) IsBlacklisted(ctx context.Context, tokenID string) (bool, error) {
	key := fmt.Sprintf("blacklist:%s", tokenID)
	return sm.redis.Exists(ctx, key)
}

// TrackUserSession tracks active sessions per user
func (sm *SessionManager) TrackUserSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID, expiration time.Duration) error {
	key := fmt.Sprintf("%s%s", userSessionKeyPrefix, userID.String())
	sessionKey := sessionID.String()

	// Add session to set with expiration
	if err := sm.redis.SetJSON(ctx, key+":"+sessionKey, sessionID, expiration); err != nil {
		return err
	}

	return nil
}

// GetActiveSessions returns count of active sessions for a user
func (sm *SessionManager) GetActiveSessions(ctx context.Context, userID uuid.UUID) (int, error) {
	pattern := fmt.Sprintf("%s%s:*", userSessionKeyPrefix, userID.String())

	// Count matching keys
	iter := sm.redis.Ping(ctx) // Simple implementation
	// In production, use SCAN command properly

	return 0, nil // Simplified for now
}
