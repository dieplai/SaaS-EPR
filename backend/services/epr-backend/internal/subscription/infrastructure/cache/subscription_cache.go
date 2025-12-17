package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/epr-legal/epr-backend/internal/shared/infrastructure/cache"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/google/uuid"
)

const (
	subscriptionCacheTTL = 5 * time.Minute
	subscriptionKeyPrefix = "subscription:user:"
)

type SubscriptionCache struct {
	redis *cache.RedisClient
}

func NewSubscriptionCache(redis *cache.RedisClient) *SubscriptionCache {
	return &SubscriptionCache{redis: redis}
}

func (c *SubscriptionCache) GetActiveByUserID(ctx context.Context, userID uuid.UUID) (*subscription.Subscription, error) {
	key := fmt.Sprintf("%s%s", subscriptionKeyPrefix, userID.String())

	var sub subscription.Subscription
	if err := c.redis.GetJSON(ctx, key, &sub); err != nil {
		return nil, err
	}

	return &sub, nil
}

func (c *SubscriptionCache) SetActiveByUserID(ctx context.Context, userID uuid.UUID, sub *subscription.Subscription) error {
	key := fmt.Sprintf("%s%s", subscriptionKeyPrefix, userID.String())
	return c.redis.SetJSON(ctx, key, sub, subscriptionCacheTTL)
}

func (c *SubscriptionCache) InvalidateUser(ctx context.Context, userID uuid.UUID) error {
	key := fmt.Sprintf("%s%s", subscriptionKeyPrefix, userID.String())
	return c.redis.Delete(ctx, key)
}

func (c *SubscriptionCache) InvalidateAll(ctx context.Context) error {
	pattern := fmt.Sprintf("%s*", subscriptionKeyPrefix)
	return c.redis.DeletePattern(ctx, pattern)
}
