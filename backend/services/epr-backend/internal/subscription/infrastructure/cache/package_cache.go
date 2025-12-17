package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/epr-legal/epr-backend/internal/shared/infrastructure/cache"
	packagedomain "github.com/epr-legal/epr-backend/internal/subscription/domain/package"
	"github.com/google/uuid"
)

const (
	packageCacheTTL       = 30 * time.Minute // Packages change rarely
	packageKeyPrefix      = "package:"
	packageListKey        = "packages:active"
)

type PackageCache struct {
	redis *cache.RedisClient
}

func NewPackageCache(redis *cache.RedisClient) *PackageCache {
	return &PackageCache{redis: redis}
}

func (c *PackageCache) GetByID(ctx context.Context, id uuid.UUID) (*packagedomain.Package, error) {
	key := fmt.Sprintf("%s%s", packageKeyPrefix, id.String())

	var pkg packagedomain.Package
	if err := c.redis.GetJSON(ctx, key, &pkg); err != nil {
		return nil, err
	}

	return &pkg, nil
}

func (c *PackageCache) SetByID(ctx context.Context, id uuid.UUID, pkg *packagedomain.Package) error {
	key := fmt.Sprintf("%s%s", packageKeyPrefix, id.String())
	return c.redis.SetJSON(ctx, key, pkg, packageCacheTTL)
}

func (c *PackageCache) GetActiveList(ctx context.Context) ([]*packagedomain.Package, error) {
	var packages []*packagedomain.Package
	if err := c.redis.GetJSON(ctx, packageListKey, &packages); err != nil {
		return nil, err
	}
	return packages, nil
}

func (c *PackageCache) SetActiveList(ctx context.Context, packages []*packagedomain.Package) error {
	return c.redis.SetJSON(ctx, packageListKey, packages, packageCacheTTL)
}

func (c *PackageCache) InvalidateByID(ctx context.Context, id uuid.UUID) error {
	key := fmt.Sprintf("%s%s", packageKeyPrefix, id.String())
	// Also invalidate list cache when a package changes
	return c.redis.Delete(ctx, key, packageListKey)
}

func (c *PackageCache) InvalidateAll(ctx context.Context) error {
	pattern := fmt.Sprintf("%s*", packageKeyPrefix)
	if err := c.redis.DeletePattern(ctx, pattern); err != nil {
		return err
	}
	return c.redis.Delete(ctx, packageListKey)
}
