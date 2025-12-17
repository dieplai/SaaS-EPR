package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/epr-legal/epr-backend/internal/shared/infrastructure/cache"
	"github.com/gin-gonic/gin"
)

type RateLimiter struct {
	redis *cache.RedisClient
}

func NewRateLimiter(redis *cache.RedisClient) *RateLimiter {
	return &RateLimiter{redis: redis}
}

// RateLimitByIP limits requests by IP address
func (rl *RateLimiter) RateLimitByIP(maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		key := fmt.Sprintf("rate_limit:ip:%s", ip)

		allowed, err := rl.checkRateLimit(c.Request.Context(), key, maxRequests, window)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "rate limiting error",
			})
			c.Abort()
			return
		}

		if !allowed {
			c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
			c.Header("X-RateLimit-Window", window.String())
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded",
				"message": fmt.Sprintf("Maximum %d requests per %s", maxRequests, window),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RateLimitByUser limits requests by authenticated user ID
func (rl *RateLimiter) RateLimitByUser(maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			// If no user ID, skip rate limiting or fall back to IP
			c.Next()
			return
		}

		key := fmt.Sprintf("rate_limit:user:%v", userID)

		allowed, err := rl.checkRateLimit(c.Request.Context(), key, maxRequests, window)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "rate limiting error",
			})
			c.Abort()
			return
		}

		if !allowed {
			c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
			c.Header("X-RateLimit-Window", window.String())
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded",
				"message": fmt.Sprintf("Maximum %d requests per %s", maxRequests, window),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// checkRateLimit implements sliding window rate limiting
func (rl *RateLimiter) checkRateLimit(ctx context.Context, key string, maxRequests int, window time.Duration) (bool, error) {
	// Check if key exists
	exists, err := rl.redis.Exists(ctx, key)
	if err != nil {
		return false, err
	}

	if !exists {
		// First request, set counter to 1 and set expiration
		if err := rl.redis.Set(ctx, key, 1, window); err != nil {
			return false, err
		}
		return true, nil
	}

	// Increment counter
	count, err := rl.redis.Incr(ctx, key)
	if err != nil {
		return false, err
	}

	// If this is the second request, ensure expiration is set
	if count == 2 {
		if err := rl.redis.Expire(ctx, key, window); err != nil {
			return false, err
		}
	}

	// Check if limit exceeded
	return count <= int64(maxRequests), nil
}

// GetRemainingRequests returns how many requests are left in the current window
func (rl *RateLimiter) GetRemainingRequests(ctx context.Context, key string, maxRequests int) (int, error) {
	count, err := rl.redis.Get(ctx, key)
	if err != nil {
		// Key doesn't exist, full quota available
		return maxRequests, nil
	}

	var currentCount int
	fmt.Sscanf(count, "%d", &currentCount)
	remaining := maxRequests - currentCount
	if remaining < 0 {
		remaining = 0
	}

	return remaining, nil
}
